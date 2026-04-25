# Critical E2E Scenarios

This suite stabilizes the highest-priority sovereign flows with deterministic fixtures and explicit environment contracts.

## Scenarios

1. Sandbox plugin execution (happy path + invalid token)
2. Simulation request flow (gRPC available + HTTP fallback)
3. Payment/escrow critical path
4. Health/status endpoints and recovery behavior

## Determinism

All tests use fixed IDs and payloads from `DETERMINISTIC` constants in `sovereign-critical-path.e2e.test.mjs`.

## Required environment contract

- `SOVEREIGN_AUTH_TOKEN`
- `AGENT_SYSTEM_SECRET`
- `SOVEREIGN_ENGINE_URL`

The suite sets deterministic values in `beforeEach` and asserts they are present before every scenario.

## Retry policy

Retries are allowed only through `withTransientRetry`, which retries network/transient failures only:

- statuses: `408`, `429`, `500`, `502`, `503`, `504`
- network codes: `ECONNRESET`, `ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`

Invalid-token/auth failures are intentionally **not retried**.

## Artifacts

Each scenario writes a JSON artifact under `tests/e2e/artifacts/` containing:

- deterministic data snapshot
- event timeline
- scenario start/end timestamps

