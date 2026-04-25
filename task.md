# Task: Phase 15 - Durable Sovereign Execution (Journaling)

### Goal
Implement atomic durability for critical gRPC operations (Payments, Physical Intent, Sandbox Execution) by integrating the `SovereignJournal`. This ensures that every sovereign action is recorded before execution and committed upon success.

### Memory Context
- **Searched Patterns:** `SovereignJournal` in `journal.go` is an append-only log. `SovereignServer` in `server.go` has it initialized but unused in methods.
- **Relevant Namespaces:** backend (Go Engine), durability (Journaling).

### Why now
We have achieved "Sovereign" status with the physical bridge and neural simulation. Now we must achieve "Indestructible" status. Financial and physical intents must be recoverable after any system failure.

### Scope
- `sidecar/sovereign-engine/pkg/server/server.go` (Integration)
- `sidecar/sovereign-engine/pkg/engine/journal.go` (State management)

### Out of scope
- Migrating to a full SQL database.
- Modifying the Next.js UI.

### Risks / Ambiguities / Fragility
- **I/O Bottlenecks**: Writing to disk on every gRPC call. Go's `os.O_APPEND` is efficient, but we must monitor performance.
- **Atomic Failure**: If the journal write fails, the entire operation must abort to prevent "ghost" executions.

### Plan
1. [x] Step 1: Wrap `CommitPayment` in `Begin`/`Commit` journal entries.
2. [x] Step 2: Integrate journaling into `SendEmbodiedIntent`.
3. [x] Step 3: Record Sandbox execution starts in the journal.
4. [x] Step 4: Enhance the startup recovery logic to provide detailed logs.

### Verification
- [x] 2x `search-memory` calls executed (Journal and Server structures verified)
- [x] Go Build: `go build ./sidecar/sovereign-engine/...`
- [x] Log Audit: Verify `data/sovereign.journal` contains the correct JSON entries.
- [ ] 1x `add-memory` call executed upon completion.

### Done when
- Every successful payment and physical intent has a corresponding `BEGIN` and `COMMIT` pair in the journal file.
- The Go engine can correctly identify "Unfinished Intents" during the boot sequence.

### Commit format
`feat(durability): implement sovereign journal integration for atomic operations`
