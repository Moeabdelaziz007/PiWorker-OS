import test from 'node:test';
import assert from 'node:assert/strict';

// Import from relative paths as configured in the project's ESM setup
// We target the core utilities directly as they have fewer dependencies
import { StructuredError } from '../core/utils/observability.ts';

/**
 * PiWorker-OS /api/orchestrate Validation Test
 *
 * This test targets the validation logic used in the orchestrate endpoint.
 * It verifies that StructuredError (used by the route) behaves as expected
 * for validation failures.
 */

test('Validation Logic: StructuredError for missing intent', () => {
  const error = new StructuredError('VALIDATION', 'Intent is required.', 400);

  assert.strictEqual(error.category, 'VALIDATION');
  assert.strictEqual(error.message, 'Intent is required.');
  assert.strictEqual(error.status, 400);
});

test('Validation Logic: StructuredError toResponseBody', () => {
  const error = new StructuredError('VALIDATION', 'Intent is required.', 400);
  const context = {
    requestId: 'req-123',
    correlationId: 'corr-123',
    authContext: 'ANONYMOUS'
  };

  const body = error.toResponseBody(context);

  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'Intent is required.');
  assert.strictEqual(body.category, 'VALIDATION');
  assert.strictEqual(body.requestId, 'req-123');
});
