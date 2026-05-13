# `e2e-real` Policy (Critical Branch Merge Gate)

## Scope

- Applies to pull requests targeting `main` and to pushes on `main`.
- `e2e-real` is the real-environment E2E validation gate for staging infrastructure.

## When the job runs

The `e2e-real` CI job runs **only** when all required secrets are available:

- `SOVEREIGN_ENGINE_URL`
- `SOVEREIGN_AUTH_TOKEN`
- `AGENT_SYSTEM_SECRET`

If one or more required secrets are missing, the job is skipped by design.

## Merge protection rule

For critical branches (`main`):

- If `e2e-real` ends in `failure` or `cancelled`, `gate-critical-merge` fails and the merge is blocked.
- Teams should configure repository branch protection to require these status checks:
  - `build`
  - `e2e-real`
  - `gate-critical-merge`

## Artifacts retention

`e2e-real` uploads `tests/e2e/artifacts/` on every run (including failures) with 14-day retention.

## Bypass / override policy

Bypass is allowed only for emergency scenarios:

- staging outage unrelated to application code
- third-party dependency outage (provider/network)
- incident mitigation requiring immediate hotfix

### Required approvals

All bypasses require **both**:

1. Approval from the on-call engineering lead.
2. Approval from a code owner for the touched area.

### Required follow-up

When bypassing the gate, the PR must include:

- A short root-cause note and incident/ticket reference.
- A plan to re-run `e2e-real` after infrastructure recovery.
- Confirmation comment once the deferred `e2e-real` run passes.
