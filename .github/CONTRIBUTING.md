# Contributing to PiWorker-OS

Welcome to the Sovereign Agent Economy. We are building a future where agents are autonomous, and our engineering standards must reflect that level of responsibility.

## The Clean Room Engineering Rule
**Crucial:** We do NOT accept legacy code, copy-pasted snippets from third-party frameworks, or unverified libraries.
1. **Logic Extraction:** You may study existing solutions, but you must extract the *logic* and rewrite the implementation from scratch for PiWorker-OS.
2. **Zero Mocks:** PRs containing mocks or "TODO" comments in core logic will be rejected.
3. **Type Safety:** All contributions must be 100% type-safe. No `any` types.

## Contribution Workflow
1. **Fork the Repo:** Work on your own branch.
2. **Create a Task:** Every significant change must have an associated Issue explaining the ROI or architectural impact.
3. **Zod Validation:** All data structures must include Zod schemas for runtime validation.
4. **Submit PR:** Ensure your PR passes the CI/CD pipeline (`npx tsc --noEmit`).

## Standards
- **Naming:** Follow the `MAS-ZERO` naming conventions (e.g., `QuantumMirror`, `ProfitVortex`).
- **Security:** Ensure all plugin execution happens within the defined sandbox boundaries.
- **Documentation:** Update `docs/ARCHITECTURE.md` if you modify core engine logic.

Thank you for helping us build a sovereign future.
