# Task: Phase 16 - Build Hardening & Zero-Defect State

### Goal
Resolve Vercel build failures (Webpack module not found), synchronize Go/TS contracts, and fix 9 identified points (3 errors, 3 bugs, 3 issues) to achieve a 100% stable production-ready state.

### Memory Context
- **Searched Patterns:** `SovereignBridge` imports in `app/page.tsx` causing client-side leakage. `next.config.js` missing `http2` and `dns` fallbacks.
- **Relevant Namespaces:** frontend (Next.js), backend (Go), orchestration (Bridge).

### Why now
The user is facing persistent build errors on Vercel. We cannot move forward with the "Sovereign Agent Economy" if the infrastructure cannot be deployed.

### Scope
- `core/engine/sovereign-bridge.ts` (Refactor)
- `next.config.js` (Fallbacks)
- `sidecar/sovereign-engine/pkg/pb/sovereign.pb.go` (Go registration)
- `api/index.go` (HTTP fallbacks)
- `app/page.tsx` (Error handling)

### Out of scope
- Adding new feature modules.
- Refactoring the entire Go engine logic.

### Risks / Ambiguities / Fragility
- **Dynamic Imports**: Using `await import` in `SovereignBridge` must be carefully tested in Next.js 15.
- **Go Mod**: Vercel Go builder might still struggle with root `go.mod` if paths aren't 100% correct.

### Plan
1. [x] Step 1: Add Webpack fallbacks (`http2`, `dns`, `os`, `stream`) to `next.config.js`.
2. [x] Step 2: Isolate gRPC logic in `core/engine/grpc-client.ts` and refactor `SovereignBridge` to be isomorphic.
3. [x] Step 3: Implement missing gRPC service registration in `sovereign.pb.go`.
4. [x] Step 4: Expand `api/index.go` to support all bridge methods (Payment, Escrow, Verify, Intent).
5. [x] Step 5: Fix specific bugs: `payload` undefined, empty SSE listener, and `node:crypto` browser errors.
6. [ ] Step 6: Final build verification and `add-memory` execution.

### Verification
- [x] 2x `search-memory` calls executed (Checked `openmemory.md` and grepped imports)
- [ ] typecheck (`npx tsc --noEmit`)
- [ ] build (`npm run build`)
- [ ] 1x `add-memory` call executed (with Git metadata)

### Done when
- `npm run build` passes locally without "Module not found" errors.
- Go engine successfully registers the SovereignServiceServer.
- All bridge methods have verified HTTP/1.1 fallbacks.

### Commit format
`fix(build): resolve webpack module errors and synchronize sovereign contracts`
