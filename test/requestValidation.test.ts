import assert from 'node:assert/strict';
import test from 'node:test';

import { isDate, isUuid } from '@/infrastructure/http/requestValidation';

test('accepts UUID values and rejects malformed input', () => {
  assert.equal(isUuid('8d72a2c3-a17a-453c-bdee-4b4cc8746974'), true);
  assert.equal(isUuid('CLIENT001'), false);
  assert.equal(isUuid(['8d72a2c3-a17a-453c-bdee-4b4cc8746974']), false);
  assert.equal(isUuid(undefined), false);
});

test('accepts parseable dates and rejects malformed input', () => {
  assert.equal(isDate('2026-08-03T12:00:00Z'), true);
  assert.equal(isDate('2026-08-03'), true);
  assert.equal(isDate('not-a-date'), false);
  assert.equal(isDate(['2026-08-03']), false);
});
