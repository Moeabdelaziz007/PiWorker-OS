# Sovereign Engine Alert Runbook

## Dashboard KPIs

- `error_rate`: failed operations / total operations (rolling window of latest 500 ops).
- `p95_latency_ms`, `p99_latency_ms`: tail latency percentiles.
- `orchestrate_validation_fails`: cumulative validation failures from orchestration/plugin execution.

## Alert: high_error_rate

- Threshold: `>= 0.08` (8%).
- Cooldown: `5m`.
- Immediate checks:
  1. Inspect recent structured logs by `error_code` and `operation`.
  2. Confirm recent deploy/config change.
  3. Roll back if failure is auth/dependency regression.

## Alert: high_p95_latency_ms

- Threshold: `>= 900ms`.
- Cooldown: `10m`.
- Immediate checks:
  1. Verify upstream node/API latency (`PI_NODE_URL`, model providers).
  2. Compare p95 vs p99; if both high, system-wide issue.
  3. Scale worker pool or reduce expensive plugins.

## Alert: high_p99_latency_ms

- Threshold: `>= 1500ms`.
- Cooldown: `10m`.
- Immediate checks:
  1. Identify long-tail outliers (plugin id, tx id, external dependency).
  2. Enable degraded mode and queue low-priority work.

## Alert: orchestrate_validation_fails

- Threshold: `>= 5`.
- Cooldown: `15m`.
- Immediate checks:
  1. Validate deploy artifacts/signatures and schema inputs.
  2. Block offending source and open incident if repeated.

## Game Day (small)

1. Use synthetic failing plugin payloads (invalid signature or missing source code).
2. Generate enough failures to cross error-rate threshold in a small window.
3. Verify exactly one alert per rule during cooldown window.
4. Capture dashboard snapshot and log evidence in incident notes.
