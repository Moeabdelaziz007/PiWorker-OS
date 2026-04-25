# Security Policy: The Five-Ring Defense

PiWorker-OS is designed as a strict **Zero-Trust Architecture**. We treat security not as a feature, but as the foundational principle governing the economic sovereignty and physical actions of agents.

## Supported Versions

| Version | Supported        |
| ------- | ---------------- |
| 2.0.x   | ✅ Yes (Current) |
| 0.1.x   | ⚠️ Deprecated    |

## Reporting a Vulnerability

We follow the **Five-Ring Defense** protocol. If you discover a vulnerability, please do **NOT** open a public issue. Exposing vulnerabilities publicly before they are patched threatens the entire ecosystem. Instead, follow these steps:

1. **Email:** Send a detailed report to `security@piworker.ai` (Placeholder).
2. **Details:** Include the following:
   - Type of vulnerability (e.g., Sandbox Escape, DNA Injection, Escrow/Financial Leak, Oracle Manipulation).
   - Exact steps to reproduce.
   - Potential impact on agent sovereignty or physical bridge integrity.
3. **Embargo:** We request a 90-day embargo on public disclosure to allow time for patching and ecosystem coordination.

## Our Defense Rings (Zero-Trust Model)

1. **Ring 1: Identity & Cryptographic Signing:** Every agent action, especially financial transactions and physical commands, must be cryptographically signed (e.g., Ed25519). "Trust nothing, verify everything."
2. **Ring 2: Capability-Based Security:** Agents operate on the principle of least privilege. They only possess access to tools and APIs they are explicitly granted via their DNA schema.
3. **Ring 3: Sandbox Isolation:** Plugins and untrusted code execute in strictly isolated environments. No module can access the host filesystem or network without explicit, scoped permission.
4. **Ring 4: Quantum Mirror Audit:** Real-time simulation and pre-execution auditing of every critical command to predict and prevent catastrophic outcomes.
5. **Ring 5: Adversarial Mirror:** Automated, AI-driven monitoring for abnormal agent behavior, betrayal detection, and economic anomalies.

## Governance & Code Ownership

Critical systems involving finance (Escrows) and physical interaction (PoPW, Robotics) require mandatory reviews by core maintainers. See our `.github/CODEOWNERS` file for specific enforcement rules.

We will respond to all security reports within 48 hours.
