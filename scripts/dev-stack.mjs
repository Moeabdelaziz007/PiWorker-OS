#!/usr/bin/env node
import { spawn } from 'node:child_process';

const GO_HEALTH_URL = process.env.SOVEREIGN_HEALTH_URL || 'http://127.0.0.1:8080/health';
const NEXT_HEALTH_URL = process.env.NEXT_HEALTH_URL || 'http://127.0.0.1:3000/api/health';
const HEALTH_ATTEMPTS = Number.parseInt(process.env.DEV_STACK_HEALTH_ATTEMPTS || '30', 10);
const HEALTH_INTERVAL_MS = Number.parseInt(process.env.DEV_STACK_HEALTH_INTERVAL_MS || '1000', 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(url, label) {
  for (let attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ [dev:stack] ${label} healthy at ${url}`);
        return;
      }
      console.warn(`⚠️ [dev:stack] ${label} health ${response.status} (attempt ${attempt}/${HEALTH_ATTEMPTS})`);
    } catch (error) {
      console.warn(`⚠️ [dev:stack] ${label} not ready (attempt ${attempt}/${HEALTH_ATTEMPTS}): ${error.message}`);
    }

    await sleep(HEALTH_INTERVAL_MS);
  }

  throw new Error(`${label} failed health checks at ${url}`);
}

function terminate(child, signal = 'SIGTERM') {
  if (child.exitCode !== null || child.killed) return;
  child.kill(signal);
}

const sidecar = spawn('go', ['run', 'sidecar/sovereign-engine/main.go'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});

let next = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\n🛑 [dev:stack] Shutting down services...');
  if (next) terminate(next);
  terminate(sidecar);

  setTimeout(() => {
    if (next) terminate(next, 'SIGKILL');
    terminate(sidecar, 'SIGKILL');
    process.exit(code);
  }, 1500).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

sidecar.on('exit', (code) => {
  if (!shuttingDown && code !== 0) {
    console.error(`❌ [dev:stack] sidecar exited early with code ${code}`);
    shutdown(1);
  }
});

(async () => {
  try {
    await waitForHealth(GO_HEALTH_URL, 'Go sidecar');

    next = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    next.on('exit', (code) => {
      if (!shuttingDown && code !== 0) {
        console.error(`❌ [dev:stack] Next.js exited with code ${code}`);
        shutdown(1);
      }
    });

    await waitForHealth(NEXT_HEALTH_URL, 'Next.js');
    console.log('🚀 [dev:stack] Sidecar + Next.js stack is healthy.');
  } catch (error) {
    console.error(`❌ [dev:stack] Startup failed: ${error.message}`);
    shutdown(1);
  }
})();
