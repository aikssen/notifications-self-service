export class NotificationEvent {
  constructor(
    public readonly id: string, // notification_event_id
    public readonly eventId: string,
    public readonly clientId: string,
    public readonly eventType: string,
    public readonly eventPayload: any,
    public readonly state: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}