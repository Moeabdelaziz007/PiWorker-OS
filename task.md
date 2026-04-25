# Task: Hardening the Neural Brain Layer

## Goal
Establish a zero-defect, high-fidelity reasoning pipeline by hardening the `GemmaAdapter` and `NeuralOracle`, ensuring secure escalation from local private models (Gemma) to global multi-modal models (Gemini) with full fiscal auditability.

## Memory Context
- **Searched Patterns:** `GemmaAdapter`, `GeminiMultimodalOracle`, `Ollama`, `Local Fallback`, `Fiscal Trigger`.
- **Relevant Namespaces:** brain (Neural), finance (Fiscal), engine (Orchestration).

## Why now
The Brain Layer is the "Sovereign Decision Maker". If it relies on mocks or unverified fallbacks, the system's autonomy is compromised. Financial decisions (tool deployment) must be grounded in real reasoning.

## Scope
- `core/brain/gemma-adapter.ts`
- `core/brain/gemini-multimodal-oracle.ts`
- `core/brain/neural-memory.ts`

## Out of scope
- Training or fine-tuning models.
- Changing the gRPC bridge logic (already hardened).

## Risks / Ambiguities / Fragility
- **Ollama Availability:** If local Ollama is down, the system must handle the fallback gracefully without returning static "success" mocks.
- **API Key Leakage:** Ensure `GEMINI_API_KEY` is strictly handled (verified in preflight).
- **Infinite Reasoning Loops:** Prevent agents from recursively calling the oracle without budget constraints.

## Plan
1. [ ] Step 1: Replace `generateMockResponse` in `GemmaAdapter` with a restricted-but-real local analysis if Ollama is unreachable.
2. [ ] Step 2: Implement a "Reasoning Budget" in `NeuralOracle` to prevent fiscal drain during autonomous audits.
3. [ ] Step 3: Harder synchronization between `NeuralMemoryMesh` and the `GemmaAdapter` context window.
4. [ ] Step 4: Verify the "Neural-Fiscal Handshake" (Tool deployment triggers real Pi deduction).

## Verification
- [x] 2x `search-memory` calls executed before coding
- [ ] typecheck (`npx tsc --noEmit`)
- [ ] build (`npm run build`)
- [ ] targeted test (Ollama offline/online transition)
- [ ] 1x `add-memory` call executed (with Git metadata)

## Done when
- `GemmaAdapter` and `NeuralOracle` have zero hardcoded "success" mocks.
- The system correctly escalates complex tasks to Gemini while deducting Pi from the treasury for tool usage.

## Commit format
`refactor(brain): harden neural oracle and reasoning escalation logic`
