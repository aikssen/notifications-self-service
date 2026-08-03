import assert from 'node:assert/strict';
import test from 'node:test';

import { ReplayNotificationEvent } from '@/application/use-cases/replayNotificationEvent';
import { NotificationEvent } from '@/domain/entities/notificationEvent';
import { NotificationEventRepository } from '@/domain/repositories/notificationEventRepository';
import { NotificationEventState } from '@/domain/value-objects/notificationEventState';

const clientId = 'd11a7925-0287-4495-9876-5b3d02056141';

function createUseCase(
  state: NotificationEventState,
  publishError?: Error
) {
  const event = new NotificationEvent(
    '8d72a2c3-a17a-453c-bdee-4b4cc8746974',
    '593bb5af-6ffd-4b09-a61d-456835235ed8',
    clientId,
    'payment.created',
    { amount: 100 },
    state,
    new Date(),
    new Date()
  );
  const stateUpdates: NotificationEventState[] = [];
  const publishedEvents: unknown[] = [];

  const eventRepository: NotificationEventRepository = {
    findById: async () => ({ event, attempts: [] }),
    updateState: async (_eventId, nextState) => {
      stateUpdates.push(nextState);
    },
    findAllByClient: async () => [],
  };

  const useCase = new ReplayNotificationEvent(eventRepository, {
    publish: async publishedEvent => {
      if (publishError) throw publishError;
      publishedEvents.push(publishedEvent);
    },
  });

  return { event, useCase, stateUpdates, publishedEvents };
}

test('schedules replay when the event is FAILED', async () => {
  const { event, useCase, stateUpdates, publishedEvents } = createUseCase(
    NotificationEventState.FAILED
  );

  const result = await useCase.execute({
    notificationEventId: event.id,
    clientId,
  });

  assert.equal(result.state, NotificationEventState.RETRYING);
  assert.deepEqual(stateUpdates, [NotificationEventState.RETRYING]);
  assert.equal(publishedEvents.length, 1);
});

test('restores FAILED when Kafka publication fails', async () => {
  const publishError = new Error('Kafka unavailable');
  const { event, useCase, stateUpdates, publishedEvents } = createUseCase(
    NotificationEventState.FAILED,
    publishError
  );

  await assert.rejects(
    useCase.execute({ notificationEventId: event.id, clientId }),
    error => error === publishError
  );

  assert.deepEqual(stateUpdates, [
    NotificationEventState.RETRYING,
    NotificationEventState.FAILED,
  ]);
  assert.equal(publishedEvents.length, 0);
});

for (const state of [
  NotificationEventState.PENDING,
  NotificationEventState.RETRYING,
  NotificationEventState.DELIVERED,
]) {
  test(`rejects replay when the event is ${state}`, async () => {
    const { event, useCase, stateUpdates, publishedEvents } = createUseCase(state);

    await assert.rejects(
      useCase.execute({ notificationEventId: event.id, clientId }),
      { message: 'Only failed events can be replayed' }
    );
    assert.equal(stateUpdates.length, 0);
    assert.equal(publishedEvents.length, 0);
  });
}
