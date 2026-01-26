import { NotificationEventState } from '@/domain/value-objects/notificationEventState';
import { NotificationEvent } from '@/domain/entities/notificationEvent';
import { NotificationAttempt } from '@/domain/entities/notificationAttempt';

export interface NotificationEventRepository {
  findById(
    id: string
  ): Promise<{
    event: NotificationEvent;
    attempts: NotificationAttempt[];
  } | null>;

  updateState(
    notificationEventId: string,
    state: NotificationEventState
  ): Promise<void>;

  findAllByClient(clientId: string): Promise<NotificationEvent[]>;
}