import assert from 'node:assert/strict';
import test from 'node:test';

import { isUuid } from '@/infrastructure/http/requestValidation';

test('accepts UUID values and rejects malformed input', () => {
  assert.equal(isUuid('8d72a2c3-a17a-453c-bdee-4b4cc8746974'), true);
  assert.equal(isUuid('CLIENT001'), false);
  assert.equal(isUuid(['8d72a2c3-a17a-453c-bdee-4b4cc8746974']), false);
  assert.equal(isUuid(undefined), false);
});
