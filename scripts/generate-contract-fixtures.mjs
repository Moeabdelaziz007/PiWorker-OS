import fs from 'node:fs';
import path from 'node:path';
import { assertExactSet, getSchemaKeys, readFile } from './contract-utils.mjs';

const contractsPath = path.join(process.cwd(), 'core/contracts/critical-contracts.ts');
const fixturePath = path.join(process.cwd(), 'core/contracts/fixtures/critical-contracts.json');
const contractsSource = readFile(contractsPath);

const fixtures = {
  simulation: {
    request: {
      goalId: 'f3f730f0-02f6-4f58-a8b4-cfce44e4eb88',
      parallelInstances: 8,
      modelVersion: 'gemini-1.5-pro',
      complexity: 0.65,
      personas: ['Bull', 'Bear', 'Chaos', 'Conservative', 'Aggressive'],
    },
    response: {
      goalId: 'f3f730f0-02f6-4f58-a8b4-cfce44e4eb88',
      predictedRoi: 1.37,
      riskScore: 0.22,
      strategyRecommendation: 'Deploy conservative-maker strategy with stop-loss guardrails.',
      reasoning: {
        logicChain: 'Multi-persona analysis converged on positive adjusted Sharpe ratio.',
        criticalRisks: ['Market Volatility', 'Agent Drift'],
        opportunities: ['Spread capture', 'Low-latency settlement path'],
        confidenceScore: '86.5%',
      },
      estimatedRevenueUsd: 912.42,
    },
  },
  pluginExecution: {
    request: {
      pluginId: 'yield-swarm',
      sourceCode: 'module.exports = () => ({ ok: true });',
      envVars: { REGION: 'us-east-1' },
      allowedCapabilities: ['http:get', 'kv:read'],
      signature: 'deadbeefcafebabe',
    },
    response: {
      pluginId: 'yield-swarm',
      success: true,
      outputJson: '{"ok":true}',
      errorMessage: '',
      executionTimeMs: 44,
      logs: ['sandbox boot', 'plugin completed'],
    },
  },
  payment: {
    request: {
      recipientId: 'PIWALLET_1234567890',
      amountPi: 5.5,
      agentAuthToken: 'AGENT_SYSTEM_SECRET_TOKEN',
      priority: 'instant',
    },
    response: {
      success: true,
      txId: 'tx_1715000000000',
      explorerUrl: 'https://explorer.minepi.com/tx/tx_1715000000000',
      errorMessage: '',
    },
  },
  escrow: {
    request: {
      txId: 'escrow-9f1da2c3',
      amountPi: 2.25,
      targetWallet: 'PI_AGENT_TARGET_12345',
    },
    response: {
      locked: true,
      escrowAddress: 'native-go-escrow-vault',
    },
  },
  statusHealth: {
    response: {
      timestamp: '2026-04-25T00:00:00.000Z',
      status: 'OPERATIONAL',
      layers: {
        orchestrator: { status: 'ONLINE', version: '2.0.0' },
        sovereign_engine: { status: 'ONLINE', latency: '41ms' },
        pi_network: { status: 'CONNECTED', network: 'testnet' },
      },
    },
  },
};

const schemaToFixture = [
  ['SimulationRequestSchema', fixtures.simulation.request],
  ['SimulationResponseSchema', fixtures.simulation.response],
  ['PluginRequestSchema', fixtures.pluginExecution.request],
  ['PluginResponseSchema', fixtures.pluginExecution.response],
  ['PaymentRequestSchema', fixtures.payment.request],
  ['PaymentResponseSchema', fixtures.payment.response],
  ['EscrowRequestSchema', fixtures.escrow.request],
  ['EscrowResponseSchema', fixtures.escrow.response],
  ['HealthStatusSchema', fixtures.statusHealth.response],
];

const diffs = [];
for (const [schemaName, fixture] of schemaToFixture) {
  const keys = Object.keys(fixture);
  const schemaKeys = getSchemaKeys(contractsSource, schemaName);
  assertExactSet(`${schemaName} fixture keys`, keys, schemaKeys, diffs);
}

if (diffs.length) {
  throw new Error(`Fixture/schema mismatch:\n${diffs.join('\n')}`);
}

const rendered = `${JSON.stringify(fixtures, null, 2)}\n`;
const checkMode = process.argv.includes('--check');

if (checkMode) {
  if (!fs.existsSync(fixturePath)) throw new Error('Contract fixtures file missing.');
  const current = fs.readFileSync(fixturePath, 'utf8');
  if (current !== rendered) {
    throw new Error('Contract fixtures are stale. Run `npm run contracts:fixtures`.');
  }
  console.log('Contract fixtures are current and aligned with validator schemas.');
} else {
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, rendered, 'utf8');
  console.log(`Generated ${fixturePath}`);
}
