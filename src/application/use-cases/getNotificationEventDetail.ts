import { NotificationEventRepository } from '@/domain/repositories/notificationEventRepository';
import { NotificationEvent } from '@/domain/entities/notificationEvent';
import { NotificationAttempt } from '@/domain/entities/notificationAttempt';

export type NotificationEventDetail = {
  event: NotificationEvent;
  attempts: NotificationAttempt[];
};

export class GetNotificationEventDetail {
  constructor(
    private readonly repository: NotificationEventRepository
  ) {}

  async execute(
    notificationEventId: string
  ): Promise<NotificationEventDetail | null> {
    return this.repository.findById(notificationEventId);
  }
}