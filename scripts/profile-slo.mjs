#!/usr/bin/env node
import { performance } from 'node:perf_hooks';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASELINE_PATH = path.resolve('scripts/perf-baseline.json');
const REPORT_DIR = path.resolve('.artifacts/profiling');
const REPORT_PATH = path.join(REPORT_DIR, 'latest.json');

const SLOS = {
  simulationFanOut: {
    p95LatencyMs: 180,
    errorRatePct: 0,
    regressionBudgetPct: 20,
  },
  pluginExecutionLatency: {
    p95LatencyMs: 35,
    errorRatePct: 0,
    regressionBudgetPct: 20,
  },
  sidecarStartupWarmPath: {
    coldStartMs: 1200,
    warmPathMs: 90,
    errorRatePct: 0,
    regressionBudgetPct: 20,
  },
  httpFallbackUnderLoad: {
    p95LatencyMs: 220,
    errorRatePct: 1,
    regressionBudgetPct: 20,
  },
};

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function withServer(handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise((resolve) => server.close(() => resolve()));
    throw new Error('Failed to resolve local benchmark server address');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

async function profileSimulationFanOut() {
  const runs = 30;
  const parallelInstances = 30;
  const latencies = [];
  let errors = 0;

  for (let run = 0; run < runs; run++) {
    const start = performance.now();
    try {
      await Promise.all(
        Array.from({ length: parallelInstances }, (_, i) =>
          Promise.resolve().then(() => {
            let accumulator = i;
            for (let j = 0; j < 55000; j++) {
              accumulator = (accumulator + j) % 7919;
            }
            return accumulator;
          })
        )
      );
      latencies.push(performance.now() - start);
    } catch {
      errors++;
    }
  }

  return {
    samples: runs,
    p95LatencyMs: Number(percentile(latencies, 95).toFixed(2)),
    avgLatencyMs: Number(average(latencies).toFixed(2)),
    errorRatePct: Number(((errors / runs) * 100).toFixed(2)),
  };
}

async function profilePluginExecutionLatency() {
  const runs = 120;
  const latencies = [];
  let errors = 0;

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      const plugin = new Function(
        'input',
        `let x = input.seed; for (let i = 0; i < 40000; i++) { x = (x * 1664525 + 1013904223) % 4294967296; } return x;`
      );
      plugin({ seed: i + 1 });
      latencies.push(performance.now() - start);
    } catch {
      errors++;
    }
  }

  return {
    samples: runs,
    p95LatencyMs: Number(percentile(latencies, 95).toFixed(2)),
    avgLatencyMs: Number(average(latencies).toFixed(2)),
    errorRatePct: Number(((errors / runs) * 100).toFixed(2)),
  };
}

async function profileSidecarStartupWarmPath() {
  const sidecarCode = `
    const http = require('node:http');
    const server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.writeHead(404).end();
    });
    setTimeout(() => server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      process.stdout.write(String(port));
    }), 160);
  `;

  const startupStart = performance.now();
  const child = spawn(process.execPath, ['-e', sidecarCode], { stdio: ['ignore', 'pipe', 'pipe'] });

  const port = await new Promise((resolve, reject) => {
    let out = '';
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for sidecar startup')), 4000);
    child.stdout.on('data', (chunk) => {
      out += chunk.toString();
      const parsed = Number(out.trim());
      if (parsed > 0) {
        clearTimeout(timeout);
        resolve(parsed);
      }
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Sidecar exited during startup with code ${code}`));
      }
    });
  });

  const coldStartMs = performance.now() - startupStart;
  let errors = 0;
  const warmLatencies = [];

  for (let i = 0; i < 20; i++) {
    const start = performance.now();
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (!response.ok) {
        errors++;
      }
      warmLatencies.push(performance.now() - start);
    } catch {
      errors++;
    }
  }

  child.kill('SIGTERM');

  return {
    samples: 20,
    coldStartMs: Number(coldStartMs.toFixed(2)),
    warmPathMs: Number(percentile(warmLatencies, 95).toFixed(2)),
    errorRatePct: Number(((errors / 20) * 100).toFixed(2)),
  };
}

async function profileHttpFallbackUnderLoad() {
  const endpoint = await withServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/sovereign/simulate') {
      const jitterMs = 5 + Math.floor(Math.random() * 8);
      await new Promise((r) => setTimeout(r, jitterMs));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404).end();
  });

  const total = 220;
  const concurrency = 40;
  const latencies = [];
  let errors = 0;
  const jobs = Array.from({ length: total }, (_, i) => i);

  const worker = async () => {
    while (jobs.length) {
      const job = jobs.pop();
      if (job === undefined) return;
      const start = performance.now();
      try {
        const response = await fetch(`${endpoint.url}/api/sovereign/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId: `goal-${job}` }),
        });
        latencies.push(performance.now() - start);
        if (!response.ok) {
          errors++;
        }
      } catch {
        errors++;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await endpoint.close();

  return {
    samples: total,
    p95LatencyMs: Number(percentile(latencies, 95).toFixed(2)),
    avgLatencyMs: Number(average(latencies).toFixed(2)),
    errorRatePct: Number(((errors / total) * 100).toFixed(2)),
  };
}

function checkRegression(metricName, key, currentValue, baselineValue, regressionBudgetPct) {
  if (baselineValue === undefined || baselineValue === null) {
    return null;
  }
  const allowed = baselineValue * (1 + regressionBudgetPct / 100);
  if (currentValue > allowed) {
    return `${metricName}.${key} regressed: current=${currentValue} > allowed=${allowed.toFixed(2)} (baseline=${baselineValue}, budget=${regressionBudgetPct}%)`;
  }
  return null;
}

function evaluateSLOs(results, baseline) {
  const failures = [];

  const sim = results.simulationFanOut;
  if (sim.p95LatencyMs > SLOS.simulationFanOut.p95LatencyMs) {
    failures.push(`simulationFanOut.p95LatencyMs ${sim.p95LatencyMs} > ${SLOS.simulationFanOut.p95LatencyMs}`);
  }
  if (sim.errorRatePct > SLOS.simulationFanOut.errorRatePct) {
    failures.push(`simulationFanOut.errorRatePct ${sim.errorRatePct} > ${SLOS.simulationFanOut.errorRatePct}`);
  }

  const plugin = results.pluginExecutionLatency;
  if (plugin.p95LatencyMs > SLOS.pluginExecutionLatency.p95LatencyMs) {
    failures.push(`pluginExecutionLatency.p95LatencyMs ${plugin.p95LatencyMs} > ${SLOS.pluginExecutionLatency.p95LatencyMs}`);
  }
  if (plugin.errorRatePct > SLOS.pluginExecutionLatency.errorRatePct) {
    failures.push(`pluginExecutionLatency.errorRatePct ${plugin.errorRatePct} > ${SLOS.pluginExecutionLatency.errorRatePct}`);
  }

  const sidecar = results.sidecarStartupWarmPath;
  if (sidecar.coldStartMs > SLOS.sidecarStartupWarmPath.coldStartMs) {
    failures.push(`sidecarStartupWarmPath.coldStartMs ${sidecar.coldStartMs} > ${SLOS.sidecarStartupWarmPath.coldStartMs}`);
  }
  if (sidecar.warmPathMs > SLOS.sidecarStartupWarmPath.warmPathMs) {
    failures.push(`sidecarStartupWarmPath.warmPathMs ${sidecar.warmPathMs} > ${SLOS.sidecarStartupWarmPath.warmPathMs}`);
  }
  if (sidecar.errorRatePct > SLOS.sidecarStartupWarmPath.errorRatePct) {
    failures.push(`sidecarStartupWarmPath.errorRatePct ${sidecar.errorRatePct} > ${SLOS.sidecarStartupWarmPath.errorRatePct}`);
  }

  const fallback = results.httpFallbackUnderLoad;
  if (fallback.p95LatencyMs > SLOS.httpFallbackUnderLoad.p95LatencyMs) {
    failures.push(`httpFallbackUnderLoad.p95LatencyMs ${fallback.p95LatencyMs} > ${SLOS.httpFallbackUnderLoad.p95LatencyMs}`);
  }
  if (fallback.errorRatePct > SLOS.httpFallbackUnderLoad.errorRatePct) {
    failures.push(`httpFallbackUnderLoad.errorRatePct ${fallback.errorRatePct} > ${SLOS.httpFallbackUnderLoad.errorRatePct}`);
  }

  for (const [name, result] of Object.entries(results)) {
    const baselineMetric = baseline?.metrics?.[name] || {};
    const slo = SLOS[name];
    for (const [key, value] of Object.entries(result)) {
      if (typeof value !== 'number') continue;
      if (!['p95LatencyMs', 'coldStartMs', 'warmPathMs', 'errorRatePct'].includes(key)) continue;
      const regression = checkRegression(name, key, value, baselineMetric[key], slo.regressionBudgetPct);
      if (regression) failures.push(regression);
    }
  }

  return failures;
}

async function main() {
  const startedAt = new Date().toISOString();
  let baseline = null;
  try {
    baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8'));
  } catch {
    baseline = null;
  }

  const metrics = {
    simulationFanOut: await profileSimulationFanOut(),
    pluginExecutionLatency: await profilePluginExecutionLatency(),
    sidecarStartupWarmPath: await profileSidecarStartupWarmPath(),
    httpFallbackUnderLoad: await profileHttpFallbackUnderLoad(),
  };

  const failures = evaluateSLOs(metrics, baseline);
  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    slos: SLOS,
    metrics,
    baselinePath: 'scripts/perf-baseline.json',
    baselineFound: Boolean(baseline),
    failures,
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('--- PiWorker targeted profiling report ---');
  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
