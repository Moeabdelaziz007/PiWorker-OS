# Incident Runbooks

This document defines first-response and stabilization runbooks for the top PiWorker-OS incident classes.

## Global Incident Policy

- **Severity assignment:**
  - **SEV-1:** Customer-facing outage or financial correctness risk.
  - **SEV-2:** Degraded functionality with workaround.
  - **SEV-3:** Non-critical error with no immediate customer impact.
- **Default response target:** Acknowledge within 5 minutes, mitigation started within 15 minutes.
- **Communication cadence:** Every 15 minutes in incident channel until mitigated.
- **Rollback guardrail:** If mitigation is not on track within 20 minutes for SEV-1, execute rollback in staging then production.

---

## 1) Auth Outage Runbook

### Detection Signals

- Spikes in 401/403 across API routes.
- Sidecar `CommitPayment` calls return `REJECTED_UNAUTHORIZED`.
- Log signature: `AGENT_SYSTEM_SECRET is not set` or `Unauthorized Payment Attempt`.

### Immediate Triage

1. Confirm current secret is present in runtime:
   - `echo ${AGENT_SYSTEM_SECRET:+set}`
2. Validate auth-related environment values were injected by deploy.
3. Verify whether failures affect all traffic or a subset (single region/cluster).

### Mitigation Steps

1. Rehydrate missing secret from secret manager.
2. Restart affected pods/processes to pick up env updates.
3. If deploy introduced auth regression, rollback to previous artifact.
4. Validate success by issuing a known-good authenticated request.

### Exit Criteria

- 401/403 error rate returned to baseline.
- Authenticated synthetic check passes 3 consecutive runs.
- No new unauthorized alerts for 15 minutes.

---

## 2) Deploy Failure Runbook

### Detection Signals

- Failed CI/CD stage (build, migrations, post-deploy health checks).
- Elevated error rate immediately after rollout.
- Journal shows growing unfinished intents (`Replay()` non-empty).

### Immediate Triage

1. Freeze rollout.
2. Identify failed phase (build, release, startup, runtime).
3. Capture failing commit SHA and previous stable SHA.

### Mitigation Steps

1. Route traffic to last stable release.
2. Execute staging rollback validation script:
   - `./scripts/test-staging-rollback.sh`
3. If staging rollback passes, perform production rollback.
4. Reconcile active intents from journal before re-enabling deployment pipeline.

### Exit Criteria

- Rollback test passes in staging.
- Journal replay has no unresolved entries for payment namespace.
- Queue consistency check confirms no orphaned `PENDING` items after rollback.

---

## 3) Sidecar Crash Loop Runbook

### Detection Signals

- Pod/process repeatedly restarts.
- gRPC liveness/readiness probes failing.
- Startup log repeats journal recovery banner.

### Immediate Triage

1. Inspect latest crash logs for panic, OOM, or startup config errors.
2. Validate sidecar required env vars (`AGENT_SYSTEM_SECRET`, network endpoints).
3. Confirm write access to `data/` path for queue/journal durability files.

### Mitigation Steps

1. If regression from recent deploy, rollback sidecar image.
2. Temporarily reduce sidecar concurrency / disable non-critical plugins.
3. Repair invalid local state files if corruption is detected (backup first).
4. Restart one instance and verify healthy state before full scale-up.

### Exit Criteria

- No restarts for 30 minutes.
- gRPC health checks stable.
- Journal replay resolves to zero unfinished operational entries.

---

## 4) External AI Provider Degradation Runbook

### Detection Signals

- Elevated latency/timeouts from Gemini integration.
- Simulation throughput drops while queue backlog grows.
- Error signatures from bridge client connectivity paths.

### Immediate Triage

1. Confirm provider-side incident status.
2. Quantify impact: timeout rate, p95 latency, failed calls by endpoint.
3. Determine if degradation is regional or global.

### Mitigation Steps

1. Enable degraded-mode behavior (retries/backoff, reduced fan-out).
2. Shift traffic to fallback model/provider where possible.
3. Prioritize critical paths (payments, intent handling) over non-critical simulation jobs.
4. If side effects appear in queue growth, trigger staged rollback test before deploy actions.

### Exit Criteria

- Provider latency and error rates within SLO.
- Queue backlog trend is neutral or decreasing.
- Deferred workloads safely drained.

---

## Rollback Validation Workflow (Staging)

Use this before production rollback during deploy incidents.

1. Run scripted rollback test:
   - `./scripts/test-staging-rollback.sh`
2. The test simulates an interrupted transaction (journal `BEGIN` + queue `PENDING`), executes rollback (`FAIL` + queue status update), and asserts:
   - journal has no unresolved active entries after rollback;
   - queue has no `PENDING` items;
   - transaction identity and amount remain unchanged (data consistency).
3. Only proceed to production rollback when this test passes.
