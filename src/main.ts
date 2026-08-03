import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Kafka } from 'kafkajs';

// Infra - DB
import { postgresPool } from '@/infrastructure/db/postgres/postgresPool';
import { PostgresNotificationEventRepository } from '@/infrastructure/db/postgres/postgresNotificationEventRepository';

// Infra - Kafka
import { KafkaProducerAdapter } from '@/infrastructure/kafka/kafkaProducerAdapter';

// Use cases
import { ListNotificationEvents } from '@/application/use-cases/listNotificationEvents';
import { GetNotificationEventDetail } from '@/application/use-cases/getNotificationEventDetail';
import { ReplayNotificationEvent } from '@/application/use-cases/replayNotificationEvent';

// Controllers
import { notificationEventController } from '@/infrastructure/http/notificationEventController';
import { replayNotificationEventController } from '@/infrastructure/http/replayNotificationEventController';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3002);

async function bootstrap() {
  console.log('Self-service starting');

  // ------------------------------------------------------------------
  // Infra setup
  // ------------------------------------------------------------------

  const kafka = new Kafka({
    clientId: 'notifications-self-service',
    brokers: process.env.KAFKA_BROKERS!.split(','),
  });

  const producer = kafka.producer();
  await producer.connect();

  const kafkaProducer = new KafkaProducerAdapter(
    producer,
    process.env.KAFKA_TOPIC!
  );

  // ------------------------------------------------------------------
  // Repositories
  // ------------------------------------------------------------------

  const notificationEventRepository =
    new PostgresNotificationEventRepository(postgresPool);

  // ------------------------------------------------------------------
  // Use cases
  // ------------------------------------------------------------------

  const listNotificationEvents =
    new ListNotificationEvents(notificationEventRepository);

  const getNotificationEventDetail =
    new GetNotificationEventDetail(notificationEventRepository);

  const replayNotificationEvent =
    new ReplayNotificationEvent(
      notificationEventRepository,
      kafkaProducer
    );

  // ------------------------------------------------------------------
  // Controllers
  // ------------------------------------------------------------------

  app.use(
    '/',
    notificationEventController(
      listNotificationEvents,
      getNotificationEventDetail
    ),
    replayNotificationEventController(
      replayNotificationEvent
    ),
  );

  // ------------------------------------------------------------------
  // Start server
  // ------------------------------------------------------------------

  const server = app.listen(PORT, () => {
    console.log(`Self-service API running on port ${PORT}`);
  });

  let shuttingDown = false;

  async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Received ${signal}, shutting down self-service`);

    let exitCode = 0;

    try {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    } catch (error) {
      exitCode = 1;
      console.error('Failed to close HTTP server', error);
    }

    try {
      await producer.disconnect();
    } catch (error) {
      exitCode = 1;
      console.error('Failed to disconnect Kafka producer', error);
    }

    try {
      await postgresPool.end();
    } catch (error) {
      exitCode = 1;
      console.error('Failed to close PostgreSQL pool', error);
    }

    if (exitCode === 0) {
      console.log('Self-service stopped');
    }

    process.exitCode = exitCode;
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }
}

bootstrap().catch(err => {
  console.error('Failed to start self-service', err);
  process.exit(1);
});
