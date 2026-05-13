#!/usr/bin/env node
import { spawn } from 'node:child_process';

const REQUIRED_ENV = [
  'SOVEREIGN_BASE_URL',
  'SOVEREIGN_ENGINE_URL',
  'SIDECAR_ENDPOINT',
  'SOVEREIGN_AUTH_TOKEN',
  'AGENT_SYSTEM_SECRET'
];

const missing = REQUIRED_ENV.filter(name => {
  const value = process.env[name];
  return typeof value !== 'string' || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error('[test:e2e:real] Missing required environment variables:');
  for (const name of missing) {
    console.error(` - ${name}`);
  }
  console.error('\nExport them before running e2e real tests.');
  process.exit(1);
}

const runner = spawn(
  process.execPath,
  ['--test', 'tests/e2e/**/*.e2e.test.mjs'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E_REAL_MODE: 'true'
    }
  }
);

runner.on('exit', code => {
  process.exit(code ?? 1);
});

runner.on('error', error => {
  console.error('[test:e2e:real] Failed to start Node test runner:', error.message);
  process.exit(1);
});
