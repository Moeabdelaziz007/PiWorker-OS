import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const GRPC_PORT = 50051;
const ENGINE_ADDR = `127.0.0.1:${GRPC_PORT}`;
const PROTO_PATH = 'sidecar/sovereign-engine/proto/sovereign.proto';

function waitForPort(host, port, timeoutMs = 20000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(tryConnect, 300);
      });
      socket.once('timeout', () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(tryConnect, 300);
      });
      socket.connect(port, host);
    };

    tryConnect();
  });
}

function callIntent(client, token) {
  return new Promise((resolve, reject) => {
    const metadata = new grpc.Metadata();
    metadata.add('x-sovereign-token', token);

    client.SendEmbodiedIntent({
      intentId: 'tier3-handshake-intent',
      agentId: 'tier3-agent',
      subtaskLanguage: 'Run startup handshake',
      executionMetadata: { mode: 'integration' },
      controlMode: 'test',
      visualSubgoals: [],
    }, metadata, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

async function main() {
  const token = process.env.SOVEREIGN_AUTH_TOKEN || 'SOVEREIGN_DEV_TOKEN';
  const serverEnv = {
    ...process.env,
    SOVEREIGN_AUTH_TOKEN: token,
    AGENT_SYSTEM_SECRET: process.env.AGENT_SYSTEM_SECRET || 'tier3-agent-secret',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'tier3-fake-gemini-key',
  };

  const server = spawn('go', ['run', './sidecar/sovereign-engine'], {
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', chunk => process.stdout.write(`[engine] ${chunk}`));
  server.stderr.on('data', chunk => process.stderr.write(`[engine] ${chunk}`));

  try {
    await waitForPort('127.0.0.1', GRPC_PORT);

    const definition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const sovereignProto = grpc.loadPackageDefinition(definition).sovereign;
    const client = new sovereignProto.SovereignService(ENGINE_ADDR, grpc.credentials.createInsecure());

    const response = await callIntent(client, token);
    if (!response?.accepted || !response?.trackingId) {
      throw new Error(`Unexpected handshake response: ${JSON.stringify(response)}`);
    }

    console.log(`✅ Tier 3 handshake succeeded. Tracking ID: ${response.trackingId}`);
    client.close();
  } finally {
    if (!server.killed) {
      server.kill('SIGTERM');
    }
  }
}

await main();
