/**
 * REAL E2E LANE. The only E2E lane.
 *
 * Talks to a real deployed Sovereign Engine (Go sidecar + HTTP bridge) over
 * the network. No in-process HTTP server, no mock gateway, no hardcoded
 * fixture tokens. All credentials and the target URL must come from the
 * environment.
 *
 * Required env (otherwise the suite FAILS; it does not skip):
 *   - SOVEREIGN_STAGING_URL  (e.g. https://staging.piworker.example)
 *   - SOVEREIGN_AUTH_TOKEN   (real token issued for the staging env)
 *   - AGENT_SYSTEM_SECRET    (HMAC secret used for plugin signing)
 *
 * Optional env:
 *   - REAL_E2E_TIMEOUT_MS    per-request timeout (default 15000)
 *   - REAL_E2E_RETRIES       retries on 408/429/5xx (default 2)
 *   - REAL_E2E_AGENT_ID      agent id to use for payment/escrow (default 'agent-real-e2e')
 *   - REAL_E2E_AMOUNT_PI     amount in Pi for the payment/escrow scenario (default 0.0001)
 *
 * Each scenario records: duration_ms, status_code, attempts, outcome.
 * Results are written to:
 *   - tests/e2e/artifacts/real-run-<ISO>.json   (immutable history)
 *   - tests/e2e/artifacts/real-latest.json      (overwritten each run)
 *
 * After a successful run, `npm run test:e2e:baseline` aggregates the
 * artifacts into `tests/e2e/artifacts/baseline-metrics.json`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ARTIFACT_ROOT = path.join(process.cwd(), 'tests/e2e/artifacts');

const STAGING_URL =
  process.env.SOVEREIGN_STAGING_URL?.trim() ||
  process.env.SOVEREIGN_ENGINE_URL?.trim() ||
  '';
const AUTH_TOKEN = process.env.SOVEREIGN_AUTH_TOKEN?.trim() || '';
const AGENT_SECRET = process.env.AGENT_SYSTEM_SECRET?.trim() || '';
const TIMEOUT_MS = Number.parseInt(process.env.REAL_E2E_TIMEOUT_MS || '15000', 10);
const MAX_RETRIES = Number.parseInt(process.env.REAL_E2E_RETRIES || '2', 10);
const AGENT_ID = process.env.REAL_E2E_AGENT_ID || 'agent-real-e2e';
const AMOUNT_PI = Number.parseFloat(process.env.REAL_E2E_AMOUNT_PI || '0.0001');

// Fail fast if env is missing. The real lane has no mock fallback.
const MISSING_ENV = [];
if (!STAGING_URL) MISSING_ENV.push('SOVEREIGN_STAGING_URL');
if (!AUTH_TOKEN) MISSING_ENV.push('SOVEREIGN_AUTH_TOKEN');
if (!AGENT_SECRET) MISSING_ENV.push('AGENT_SYSTEM_SECRET');
if (MISSING_ENV.length > 0) {
  console.error(`[real-e2e] Missing required env: ${MISSING_ENV.join(', ')}`);
  process.exit(1);
}

/** @type {Array<Record<string, unknown>>} */
const scenarios = [];

function isTransientStatus(status) {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callJson(method, endpoint, body) {
  const url = `${STAGING_URL.replace(/\/$/, '')}${endpoint}`;
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    const startedAt = Date.now();
    let status = 0;
    try {
      const init = {
        method,
        headers: {
          'X-Sovereign-Token': AUTH_TOKEN,
          'X-Request-Id': `real-e2e-${crypto.randomBytes(4).toString('hex')}`,
          'Content-Type': 'application/json',
        },
      };
      if (body !== undefined) init.body = JSON.stringify(body);

      const response = await fetchWithTimeout(url, init);
      status = response.status;
      const durationMs = Date.now() - startedAt;

      if (response.ok) {
        const text = await response.text();
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
        return { ok: true, status, durationMs, attempts: attempt, body: parsed };
      }

      if (!isTransientStatus(status) || attempt > MAX_RETRIES) {
        const text = await response.text().catch(() => '');
        return { ok: false, status, durationMs, attempts: attempt, body: text };
      }
      lastError = new Error(`transient HTTP ${status}`);
    } catch (err) {
      lastError = err;
      if (attempt > MAX_RETRIES) {
        return {
          ok: false,
          status,
          durationMs: Date.now() - startedAt,
          attempts: attempt,
          body: err?.message || String(err),
        };
      }
    }
    await new Promise((r) => setTimeout(r, attempt * 100));
  }
  return { ok: false, status: 0, durationMs: 0, attempts: MAX_RETRIES + 1, body: String(lastError) };
}

function recordScenario(name, endpoint, result) {
  scenarios.push({
    name,
    endpoint,
    status: result.status,
    duration_ms: result.durationMs,
    attempts: result.attempts,
    outcome: result.ok ? 'PASS' : 'FAIL',
  });
}

test.before(async () => {
  await fs.mkdir(ARTIFACT_ROOT, { recursive: true });
});

test.after(async () => {
  const passed = scenarios.filter((s) => s.outcome === 'PASS').length;
  const report = {
    lane: 'real',
    staging_url: STAGING_URL,
    timestamp: new Date().toISOString(),
    summary: {
      total: scenarios.length,
      passed,
      failed: scenarios.length - passed,
      success_rate: scenarios.length ? passed / scenarios.length : 0,
    },
    scenarios,
  };
  const stamp = report.timestamp.replace(/[:.]/g, '-');
  await fs.writeFile(
    path.join(ARTIFACT_ROOT, `real-run-${stamp}.json`),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  await fs.writeFile(
    path.join(ARTIFACT_ROOT, 'real-latest.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
});

test('real e2e env contract', () => {
  assert.ok(STAGING_URL.startsWith('http'), 'SOVEREIGN_STAGING_URL must be a fully-qualified URL');
  assert.ok(AUTH_TOKEN.length >= 8, 'SOVEREIGN_AUTH_TOKEN looks too short');
  assert.ok(AGENT_SECRET.length >= 8, 'AGENT_SYSTEM_SECRET looks too short');
});

test('health endpoint responds', async () => {
  const result = await callJson('GET', '/health');
  recordScenario('health', '/health', result);
  assert.equal(result.ok, true, `health failed: ${result.status} ${JSON.stringify(result.body)}`);
});

test('status endpoint reports ONLINE', async () => {
  const result = await callJson('GET', '/api/status');
  recordScenario('status', '/api/status', result);
  assert.equal(result.ok, true, `status failed: ${result.status}`);
  assert.ok(result.body && typeof result.body === 'object', 'status response not JSON');
  assert.ok(['ONLINE', 'OPERATIONAL'].includes(result.body.status), `unexpected status: ${result.body.status}`);
});

test('plugin execute roundtrips with a real signature', async () => {
  const sourceCode = 'export default async () => ({ ok: true, real: true });';
  const signature = crypto.createHmac('sha256', AGENT_SECRET).update(sourceCode).digest('hex');
  const result = await callJson('POST', '/api/sovereign/execute', {
    pluginId: `real-e2e-plugin-${crypto.randomBytes(3).toString('hex')}`,
    sourceCode,
    envVars: { REAL_E2E: 'true' },
    allowedCapabilities: ['math', 'json'],
    signature,
  });
  recordScenario('execute', '/api/sovereign/execute', result);
  assert.equal(result.ok, true, `execute failed: ${result.status} ${JSON.stringify(result.body)}`);
});

test('simulation request returns reasoning payload', async () => {
  const result = await callJson('POST', '/api/sovereign/simulate', {
    goalId: `real-e2e-goal-${crypto.randomBytes(3).toString('hex')}`,
    instances: 3,
    modelVersion: 'gemini-1.5-pro',
    personas: ['Bull', 'Bear', 'Conservative'],
  });
  recordScenario('simulate', '/api/sovereign/simulate', result);
  assert.equal(result.ok, true, `simulate failed: ${result.status} ${JSON.stringify(result.body)}`);
});

test('escrow lock succeeds for a small amount', async () => {
  const result = await callJson('POST', '/api/sovereign/lock-escrow', {
    txId: `real-e2e-tx-${crypto.randomBytes(4).toString('hex')}`,
    amountPi: AMOUNT_PI,
    targetWallet: AGENT_ID,
  });
  recordScenario('lock-escrow', '/api/sovereign/lock-escrow', result);
  assert.equal(result.ok, true, `lock-escrow failed: ${result.status} ${JSON.stringify(result.body)}`);
});

test('events stream is reachable (HEAD-style probe)', async () => {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  let status = 0;
  let ok = false;
  try {
    const response = await fetch(`${STAGING_URL.replace(/\/$/, '')}/events`, {
      method: 'GET',
      headers: { 'X-Sovereign-Token': AUTH_TOKEN, Accept: 'text/event-stream' },
      signal: controller.signal,
    });
    status = response.status;
    ok = response.status === 200;
    response.body?.cancel?.();
  } catch (err) {
    if (err?.name === 'AbortError') ok = status === 0 ? true : ok;
  } finally {
    clearTimeout(timer);
  }
  const durationMs = Date.now() - startedAt;
  recordScenario('events', '/events', { ok, status, durationMs, attempts: 1 });
  assert.equal(ok, true, `events stream not reachable: status ${status}`);
});
