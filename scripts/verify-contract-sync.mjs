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
  ['SimulationRequestSchema', ['goalId', 'parallelInstances', 'modelVersion', 'complexity', 'personas']],
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
  'export type SimulationRequest = import("../contracts/critical-contracts").SimulationRequestContract;',
  'export type SimulationResponse = import("../contracts/critical-contracts").SimulationResponseContract;',
  'export type EscrowRequest = import("../contracts/critical-contracts").EscrowRequestContract;',
  'export type EscrowResponse = import("../contracts/critical-contracts").EscrowResponseContract;',
  'export type PaymentRequest = import("../contracts/critical-contracts").PaymentRequestContract;',
  'export type PaymentResponse = import("../contracts/critical-contracts").PaymentResponseContract;',
  'export type PluginRequest = import("../contracts/critical-contracts").PluginRequestContract;',
  'export type PluginResponse = import("../contracts/critical-contracts").PluginResponseContract;',
];

for (const line of bridgeTypeChecks) {
  if (!bridgeSource.includes(line)) {
    diffs.push(`Missing bridge interface binding: ${line}`);
  }
}

if (diffs.length) {
  throw new Error(`Contract sync failed:\n${diffs.join('\n')}`);
}

console.log('Contract sync check passed (proto ↔ interfaces ↔ validators).');
