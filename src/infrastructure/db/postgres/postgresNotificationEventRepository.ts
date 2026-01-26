import { Pool } from 'pg';

import { NotificationEventRepository } from '@/domain/repositories/notificationEventRepository';
import { NotificationEvent } from '@/domain/entities/notificationEvent';
import { NotificationAttempt } from '@/domain/entities/notificationAttempt';
import { NotificationEventState } from '@/domain/value-objects/notificationEventState';

export class PostgresNotificationEventRepository
    implements NotificationEventRepository {

    constructor(private readonly pool: Pool) { }

    async findAllByClient(clientId: string): Promise<NotificationEvent[]> {
        const result = await this.pool.query(
            `
    SELECT
      id,
      event_id,
      client_id,
      event_type,
      event_payload,
      state,
      created_at,
      updated_at
    FROM notification_events
    WHERE client_id = $1
    ORDER BY created_at DESC
    `,
            [clientId]
        );

        return result.rows.map(row =>
            new NotificationEvent(
                row.id,
                row.event_id,
                row.client_id,
                row.event_type,
                row.event_payload,
                row.state,
                row.created_at,
                row.updated_at
            )
        );
    }

    async findById(
        notificationEventId: string
    ): Promise<{ event: NotificationEvent; attempts: NotificationAttempt[] } | null> {

        const eventResult = await this.pool.query(
            `
      SELECT *
      FROM notification_events
      WHERE id = $1
      `,
            [notificationEventId]
        );

        if (eventResult.rowCount === 0) {
            return null;
        }

        const attemptsResult = await this.pool.query(
            `
      SELECT *
      FROM notification_attempts
      WHERE notification_event_id = $1
      ORDER BY attempt_number ASC
      `,
            [notificationEventId]
        );

        return {
            event: this.mapEvent(eventResult.rows[0]),
            attempts: attemptsResult.rows.map(this.mapAttempt),
        };
    }

    async updateState(
        notificationEventId: string,
        state: NotificationEventState
    ): Promise<void> {
        await this.pool.query(
            `
    UPDATE notification_events
    SET state = $2, updated_at = now()
    WHERE id = $1
    `,
            [notificationEventId, state]
        );
    }

    // -------------------------
    // Mappers (private)
    // -------------------------

    private mapEvent(row: any): NotificationEvent {
        return new NotificationEvent(
            row.id,
            row.event_id,
            row.client_id,
            row.event_type,
            row.event_payload,
            row.state,
            row.created_at,
            row.updated_at
        );
    }

    private mapAttempt(row: any): NotificationAttempt {
        return new NotificationAttempt(
            row.attempt_number,
            row.dispatch_source,
            row.status,
            row.webhookUrl,
            row.requestMethod,
            row.requestPayload,
            row.response_status,
            row.response_body,
            row.error_message,
            row.attempted_at
        );
    }
}