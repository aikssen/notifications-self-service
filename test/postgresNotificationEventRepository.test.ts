import assert from 'node:assert/strict';
import test from 'node:test';
import type { Pool } from 'pg';

import { PostgresNotificationEventRepository } from '@/infrastructure/db/postgres/postgresNotificationEventRepository';

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
  const pool = {
    query: async () => queryResults.shift(),
  } as unknown as Pool;
  const repository = new PostgresNotificationEventRepository(pool);

  const result = await repository.findById(
    '8d72a2c3-a17a-453c-bdee-4b4cc8746974'
  );

  assert.ok(result);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].webhookUrl, 'https://example.com/webhook');
  assert.equal(result.attempts[0].requestMethod, 'POST');
  assert.deepEqual(result.attempts[0].requestPayload, { amount: 100 });
});
