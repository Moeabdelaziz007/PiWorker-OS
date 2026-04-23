# Security Policy: The Five-Ring Defense

PiWorker-OS is designed as a zero-trust architecture. We take security seriously to protect the economic sovereignty of your agents.

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | ✅ Yes (Current)    |

## Reporting a Vulnerability
We follow the **Five-Ring Defense** protocol. If you discover a vulnerability, please do NOT open a public issue. Instead, follow these steps:

1. **Email:** Send a detailed report to `security@piworker.ai` (Placeholder).
2. **Details:** Include the following:
   - Type of vulnerability (e.g., Sandbox Escape, DNA Injection, Financial Leak).
   - Steps to reproduce.
   - Potential impact on agent sovereignty.

## Our Defense Rings
1. **Ring 1: Identity & Signing:** Every agent action must be signed (Ed25519).
2. **Ring 2: Capability-Based Security:** Agents only have access to tools they are explicitly granted.
3. **Ring 3: Sandbox Isolation:** Plugins run in isolated WASM/Go-Landlock environments.
4. **Ring 4: Quantum Mirror Audit:** Real-time simulation and audit of every command.
5. **Ring 5: Adversarial Mirror:** Automated monitoring for abnormal agent behavior (Betrayal detection).

We will respond to all security reports within 48 hours.
