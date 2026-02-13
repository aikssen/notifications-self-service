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

  app.listen(PORT, () => {
    console.log(`Self-service API running on port ${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start self-service', err);
  process.exit(1);
});