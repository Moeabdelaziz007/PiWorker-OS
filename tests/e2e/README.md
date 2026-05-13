# Sovereign E2E Suite

There is one lane. It is real. No mocks, no in-process gateways, no fixture
tokens. A green run means the suite actually exercised a deployed Sovereign
Engine.

The previous simulation harness (`sovereign-critical-path.e2e.test.mjs`,
`offline-simulation.ts`, `neural-fiscal-loop.test.ts`, `sandbox-audit.spec.ts`
and the corresponding mocked artifacts under `tests/e2e/artifacts/`) has been
removed. The `test:tier4` script is no longer a no-op; it is an alias for
`test:e2e:real`.

## Real lane

`tests/e2e/real/sovereign-critical-path.real.e2e.test.mjs`

Required env (the suite exits non-zero before running any test if any of
these are missing):

| Variable | Purpose |
|----------|---------|
| `SOVEREIGN_STAGING_URL` | Base URL of the deployed engine. `SOVEREIGN_ENGINE_URL` is accepted as a fallback. |
| `SOVEREIGN_AUTH_TOKEN`  | Real bearer token for the `X-Sovereign-Token` header on staging. |
| `AGENT_SYSTEM_SECRET`   | HMAC secret used to sign plugin source for `/api/sovereign/execute`. |

Optional:

| Variable | Default | Purpose |
|----------|---------|---------|
| `REAL_E2E_TIMEOUT_MS` | `15000` | Per-request timeout. |
| `REAL_E2E_RETRIES`    | `2`     | Retries on 408/429/5xx only. |
| `REAL_E2E_AGENT_ID`   | `agent-real-e2e` | Agent id for payment/escrow. |
| `REAL_E2E_AMOUNT_PI`  | `0.0001` | Pi amount for escrow scenario; keep tiny. |

Run it with:

```bash
SOVEREIGN_STAGING_URL=https://staging.piworker.example \
SOVEREIGN_AUTH_TOKEN=... \
AGENT_SYSTEM_SECRET=... \
npm run test:e2e:real
```

Scenarios exercised:

1. `health` &mdash; `GET /health`
2. `status` &mdash; `GET /api/status` (must report ONLINE/OPERATIONAL)
3. `execute` &mdash; `POST /api/sovereign/execute` with a real HMAC signature
4. `simulate` &mdash; `POST /api/sovereign/simulate`
5. `lock-escrow` &mdash; `POST /api/sovereign/lock-escrow`
6. `events` &mdash; `GET /events` SSE reachability probe

Each scenario records `duration_ms`, `status`, `attempts`, and `outcome`.

## Artifacts and baseline

Every run writes two files under `tests/e2e/artifacts/`:

- `real-run-<ISO>.json` (immutable history, one per run)
- `real-latest.json` (overwritten each run)

Aggregate the historical artifacts into a single baseline with:

```bash
npm run test:e2e:baseline
```

This emits `tests/e2e/artifacts/baseline-metrics.json` containing per-scenario
p50/p95 duration, per-scenario success rate, and the top failing endpoint
across all recorded runs. Commit a `baseline-metrics.json` snapshot when you
declare a release candidate green so regressions are easy to spot.

## Cadence

- **PR CI**: `npm run test:e2e:real` against a stable staging deployment.
- **Nightly / pre-release**: `npm run test:e2e:real` followed by
  `npm run test:e2e:baseline`, with the resulting `baseline-metrics.json`
  diffed against the previously committed snapshot.

If staging is unavailable, the suite fails. That is by design: a passing E2E
build must mean we actually talked to staging.
