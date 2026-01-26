import { NotificationEventRepository } from '@/domain/repositories/notificationEventRepository';
import { NotificationEventState } from '@/domain/value-objects/notificationEventState';
import { DispatchSource } from '@/domain/value-objects/dispatchSource';
import { KafkaProducerPort } from '@/application/ports/kafkaProducerPort';

interface ReplayNotificationEventCommand {
  notificationEventId: string;
  clientId: string;
}

export class ReplayNotificationEvent {
  constructor(
    private readonly eventRepository: NotificationEventRepository,
    private readonly kafkaProducer: KafkaProducerPort
  ) {}

  async execute(command: ReplayNotificationEventCommand) {
    const result = await this.eventRepository.findById(
      command.notificationEventId
    );

    if (!result) {
      throw new Error('Notification event not found');
    }

    const { event } = result;

    console.log('notificationEvent found', {event})

    if (event.clientId !== command.clientId) {
      throw new Error('Event does not belong to client');
    }

    if (event.state == NotificationEventState.FAILED) {
      throw new Error('Event cannot be replayed, already failed completely, a new event must be generated');
    }

    if (event.state == NotificationEventState.DELIVERED) {
      throw new Error('Event cannot be replayed, already delivered');
    }

    await this.eventRepository.updateState(
      event.id,
      NotificationEventState.RETRYING
    );

    await this.kafkaProducer.publish({
      event_id: event.eventId,
      client_id: event.clientId,
      event_type: event.eventType,
      event_payload: event.eventPayload,
      dispatch_source: DispatchSource.SELF_SERVICE,
      timestamp: new Date().toISOString(),
    });

    return {
      notification_event_id: event.id,
      client_id: event.clientId,
      state: NotificationEventState.RETRYING,
      message: 'Replay scheduled',
    };
  }
}