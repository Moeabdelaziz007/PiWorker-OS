import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_ROOT = path.join(process.cwd(), 'tests/e2e/artifacts');
const REQUIRED_ENV = ['SOVEREIGN_AUTH_TOKEN', 'AGENT_SYSTEM_SECRET', 'SOVEREIGN_ENGINE_URL'];
const DETERMINISTIC = {
  goalId: 'goal-e2e-0001',
  pluginId: 'plugin-e2e-0001',
  paymentRecipientId: 'agent-e2e-0001',
  escrowAgentId: 'agent-e2e-escrow-01',
  sourceCode: 'export default async () => ({ ok: true, version: 1 });'
};

function createBridgeClient(getClient, gatewayUrl) {
  const getAuthToken = () => process.env.SOVEREIGN_AUTH_TOKEN || 'SOVEREIGN_DEV_TOKEN';

  async function callViaHttp(method, data) {
    const response = await fetch(`${gatewayUrl}/api/sovereign/${method}`, {
      method: 'POST',
      headers: {
        'X-Sovereign-Token': getAuthToken(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return response.json();
  }

  return {
    async executePlugin(req) {
      const client = await getClient();
      if (!client) return callViaHttp('execute', req);
      return client.ExecutePlugin(req);
    },
    async requestSimulation(req) {
      const client = await getClient();
      if (!client) return callViaHttp('simulate', req);
      return client.RequestSimulation(req);
    },
    async lockEscrow(agentId, amountPi) {
      const txId = 'escrow-fixed-id-0001';
      const response = await callViaHttp('lock-escrow', { txId, amountPi, targetWallet: agentId });
      return response.locked;
    },
    async commitPayment(req) {
      return callViaHttp('payment', req);
    },
    async getSystemStatus() {
      const response = await fetch(`${gatewayUrl}/api/status`, {
        headers: { 'X-Sovereign-Token': getAuthToken() }
      });

      if (!response.ok) {
        return { status: 'OFFLINE', code: response.status };
      }
      return response.json();
    }
  };
}

async function writeArtifact(fileName, payload) {
  await fs.mkdir(ARTIFACT_ROOT, { recursive: true });
  await fs.writeFile(path.join(ARTIFACT_ROOT, fileName), JSON.stringify(payload, null, 2), 'utf8');
}

function enforceEnvContract() {
  for (const key of REQUIRED_ENV) {
    assert.ok(process.env[key], `Missing required env var: ${key}`);
  }
}

function isTransientNetworkError(error) {
  const status = error?.status;
  return typeof status === 'number' && [408, 429, 500, 502, 503, 504].includes(status);
}

async function withTransientRetry(operation, maxAttempts = 3) {
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts || !isTransientNetworkError(error)) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 25));
      attempt += 1;
    }
  }
  throw new Error('retry loop exhausted unexpectedly');
}

async function withHttpGateway(handler) {
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');

    const result = handler(req, body);
    res.statusCode = result.status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(result.body));
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  return {
    port: address.port,
    close: async () => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
  };
}

test.beforeEach(() => {
  process.env.SOVEREIGN_AUTH_TOKEN = 'token-e2e-fixed';
  process.env.AGENT_SYSTEM_SECRET = 'agent-secret-e2e-fixed';
  process.env.SOVEREIGN_ENGINE_URL = 'http://127.0.0.1:50051';
  enforceEnvContract();
});

test('1) sandbox plugin execution (happy path + invalid token)', async () => {
  const startedAt = new Date().toISOString();
  const events = [];

  const gateway = await withHttpGateway((req, body) => {
    events.push({ at: new Date().toISOString(), message: 'gateway_request', detail: { url: req.url, token: req.headers['x-sovereign-token'] } });
    if (req.url !== '/api/sovereign/execute') return { status: 404, body: { error: 'not_found' } };

    if (req.headers['x-sovereign-token'] !== 'token-e2e-fixed') {
      return { status: 401, body: { error: 'invalid_token' } };
    }

    const parsed = JSON.parse(body);
    return { status: 200, body: { pluginId: parsed.pluginId, success: true, outputJson: '{"deterministic":true}', logs: ['sandbox started', 'sandbox finished'] } };
  });

  const bridge = createBridgeClient(async () => null, `http://127.0.0.1:${gateway.port}`);

  const happy = await bridge.executePlugin({
    pluginId: DETERMINISTIC.pluginId,
    sourceCode: DETERMINISTIC.sourceCode,
    envVars: { SAFE_MODE: 'true' },
    allowedCapabilities: ['math', 'json']
  });
  assert.equal(happy.success, true);

  process.env.SOVEREIGN_AUTH_TOKEN = 'bad-token-fixed';
  await assert.rejects(
    () => bridge.executePlugin({ pluginId: 'plugin-invalid', sourceCode: DETERMINISTIC.sourceCode, envVars: {}, allowedCapabilities: ['math'] }),
    /HTTP 401/
  );

  await gateway.close();
  await writeArtifact('01-sandbox-plugin.json', {
    scenario: 'sandbox_plugin_execution', startedAt, endedAt: new Date().toISOString(), deterministicData: DETERMINISTIC, events
  });
});

test('2) simulation request flow (gRPC available + HTTP fallback)', async () => {
  const startedAt = new Date().toISOString();
  const events = [];

  const deterministicResponse = {
    goalId: DETERMINISTIC.goalId,
    predictedRoi: 12.5,
    riskScore: 0.18,
    strategyRecommendation: 'Hold neutral hedge',
    reasoning: { logicChain: 'deterministic-logic-chain', criticalRisks: ['latency'], opportunities: ['spread_capture'], confidenceScore: '0.91' },
    estimatedRevenueUsd: 1337
  };

  const bridgeGrpc = createBridgeClient(async () => ({
    RequestSimulation: req => {
      events.push({ at: new Date().toISOString(), message: 'grpc_request', detail: req });
      return deterministicResponse;
    }
  }), 'http://unused');

  const grpcResult = await bridgeGrpc.requestSimulation({ goalId: DETERMINISTIC.goalId, parallelInstances: 3, modelVersion: 'gemini-1.5-pro' });
  assert.deepEqual(grpcResult, deterministicResponse);

  let fallbackAttempts = 0;
  const gateway = await withHttpGateway(req => {
    if (req.url !== '/api/sovereign/simulate') return { status: 404, body: { error: 'not_found' } };
    fallbackAttempts += 1;
    if (fallbackAttempts === 1) return { status: 503, body: { error: 'transient_unavailable' } };
    return { status: 200, body: deterministicResponse };
  });

  const bridgeHttp = createBridgeClient(async () => null, `http://127.0.0.1:${gateway.port}`);
  const fallbackResult = await withTransientRetry(() =>
    bridgeHttp.requestSimulation({ goalId: DETERMINISTIC.goalId, parallelInstances: 3, modelVersion: 'gemini-1.5-pro' })
  );

  assert.equal(fallbackResult.goalId, DETERMINISTIC.goalId);
  assert.equal(fallbackAttempts, 2);

  await gateway.close();
  await writeArtifact('02-simulation-flow.json', {
    scenario: 'simulation_grpc_http_fallback', startedAt, endedAt: new Date().toISOString(), deterministicData: DETERMINISTIC, events
  });
});

test('3) payment/escrow critical path', async () => {
  const startedAt = new Date().toISOString();
  const events = [];
  let paymentAttempts = 0;

  const gateway = await withHttpGateway((req, body) => {
    if (req.url === '/api/sovereign/lock-escrow') {
      events.push({ at: new Date().toISOString(), message: 'lock_escrow', detail: JSON.parse(body) });
      return { status: 200, body: { locked: true, escrowAddress: 'escrow-fixed-addr-001' } };
    }

    if (req.url === '/api/sovereign/payment') {
      paymentAttempts += 1;
      if (paymentAttempts === 1) return { status: 502, body: { error: 'temporary_gateway_issue' } };
      return { status: 200, body: { success: true, txId: 'tx-fixed-0001', explorerUrl: 'https://explorer.pi/tx-fixed-0001' } };
    }

    return { status: 404, body: { error: 'not_found' } };
  });

  const bridge = createBridgeClient(async () => null, `http://127.0.0.1:${gateway.port}`);
  const escrowLocked = await bridge.lockEscrow(DETERMINISTIC.escrowAgentId, 7.5);
  assert.equal(escrowLocked, true);

  const payment = await withTransientRetry(() => bridge.commitPayment({
    recipientId: DETERMINISTIC.paymentRecipientId,
    amountPi: 7.5,
    agentAuthToken: process.env.AGENT_SYSTEM_SECRET,
    priority: 'HIGH'
  }));

  assert.equal(payment.success, true);
  assert.equal(paymentAttempts, 2);

  await gateway.close();
  await writeArtifact('03-payment-escrow.json', {
    scenario: 'payment_escrow_critical_path', startedAt, endedAt: new Date().toISOString(), deterministicData: DETERMINISTIC, events
  });
});

test('4) health/status endpoints and recovery behavior', async () => {
  const startedAt = new Date().toISOString();
  const events = [];
  let statusAttempt = 0;

  const gateway = await withHttpGateway(req => {
    if (req.url !== '/api/status') return { status: 404, body: { error: 'not_found' } };
    statusAttempt += 1;
    if (statusAttempt === 1) return { status: 503, body: { status: 'OFFLINE' } };
    return { status: 200, body: { status: 'ONLINE', subsystem: 'sovereign-engine', revision: 'e2e-fixed-r1' } };
  });

  const bridge = createBridgeClient(async () => null, `http://127.0.0.1:${gateway.port}`);
  const initial = await bridge.getSystemStatus();
  assert.equal(initial.status, 'OFFLINE');

  const recovered = await withTransientRetry(async () => {
    const status = await bridge.getSystemStatus();
    if (status.status === 'OFFLINE') {
      const err = new Error('still offline');
      err.status = 503;
      throw err;
    }
    return status;
  });

  assert.equal(recovered.status, 'ONLINE');
  await gateway.close();

  await writeArtifact('04-health-status-recovery.json', {
    scenario: 'health_status_recovery', startedAt, endedAt: new Date().toISOString(), deterministicData: DETERMINISTIC, events
  });
});
