# Security Governance Policy

## 1) Scope

This policy applies to every pull request merged into `main`, including application code, infrastructure code, API/proto contracts, and CI/CD workflows.

## 2) Required PR Security Gates

Every PR MUST pass all of the following checks:

1. **Dependency scanning**
   - `npm audit --audit-level=high --omit=dev`
   - `govulncheck ./...`
2. **Secret scanning**
   - `secretlint` and repository secret scanning workflow.
3. **Static analysis scanning**
   - `semgrep --config p/owasp-top-ten --error`
4. **Filesystem vulnerability scanning**
   - `trivy fs` (fail on `CRITICAL,HIGH`).

Any failing critical gate blocks merge.

## 3) Contract Tests for API/Proto Changes

For any PR that changes API or proto surface (e.g. `api/**`, `*.proto`, generated protobufs), contract tests are mandatory and must pass before merge.

## 4) Backward Compatibility Policy

### Versioning

- Public API/proto changes MUST follow semantic versioning principles:
  - Backward-compatible additions: **minor** version bump.
  - Breaking changes: **major** version bump.

### Deprecation window

- Deprecated fields/endpoints/RPCs must remain supported for at least **90 days** after deprecation notice.
- Deprecation notices must include:
  - exact deprecation date,
  - planned removal date,
  - migration path.

### Breaking-change controls

- Breaking changes require:
  - explicit approval from maintainers,
  - migration notes in release artifacts,
  - validation that consumers have a migration path.

## 5) Critical Findings SLA & Monitoring

### SLA

- **CRITICAL findings:** remediation or approved compensating control within **24 hours**.
- **HIGH findings:** remediation within **7 calendar days**.

### Monitoring & closure

- Security findings from CI/security tools must be triaged on every PR.
- Unresolved findings must be tracked with owner + due date.
- PRs introducing unapproved CRITICAL findings must not merge.

## 6) Exceptions

Any policy exception must include written risk acceptance, compensating controls, and an expiry date approved by maintainers.
