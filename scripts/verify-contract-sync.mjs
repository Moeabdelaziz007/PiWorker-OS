import path from 'node:path';
import { assertExactSet, getProtoFields, getSchemaKeys, readFile } from './contract-utils.mjs';

const protoPath = path.join(process.cwd(), 'sidecar/sovereign-engine/proto/sovereign.proto');
const contractsPath = path.join(process.cwd(), 'core/contracts/critical-contracts.ts');
const bridgePath = path.join(process.cwd(), 'core/engine/sovereign-bridge.ts');

const proto = readFile(protoPath);
const contractsSource = readFile(contractsPath);
const bridgeSource = readFile(bridgePath);
const diffs = [];

const protoChecks = [
  ['SimulationRequest', ['goal_id', 'instances', 'complexity', 'personas', 'model_version']],
  ['SimulationResponse', ['goal_id', 'predicted_roi', 'risk_score', 'strategy_recommendation', 'reasoning', 'estimated_revenue_usd']],
  ['PluginRequest', ['plugin_id', 'source_code', 'env_vars', 'allowed_capabilities', 'signature']],
  ['PluginResponse', ['plugin_id', 'success', 'output_json', 'error_message', 'execution_time_ms', 'logs']],
  ['PaymentRequest', ['recipient_id', 'amount_pi', 'agent_auth_token', 'priority']],
  ['PaymentResponse', ['success', 'tx_id', 'explorer_url', 'error_message']],
  ['EscrowRequest', ['tx_id', 'amount_pi', 'target_wallet']],
  ['EscrowResponse', ['locked', 'escrow_address']],
];

for (const [message, expected] of protoChecks) {
  assertExactSet(`${message} proto fields`, getProtoFields(proto, message), expected, diffs);
}

const schemaChecks = [
  ['SimulationRequestSchema', ['goalId', 'instances', 'modelVersion', 'complexity', 'personas']],
  ['SimulationResponseSchema', ['goalId', 'predictedRoi', 'riskScore', 'strategyRecommendation', 'reasoning', 'estimatedRevenueUsd']],
  ['PluginRequestSchema', ['pluginId', 'sourceCode', 'envVars', 'allowedCapabilities', 'signature']],
  ['PluginResponseSchema', ['pluginId', 'success', 'outputJson', 'errorMessage', 'executionTimeMs', 'logs']],
  ['PaymentRequestSchema', ['recipientId', 'amountPi', 'agentAuthToken', 'priority']],
  ['PaymentResponseSchema', ['success', 'txId', 'explorerUrl', 'errorMessage']],
  ['EscrowRequestSchema', ['txId', 'amountPi', 'targetWallet']],
  ['EscrowResponseSchema', ['locked', 'escrowAddress']],
];

for (const [schemaName, expected] of schemaChecks) {
  assertExactSet(`${schemaName} keys`, getSchemaKeys(contractsSource, schemaName), expected, diffs);
}

const bridgeTypeChecks = [
  ['SimulationRequest', 'SimulationRequestContract'],
  ['SimulationResponse', 'SimulationResponseContract'],
  ['EscrowRequest', 'EscrowRequestContract'],
  ['EscrowResponse', 'EscrowResponseContract'],
  ['PaymentRequest', 'PaymentRequestContract'],
  ['PaymentResponse', 'PaymentResponseContract'],
  ['PluginRequest', 'PluginRequestContract'],
  ['PluginResponse', 'PluginResponseContract'],
];

// The bridge file mixes single/double quotes and occasionally splits a
// type alias across two lines. Use a regex that tolerates either quote
// style and whitespace (including newlines) inside the declaration so
// we are validating the contract, not the formatting.
for (const [typeName, contractName] of bridgeTypeChecks) {
  const pattern = new RegExp(
    `export\\s+type\\s+${typeName}\\s*=\\s*` +
      `import\\s*\\(\\s*["']\\.\\.\\/contracts\\/critical-contracts["']\\s*\\)\\s*\\.\\s*` +
      `${contractName}\\s*;`,
    'm',
  );
  if (!pattern.test(bridgeSource)) {
    diffs.push(
      `Missing bridge interface binding: export type ${typeName} = import("../contracts/critical-contracts").${contractName};`,
    );
  }
}

if (diffs.length) {
  throw new Error(`Contract sync failed:\n${diffs.join('\n')}`);
}

console.log('Contract sync check passed (proto ↔ interfaces ↔ validators).');
