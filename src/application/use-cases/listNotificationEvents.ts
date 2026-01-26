import { NotificationEventRepository } from '@/domain/repositories/notificationEventRepository';
import { NotificationEvent } from '@/domain/entities/notificationEvent';

export class ListNotificationEvents {
  constructor(
    private readonly repository: NotificationEventRepository
  ) {}

  async execute(clientId: string): Promise<NotificationEvent[]> {
    return this.repository.findAllByClient(clientId);
  }
}