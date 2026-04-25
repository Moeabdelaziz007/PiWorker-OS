# PiWorker-OS: Sovereign Hybrid Architecture

## 1. Vision: The Sovereign OS

PiWorker-OS is a **Sovereign Operating System** designed for the **Pi Network Ecosystem**. It leverages the **Go-Gemini-Google** Triple Alliance to bridge the gap between digital reasoning and physical action.

- **Pi Network**: The economic foundation and deployment target (Pi Developer Studio).
- **Google Gemini**: The multimodal "Brain" for reasoning, auditing, and goal decomposition.
- **Go Engine**: The "Muscle" for high-performance execution, security, and blockchain interaction.
- **Robotics (π0.7)**: The physical manifestation of agentic intent.

## 2. Sovereignty & Identity

PiWorker-OS is an independent digital state governed by **Amrikyy Lab**.

- **Identity Protocol**: All citizens (Agents) and Robotic assets use `did:piworker` identifiers issued by the **Amrikyy Lab Genesis Factory**.
- **Sovereign Governance**: Managed by **MAS-ZERO** (The Governance Layer).

## 3. Structural Layering

### Layer A: Orchestration (TypeScript/Next.js)

- **Role**: UI, High-level task delegation, and Agent Identity management.
- **Core Component**: `MASOrchestrator`.

### Layer B: Sovereign Engine (Go Sidecar)

- **Role**: High-concurrency simulations, Native Ledger interaction, and AI Flow Control.
- **Key Modules**:
  - `QuantumMirror`: 30+ parallel persona simulations.
  - `LedgerConnector`: Native Pi/Stellar/Soroban bridge.
  - `EscrowManager`: Zero-trust financial settlement (Physical-to-Digital).
  - `SovereignJournal`: Durable, append-only log for crash recovery and intent auditing.
  - `HybridIntelligence`: Multi-model routing (Gemini 3.1 Pro + Gemma 2) for cost-efficient reasoning.
  - `Pi-402 Protocol`: Agent-to-Agent micro-payment engine with Soroban settlement.

### Layer C: The Physical Layer (Robot Pi / π0.7)

- **π0.7 Embodied Intent**: A multimodal control protocol where MASOrchestrator dispatches visual subgoals and tactical instructions.
- **PoPW (Proof of Physical Work)**: Before payments are released, a visual audit is performed via the Gemini Multimodal Oracle.
- **Visual Feedback Loop**: Robot Pi sends visual feature vectors back to the Sovereign Engine for real-time path correction.

## 4. Communication: The Sovereign Bridge

- **Protocol**: gRPC / Protobuf (`sovereign.proto`).
- **Safety**: Circuit Breaker & 5s Timeouts implemented in `SovereignBridge.ts`.

## 5. Deployment Strategy

- **The Binary Secret**: Core engine is compiled into a **Static Binary** for low-resource Pi Nodes.
- **Air-Gapped Ready**: Minimal external dependencies for full technical sovereignty.
