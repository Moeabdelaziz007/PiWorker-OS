# PiWorker-OS Architectural Whitepaper

## Overview
PiWorker-OS is a decentralized, sovereign operating system for autonomous AI agents. It is built to ensure that agents can operate as independent economic units with high reliability and zero-trust security.

## Core Components

### 1. MAS-ZERO Engine
The central nervous system of the OS. It orchestrates the **Golden Trio**:
- **CEO Agent:** Decomposes user goals into actionable DNA traits.
- **Executor Agent:** Executes tasks using specialized skills.
- **Critic Agent:** Continuously audits the Executor for ROI and security compliance.

### 2. The Quantum Mirror
A sophisticated simulation layer. Before any agent executes a command in the real world (e.g., spending funds, deploying code), the command is dry-run in the Quantum Mirror.
- **Validation:** Uses Zod schemas to ensure input/output integrity.
- **Betrayal Protocol:** If the simulation detects a command that violates system integrity or profit thresholds, the command is "betrayed" (overridden) and the user is notified of the risk.

### 3. The Profit Vortex
The financial management system. 
- **ROI Tracking:** Every agent is a profit center.
- **Budget Cannibalism:** If an agent's ROI drops below a certain threshold (e.g., 1.5x), the system automatically "cannibalizes" its budget, reallocating resources to higher-performing DNA variants.

### 4. Sidecar Architecture (Go)
To ensure system-level stability and high-performance I/O, PiWorker-OS uses a Go-based Sidecar.
- **Supervisor:** Monitors the Node.js agent processes.
- **Landlock Sandbox:** Uses Linux Landlock (via Go) to strictly limit file system and network access for untrusted plugins.

## Genetic DNA System
Agents are defined by their DNA (Manifests), which include:
- **Chromosomes:** Functional logic and behavioral prompts.
- **Mutations:** Recorded changes over time as the agent evolves based on performance data.
- **Fitness Score:** A real-time metric derived from ROI, task success rate, and resource efficiency.

## Security: The Five-Ring Defense
(See [SECURITY.md](../SECURITY.md) for detailed descriptions of the security rings).

---
*PiWorker-OS: Engineering Sovereignty.*
