#!/usr/bin/env node
/**
 * Real E2E lane runner. The only E2E lane.
 *
 * No mocks, no in-process gateways, no fixture tokens. The suite talks to a
 * real deployed Sovereign Engine. If the required env is not set, this
 * script FAILS (exit 1) rather than silently passing. That is intentional:
 * a green CI must mean we actually exercised staging.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

const REAL_FILE = path.join('tests', 'e2e', 'real', 'sovereign-critical-path.real.e2e.test.mjs');

const stagingUrl = (process.env.SOVEREIGN_STAGING_URL || process.env.SOVEREIGN_ENGINE_URL || '').trim();
const authToken = (process.env.SOVEREIGN_AUTH_TOKEN || '').trim();
const agentSecret = (process.env.AGENT_SYSTEM_SECRET || '').trim();

const missing = [];
if (!stagingUrl) missing.push('SOVEREIGN_STAGING_URL (or SOVEREIGN_ENGINE_URL)');
if (!authToken) missing.push('SOVEREIGN_AUTH_TOKEN');
if (!agentSecret) missing.push('AGENT_SYSTEM_SECRET');

if (missing.length > 0) {
  console.error('❌ [test:e2e:real] Refusing to run: required env not set.');
  for (const v of missing) console.error(`    - ${v}`);
  console.error('');
  console.error('    The real E2E lane talks to a deployed Sovereign Engine.');
  console.error('    There is no mock fallback. Set the env vars and rerun.');
  process.exit(1);
}

console.log(`🛰️  [test:e2e:real] Running real lane against ${stagingUrl}`);
const child = spawn('node', ['--test', REAL_FILE], { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 1));
