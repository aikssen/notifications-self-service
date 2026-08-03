import assert from 'node:assert/strict';
import test from 'node:test';
import type { Pool } from 'pg';

import { PostgresNotificationEventRepository } from '@/infrastructure/db/postgres/postgresNotificationEventRepository';
import { NotificationEventState } from '@/domain/value-objects/notificationEventState';

test('applies creation date and delivery status filters', async () => {
  const queries: Array<{ text: string; values: unknown[] }> = [];
  const pool = {
    query: async (text: string, values: unknown[]) => {
      queries.push({ text, values });
      return { rowCount: 0, rows: [] };
    },
  } as unknown as Pool;
  const repository = new PostgresNotificationEventRepository(pool);

  await repository.findAllByClient(
    'd11a7925-0287-4495-9876-5b3d02056141',
    {
      createdFrom: '2026-08-01T00:00:00Z',
      createdTo: '2026-08-03T23:59:59Z',
      deliveryStatus: NotificationEventState.FAILED,
    }
  );

  assert.match(queries[0].text, /created_at >= \$2/);
  assert.match(queries[0].text, /created_at <= \$3/);
  assert.match(queries[0].text, /state = \$4/);
  assert.deepEqual(queries[0].values, [
    'd11a7925-0287-4495-9876-5b3d02056141',
    '2026-08-01T00:00:00Z',
    '2026-08-03T23:59:59Z',
    NotificationEventState.FAILED,
  ]);
});

test('maps snake_case attempt columns returned by PostgreSQL', async () => {
  const attemptedAt = new Date('2026-08-03T12:00:00.000Z');
  const queryResults = [
    {
      rowCount: 1,
      rows: [
        {
          id: '8d72a2c3-a17a-453c-bdee-4b4cc8746974',
          event_id: '593bb5af-6ffd-4b09-a61d-456835235ed8',
          client_id: 'd11a7925-0287-4495-9876-5b3d02056141',
          event_type: 'payment.created',
          event_payload: { amount: 100 },
          state: 'FAILED',
          created_at: attemptedAt,
          updated_at: attemptedAt,
        },
      ],
    },
    {
      rowCount: 1,
      rows: [
        {
          attempt_number: 1,
          dispatch_source: 'SYSTEM',
          status: 'FAILED',
          webhook_url: 'https://example.com/webhook',
          request_method: 'POST',
          request_payload: { amount: 100 },
          response_status: 422,
          response_body: { error: 'invalid payload' },
          error_message: 'Unexpected HTTP status',
          attempted_at: attemptedAt,
        },
      ],
    },
  ];
  const queries: Array<{ text: string; values: unknown[] }> = [];
  const pool = {
    query: async (text: string, values: unknown[]) => {
      queries.push({ text, values });
      return queryResults.shift();
    },
  } as unknown as Pool;
  const repository = new PostgresNotificationEventRepository(pool);

  const result = await repository.findById(
    '8d72a2c3-a17a-453c-bdee-4b4cc8746974',
    'd11a7925-0287-4495-9876-5b3d02056141'
  );

  assert.ok(result);
  assert.match(queries[0].text, /WHERE id = \$1 AND client_id = \$2/);
  assert.deepEqual(queries[0].values, [
    '8d72a2c3-a17a-453c-bdee-4b4cc8746974',
    'd11a7925-0287-4495-9876-5b3d02056141',
  ]);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].webhookUrl, 'https://example.com/webhook');
  assert.equal(result.attempts[0].requestMethod, 'POST');
  assert.deepEqual(result.attempts[0].requestPayload, { amount: 100 });
});
