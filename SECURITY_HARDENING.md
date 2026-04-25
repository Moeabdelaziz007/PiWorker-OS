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
- **isolated-vm Implementation**: Transition the `SandboxExecutor` to use `isolated-vm` for memory-level isolation.

## 🛡️ Recent Hardening (2026-04-24)

### 1. Next.js Security Patch (CVE-2025-66478)
- **Problem**: Next.js 15.0.0 had a high-severity vulnerability.
- **Fix**: Upgraded `package.json` to `next: 15.1.0`.

### 2. Ring 5: Neural Vault (mTLS)
- **Problem**: gRPC traffic was encrypted but lacked mutual authentication (mTLS).
- **Fix**: 
    - Implemented **mTLS** in both the Go Engine and TS Bridge.
    - Added support for loading certificates from Environment Variables for Serverless compatibility.
    - Certificates are now enforced at the gRPC layer (Step 1 of Steel Gate).

## 🔑 Required Configuration (Update)
The following MUST be added to Vercel/Production:
- `SOVEREIGN_CA_CERT`: Content of `ca.crt`
- `SOVEREIGN_SERVER_CERT` / `SOVEREIGN_SERVER_KEY`: For the Go Engine
- `SOVEREIGN_CLIENT_CERT` / `SOVEREIGN_CLIENT_KEY`: For the TS Orchestrator

## 🛡️ Recent Hardening (2026-04-25)

### 3. Phase 11: Ring 3 Neural Isolation (Whitelisting & Log Capturing)
- **Problem**: Sandbox execution lacked strict whitelisting and real-time auditability.
- **Fix**:
    - **Whitelisting**: Otto VM now uses a strict whitelist strategy. Global objects like `os`, `fs`, and `process` are explicitly nil-ed.
    - **Log Capturing**: `console.log` is bridged from Otto to Go to TypeScript, allowing real-time audit logs of plugin execution in the dashboard.

### 4. Phase 15: Durable Sovereign Execution (Sovereign Journaling)
- **Problem**: Critical financial and physical operations were ephemeral; a process crash could lead to lost state.
- **Fix**:
    - Implemented a **Sovereign Journal** in the Go core.
    - Every payment and physical intent now records a `BEGIN` and `COMMIT` entry.
    - Added **Self-Healing Recovery** on startup to audit unfinished tasks.
