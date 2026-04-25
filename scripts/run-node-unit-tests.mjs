import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const testsDir = path.join(repoRoot, 'tests');

const isNodeUnitTest = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  if (!normalized.match(/\.(test|spec)\.(mjs|cjs|js|ts)$/)) return false;
  if (normalized.includes('/e2e/')) return false;
  if (normalized.endsWith('.e2e.test.ts') || normalized.endsWith('.e2e.test.mjs')) return false;
  if (normalized.endsWith('sandbox-audit.spec.ts')) return false;
  return true;
};

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return [fullPath];
  }));

  return files.flat();
}

async function main() {
  if (!existsSync(testsDir)) {
    console.log('ℹ️ No tests directory found; skipping Node unit tests.');
    return;
  }

  const allFiles = await collectFiles(testsDir);
  const unitTests = allFiles.filter(isNodeUnitTest).map(file => path.relative(repoRoot, file));

  if (unitTests.length === 0) {
    console.log('ℹ️ No Node unit tests found outside tests/e2e; skipping.');
    return;
  }

  console.log(`🧪 Running Node unit tests (${unitTests.length} files)...`);
  const result = spawnSync('node', ['--test', ...unitTests], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await main();
