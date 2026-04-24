import { SovereignBridge } from "../core/engine/sovereign-bridge";
import fs from 'node:fs';
import path from 'node:path';

/**
 * PiWorker-OS Pre-flight Validator
 * Developed by MAS-ZERO to ensure zero-defect deployments.
 */
/**
 * PiWorker-OS Pre-flight Validator
 * Developed by MAS-ZERO for High-Fidelity Sovereign Infrastructure.
 */
async function runValidation() {
  console.log("🛠️  [Pre-flight] Starting PiWorker-OS Sovereign Validation...");

  const requiredEnv = [
    "SOVEREIGN_AUTH_TOKEN",
    "AGENT_SYSTEM_SECRET",
    "GEMINI_API_KEY"
  ];

  const checks = [
    { 
      name: "Sovereign Proto Definition", 
      check: () => fs.existsSync(path.join(process.cwd(), 'sidecar/sovereign-engine/proto/sovereign.proto')),
      severity: "CRITICAL"
    },
    { 
      name: "Go Engine Module", 
      check: () => fs.existsSync(path.join(process.cwd(), 'sidecar/sovereign-engine/go.mod')),
      severity: "CRITICAL"
    },
    { 
      name: "Security: .env Protection", 
      check: () => !fs.existsSync(path.join(process.cwd(), '.next/static/.env')),
      severity: "SECURITY"
    },
    {
      name: "System: Bin Directory",
      check: () => {
        const binPath = path.join(process.cwd(), 'bin');
        if (!fs.existsSync(binPath)) fs.mkdirSync(binPath);
        return fs.existsSync(binPath);
      },
      severity: "WARNING"
    }
  ];

  let failed = false;

  // 1. Structural Checks
  for (const c of checks) {
    if (c.check()) {
      console.log(`✅ [${c.severity}] ${c.name} passed.`);
    } else {
      if (c.severity === "CRITICAL" || c.severity === "SECURITY") {
        console.error(`❌ [${c.severity}] ${c.name} FAILED!`);
        failed = true;
      } else {
        console.warn(`⚠️ [${c.severity}] ${c.name} failed (non-blocking).`);
      }
    }
  }

  // 2. Environment Validation (Only warning if missing in local dev)
  const isCI = process.env.CI || process.env.VERCEL;
  for (const env of requiredEnv) {
    if (!process.env[env]) {
      if (isCI) {
        console.error(`❌ [ENV_ERROR] Missing ${env} in CI/CD environment!`);
        failed = true;
      } else {
        console.warn(`⚠️ [ENV_WARN] Missing ${env}. Defaulting to unsafe development values.`);
      }
    } else {
      console.log(`✅ [ENV] ${env} is configured.`);
    }
  }

  if (failed) {
    console.error("⛔ [Halt] Sovereign Validation failed. Build aborted to prevent instability.");
    process.exit(1);
  }

  console.log("🚀 [Success] All sovereign pre-flight systems green. Proceeding to build...");
}

runValidation().catch(err => {
  console.error("🔥 [Fatal] Pre-flight crash:", err);
  process.exit(1);
});
