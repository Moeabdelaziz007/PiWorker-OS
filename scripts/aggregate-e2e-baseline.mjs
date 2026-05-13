#!/usr/bin/env node
/**
 * Aggregate real-lane E2E artifacts into a single baseline.
 *
 * Reads every `tests/e2e/artifacts/real-run-*.json` produced by the real
 * lane and emits `tests/e2e/artifacts/baseline-metrics.json` containing:
 *
 *   - per-scenario p50 / p95 duration (ms)
 *   - per-scenario success rate
 *   - top failing endpoint by failure count
 *
 * Run this AFTER at least one successful real-lane run, e.g.:
 *   SOVEREIGN_STAGING_URL=... \
 *   SOVEREIGN_AUTH_TOKEN=... \
 *   AGENT_SYSTEM_SECRET=... \
 *   npm run test:e2e:real && npm run test:e2e:baseline
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_ROOT = path.join(process.cwd(), 'tests/e2e/artifacts');
const OUTPUT = path.join(ARTIFACT_ROOT, 'baseline-metrics.json');

function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx];
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(ARTIFACT_ROOT);
  } catch (err) {
    console.error(`❌ [baseline] could not read ${ARTIFACT_ROOT}: ${err.message}`);
    process.exit(1);
  }

  const runFiles = entries
    .filter((f) => f.startsWith('real-run-') && f.endsWith('.json'))
    .sort();

  if (runFiles.length === 0) {
    console.log('⏭️  [baseline] No real-run-*.json artifacts found.');
    console.log('    Run `npm run test:e2e:real` against staging first.');
    process.exit(0);
  }

  /** @type {Record<string, { durations: number[]; passed: number; failed: number; endpoint: string }>} */
  const byScenario = {};
  let totalScenarios = 0;
  let totalPassed = 0;

  for (const file of runFiles) {
    const report = JSON.parse(await fs.readFile(path.join(ARTIFACT_ROOT, file), 'utf8'));
    for (const s of report.scenarios || []) {
      const bucket = byScenario[s.name] || { durations: [], passed: 0, failed: 0, endpoint: s.endpoint };
      bucket.endpoint = s.endpoint || bucket.endpoint;
      bucket.durations.push(Number(s.duration_ms) || 0);
      if (s.outcome === 'PASS') {
        bucket.passed += 1;
        totalPassed += 1;
      } else {
        bucket.failed += 1;
      }
      byScenario[s.name] = bucket;
      totalScenarios += 1;
    }
  }

  const scenarios = Object.entries(byScenario).map(([name, b]) => {
    const sorted = [...b.durations].sort((a, c) => a - c);
    const runs = b.passed + b.failed;
    return {
      name,
      endpoint: b.endpoint,
      runs,
      success_rate: runs ? b.passed / runs : 0,
      duration_ms: {
        p50: quantile(sorted, 0.5),
        p95: quantile(sorted, 0.95),
        max: sorted[sorted.length - 1] || 0,
      },
    };
  });

  const failuresByEndpoint = scenarios
    .filter((s) => s.runs - Math.round(s.success_rate * s.runs) > 0)
    .map((s) => ({
      endpoint: s.endpoint,
      name: s.name,
      failures: s.runs - Math.round(s.success_rate * s.runs),
    }))
    .sort((a, b) => b.failures - a.failures);

  const baseline = {
    generated_at: new Date().toISOString(),
    source_runs: runFiles.length,
    overall: {
      total_scenarios: totalScenarios,
      passed: totalPassed,
      failed: totalScenarios - totalPassed,
      success_rate: totalScenarios ? totalPassed / totalScenarios : 0,
    },
    scenarios,
    top_failure_point: failuresByEndpoint[0] || null,
  };

  await fs.writeFile(OUTPUT, JSON.stringify(baseline, null, 2), 'utf8');
  console.log(`✅ [baseline] wrote ${path.relative(process.cwd(), OUTPUT)}`);
  console.log(`   runs=${runFiles.length} scenarios=${totalScenarios} success_rate=${baseline.overall.success_rate.toFixed(3)}`);
  if (baseline.top_failure_point) {
    console.log(`   top failure: ${baseline.top_failure_point.endpoint} (${baseline.top_failure_point.failures})`);
  }
}

await main();
