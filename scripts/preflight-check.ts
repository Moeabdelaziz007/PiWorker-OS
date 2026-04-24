import { SovereignBridge } from "../core/engine/sovereign-bridge";
import fs from 'node:fs';
import path from 'node:path';

/**
 * PiWorker-OS Pre-flight Validator
 * Developed by MAS-ZERO to ensure zero-defect deployments.
 */
async function runValidation() {
  console.log("🛠️ Starting PiWorker-OS Sovereign Validation...");

  const checks = [
    { name: "Sovereign Proto Existence", check: () => fs.existsSync(path.join(process.cwd(), 'sidecar/sovereign-engine/proto/sovereign.proto')) },
    { name: "Go Engine Manifest", check: () => fs.existsSync(path.join(process.cwd(), 'sidecar/sovereign-engine/go.mod')) },
    { name: "Python Dashboard Entry", check: () => fs.existsSync(path.join(process.cwd(), 'plugins/dashboard/main.py')) }
  ];

  let failed = false;
  for (const c of checks) {
    if (c.check()) {
      console.log(`✅ ${c.name} passed.`);
    } else {
      console.error(`❌ ${c.name} FAILED!`);
      failed = true;
    }
  }

  if (failed) {
    console.error("⛔ Validation failed. Build aborted to prevent sovereign instability.");
    process.exit(1);
  }

  console.log("🚀 All sovereign systems green. Proceeding to build...");
}

runValidation().catch(err => {
  console.error(err);
  process.exit(1);
});
