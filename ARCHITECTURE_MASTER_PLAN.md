# PiWorker-OS: Sovereign Architecture & Global Integration Plan (A-Z)

## 1. The Vision

Transforming PiWorker-OS into a **Sovereign Agent Operating System (OS)** built on the **Pi Network Blockchain**. The mission is to leverage the **Pi Developer Studio** ecosystem, integrating **Google Gemini** for high-level reasoning and **π0.7 (OpenPI)** for advanced robotics control. We are building the foundational layer for the **Pi Network Economy**.

---

## 2. Technical Stack (The "Google-Native" Approach)

| Layer                 | Technology                | Reason                                          |
| :-------------------- | :------------------------ | :---------------------------------------------- |
| **Sovereign Core**    | **Go 1.25**               | Native speed, gRPC excellence, Google-original. |
| **Neural Engine**     | **Gemini 1.5 Pro**        | Multimodal reasoning via Go SDK.                |
| **Durable Execution** | **DBOS-Transact**         | Ensures tasks resume after crash/restart.       |
| **Communication**     | **gRPC / Protobuf**       | Binary protocol, 10x faster than REST.          |
| **Orchestrator**      | **Next.js 15 (React 19)** | State-of-the-art UI, Edge ready.                |
| **Deployment**        | **Vercel + Google Cloud** | Global UI + High Performance Compute.           |

---

## 3. The Data Flow (A-Z Mapping)

### A. Intent Ingestion (Next.js)

1. User enters a goal in the UI.
2. Next.js 15 Server Action validates session.
3. Request sent via **gRPC** to the Go Sovereign Engine.

### B. Sovereign Reasoning (Go + Gemini)

1. Go receives the request.
2. **DBOS** records the intent start (Durable state).
3. Go calls **Gemini 1.5 Pro** to decompose the goal into subtasks.
4. Parallel **Goroutines** simulate outcome scenarios (Quantum Mirror).

### C. Execution & Settlement (Go + Pi Ledger)

1. Final subtasks are dispatched to π0.7 (Physical) or Digital Plugins.
2. Go verifies completion natively via **LedgerConnector**.
3. Rewards are calculated and locked in escrow.

### D. UI Feedback (Next.js)

1. Go streams results back via gRPC.
2. UI updates in real-time with "Cyberpunk" telemetry.

---

## 4. Implementation Steps (Next 10-15 Minutes)

### Phase 1: The Sovereign Contract (gRPC Sync)

- [x] Update `sovereign.proto` to include Gemini reasoning fields.
- [x] Generate Go PB files.

### Phase 2: The Gemini-Go Integration

- [x] Implement `gemini_client.go` using the official Google SDK.
- [x] Connect `QuantumMirror` to Gemini for real reasoning.

### Phase 3: The Durable Bridge (Sovereign Journal)

- [x] Wrap Go handlers in `SovereignJournal` transactions for 100% reliability.
- [x] Implement recovery logic for unfinished intents on startup.

### Phase 4: Vercel Production Hardening

- [ ] Fix environment variables for the Go bridge.
- [ ] Ensure `axiomid.app` points to the unified infrastructure.

---

## 5. Security & Sovereignty

- **Identity**: All agents must have a valid `AxiomDID`.
- **Privacy**: Go Engine runs in an isolated sandbox.
- **Finance**: No private keys stored in the UI. All signing happens in the Go Core.
