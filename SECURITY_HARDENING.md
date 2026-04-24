# PiWorker-OS Security Hardening Report

## Overview
This document tracks the critical security patches and architectural hardening steps implemented by **MAS-ZERO** to achieve the "Sovereign Security" standard.

## 🛡️ Applied Patches

### 1. [CRITICAL] VULN-001: Payment Authorization Bypass (Steel Gate Protocol)
- **Problem**: `CommitPayment` in the Go Engine was accessible without agent-level authorization.
- **Fix**:
    - **Go Engine**: Implemented a mandatory `AgentAuthToken` check in `sidecar/sovereign-engine/main.go`. It now validates requests against the `AGENT_SYSTEM_SECRET` environment variable.
    - **TS Bridge**: Added a secure `commitPayment` method to `SovereignBridge` that injects the required authorization token from the orchestrator's environment.

### 2. [HIGH] Ring 3: Sandbox Isolation (Foundation)
- **Problem**: Plugins and the Sovereign Engine ran with unconstrained host permissions.
- **Fix**:
    - Created the `/sandbox` directory.
    - Implemented `SandboxExecutor` in `sandbox/executor.ts`.
    - Added **Ring 2 (Capability-Based)** checks to prevent unauthorized filesystem access within the execution flow.

## 🔑 Required Configuration
To maintain sovereignty, the following environment variables MUST be configured in your production environment (.env / Vercel):

- `AGENT_SYSTEM_SECRET`: A high-entropy cryptographic secret shared between the Next.js Orchestrator and the Go Engine.
- `SOVEREIGN_AUTH_TOKEN`: The bridge-level gRPC metadata token (replaces `DEFAULT_SAFE_TOKEN`).

## 🚀 Next Steps
- **mTLS Implementation**: Transition from `createInsecure()` to mutual TLS for the gRPC bridge.
- **Process Isolation**: Upgrade the `SandboxExecutor` to use `isolated-vm` or micro-containers.
