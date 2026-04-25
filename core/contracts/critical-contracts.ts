import { z } from 'zod';

export const SimulationRequestSchema = z
  .object({
    goalId: z.string().min(1),
    instances: z.number().int().min(1).max(500),
    modelVersion: z.string().regex(/^gemini-/),
    complexity: z.number().min(0).max(1).optional(),
    personas: z.array(z.string().min(1)).optional(),
  })
  .strict();

// Converter for Protobuf/gRPC (camelCase in TS → snake_case in proto)
export const toProtoSimulationRequest = (data: z.infer<typeof SimulationRequestSchema>) => ({
  goal_id: data.goalId,
  instances: data.instances,
  model_version: data.modelVersion,
  ...(data.complexity !== undefined && { complexity: data.complexity }),
  ...(data.personas && { personas: data.personas }),
});

export const GeminiReasoningSchema = z
  .object({
    logicChain: z.string(),
    criticalRisks: z.array(z.string()),
    opportunities: z.array(z.string()),
    confidenceScore: z.string(),
  })
  .strict();

export const toProtoGeminiReasoning = (data: z.infer<typeof GeminiReasoningSchema>) => ({
  logic_chain: data.logicChain,
  critical_risks: data.criticalRisks,
  opportunities: data.opportunities,
  confidence_score: data.confidenceScore,
});

export const SimulationResponseSchema = z
  .object({
    goalId: z.string().min(1),
    predictedRoi: z.number(),
    riskScore: z.number(),
    strategyRecommendation: z.string(),
    reasoning: GeminiReasoningSchema,
    estimatedRevenueUsd: z.number(),
  })
  .strict();

export const toProtoSimulationResponse = (data: z.infer<typeof SimulationResponseSchema>) => ({
  goal_id: data.goalId,
  predicted_roi: data.predictedRoi,
  risk_score: data.riskScore,
  strategy_recommendation: data.strategyRecommendation,
  reasoning: {
    logic_chain: data.reasoning.logicChain,
    critical_risks: data.reasoning.criticalRisks,
    opportunities: data.reasoning.opportunities,
    confidence_score: data.reasoning.confidenceScore,
  },
  estimated_revenue_usd: data.estimatedRevenueUsd,
});

export const EscrowRequestSchema = z
  .object({
    txId: z.string().min(1),
    amountPi: z.number().positive(),
    targetWallet: z.string().min(1),
  })
  .strict();

export const toProtoEscrowRequest = (data: z.infer<typeof EscrowRequestSchema>) => ({
  tx_id: data.txId,
  amount_pi: data.amountPi,
  target_wallet: data.targetWallet,
});

export const EscrowResponseSchema = z
  .object({
    locked: z.boolean(),
    escrowAddress: z.string().min(1),
  })
  .strict();

export const toProtoEscrowResponse = (data: z.infer<typeof EscrowResponseSchema>) => ({
  locked: data.locked,
  escrow_address: data.escrowAddress,
});

export const PaymentRequestSchema = z
  .object({
    recipientId: z.string().min(10, 'Invalid Pi wallet address format'),
    amountPi: z.number().positive().max(1000000, 'Maximum transaction limit reached'),
    agentAuthToken: z.string().min(1),
    priority: z.enum(['instant', 'standard', 'batch']).default('standard'),
  })
  .strict();

export const toProtoPaymentRequest = (data: z.infer<typeof PaymentRequestSchema>) => ({
  recipient_id: data.recipientId,
  amount_pi: data.amountPi,
  agent_auth_token: data.agentAuthToken,
  priority: data.priority,
});

export const PaymentResponseSchema = z
  .object({
    success: z.boolean(),
    txId: z.string(),
    explorerUrl: z.string(),
    errorMessage: z.string().optional(),
  })
  .strict();

export const toProtoPaymentResponse = (data: z.infer<typeof PaymentResponseSchema>) => ({
  success: data.success,
  tx_id: data.txId,
  explorer_url: data.explorerUrl,
  ...(data.errorMessage !== undefined && { error_message: data.errorMessage }),
});

export const PluginRequestSchema = z
  .object({
    pluginId: z.string().min(3),
    sourceCode: z.string().min(1),
    envVars: z.record(z.string()),
    allowedCapabilities: z.array(z.string()),
    signature: z.string().min(1).optional(),
  })
  .strict();

export const toProtoPluginRequest = (data: z.infer<typeof PluginRequestSchema>) => ({
  plugin_id: data.pluginId,
  source_code: data.sourceCode,
  env_vars: data.envVars,
  allowed_capabilities: data.allowedCapabilities,
  ...(data.signature !== undefined && { signature: data.signature }),
});

export const PluginResponseSchema = z
  .object({
    pluginId: z.string(),
    success: z.boolean(),
    outputJson: z.string(),
    errorMessage: z.string(),
    executionTimeMs: z.number(),
    logs: z.array(z.string()),
  })
  .strict();

export const toProtoPluginResponse = (data: z.infer<typeof PluginResponseSchema>) => ({
  plugin_id: data.pluginId,
  success: data.success,
  output_json: data.outputJson,
  error_message: data.errorMessage,
  execution_time_ms: data.executionTimeMs,
  logs: data.logs,
});

export const HealthStatusSchema = z
  .object({
    timestamp: z.string(),
    status: z.enum(['OPERATIONAL', 'DEGRADED']),
    layers: z
      .object({
        orchestrator: z.object({ status: z.string(), version: z.string() }).strict(),
        sovereign_engine: z
          .object({
            status: z.enum(['UNKNOWN', 'ONLINE', 'OFFLINE']),
            latency: z.string().nullable(),
            error: z.string().optional(),
          })
          .strict(),
        pi_network: z.object({ status: z.string(), network: z.string() }).strict(),
      })
      .strict(),
  })
  .strict();

export const toProtoHealthStatus = (data: z.infer<typeof HealthStatusSchema>) => ({
  timestamp: data.timestamp,
  status: data.status,
  layers: {
    orchestrator: {
      status: data.layers.orchestrator.status,
      version: data.layers.orchestrator.version,
    },
    sovereign_engine: {
      status: data.layers.sovereign_engine.status,
      latency: data.layers.sovereign_engine.latency || '',
      ...(data.layers.sovereign_engine.error !== undefined && {
        error: data.layers.sovereign_engine.error,
      }),
    },
    pi_network: {
      status: data.layers.pi_network.status,
      network: data.layers.pi_network.network,
    },
  },
});

export type SimulationRequestContract = z.infer<typeof SimulationRequestSchema>;
export type SimulationResponseContract = z.infer<typeof SimulationResponseSchema>;
export type EscrowRequestContract = z.infer<typeof EscrowRequestSchema>;
export type EscrowResponseContract = z.infer<typeof EscrowResponseSchema>;
export type PaymentRequestContract = z.infer<typeof PaymentRequestSchema>;
export type PaymentResponseContract = z.infer<typeof PaymentResponseSchema>;
export type PluginRequestContract = z.infer<typeof PluginRequestSchema>;
export type PluginResponseContract = z.infer<typeof PluginResponseSchema>;
export type HealthStatusContract = z.infer<typeof HealthStatusSchema>;

// --- Embodied Intent Types ---
export const EmbodiedIntentSchema = z.object({
  intentId: z.string(),
  agentId: z.string(),
  subtaskLanguage: z.string(),
  executionMetadata: z.record(z.string()),
  controlMode: z.string(),
  visualSubgoals: z.array(z.instanceof(Buffer)),
});
export type EmbodiedIntentContract = z.infer<typeof EmbodiedIntentSchema>;

export const IntentResponseSchema = z.object({
  accepted: z.boolean(),
  statusMessage: z.string(),
  trackingId: z.string(),
});
export type IntentResponseContract = z.infer<typeof IntentResponseSchema>;

export const VerifyTxRequestSchema = z.object({
  txId: z.string(),
  expectedReceiver: z.string(),
  expectedAmount: z.number(),
});
export type VerifyTxRequestContract = z.infer<typeof VerifyTxRequestSchema>;

export const VerifyTxResponseSchema = z.object({
  verified: z.boolean(),
  statusMessage: z.string(),
  senderAddress: z.string(),
});
export type VerifyTxResponseContract = z.infer<typeof VerifyTxResponseSchema>;

export const MemoryInsightSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  topic: z.string(),
  dataJson: z.string(),
  signature: z.string(),
  timestamp: z.string(),
  relevance: z.number(),
});
export type MemoryInsightContract = z.infer<typeof MemoryInsightSchema>;

export const MemoryResponseSchema = z.object({
  success: z.boolean(),
  memoryId: z.string(),
});
export type MemoryResponseContract = z.infer<typeof MemoryResponseSchema>;

export const MemoryQuerySchema = z.object({
  topic: z.string(),
  agentId: z.string(),
  semanticQuery: z.string(),
});
export type MemoryQueryContract = z.infer<typeof MemoryQuerySchema>;

export const MemoryListSchema = z.object({
  insights: z.array(MemoryInsightSchema),
});
export type MemoryListContract = z.infer<typeof MemoryListSchema>;

export const ApprovePiPaymentSchema = z.object({
  paymentId: z.string().min(1),
});

export const CompletePiPaymentSchema = z.object({
  paymentId: z.string().min(1),
  txid: z.string().min(1),
});

// --- Proto Converters ---
export const toProtoEmbodiedIntent = (data: z.infer<typeof EmbodiedIntentSchema>) => ({
  intent_id: data.intentId,
  agent_id: data.agentId,
  subtask_language: data.subtaskLanguage,
  execution_metadata: data.executionMetadata,
  control_mode: data.controlMode,
  visual_subgoals: data.visualSubgoals,
});

export const toProtoVerifyTxRequest = (data: z.infer<typeof VerifyTxRequestSchema>) => ({
  tx_id: data.txId,
  expected_receiver: data.expectedReceiver,
  expected_amount: data.expectedAmount,
});

export const toProtoStoreMemory = (data: z.infer<typeof MemoryInsightSchema>) => ({
  id: data.id,
  agent_id: data.agentId,
  topic: data.topic,
  data_json: data.dataJson,
  signature: data.signature,
  timestamp: data.timestamp,
  relevance: data.relevance,
});

export const toProtoMemoryQuery = (data: z.infer<typeof MemoryQuerySchema>) => ({
  topic: data.topic,
  agent_id: data.agentId,
  semantic_query: data.semanticQuery,
});

export const AgentDNAContractSchema = z
  .object({
    greed: z.number().min(0).max(1),
    cunning: z.number().min(0).max(1),
    cognition: z.number().min(0).max(1),
    riskAppetite: z.number().min(0).max(1),
    generation: z.number().int(),
    fitnessScore: z.number(),
  })
  .strict();

export const VortexRequestSchema = z
  .object({
    agentId: z.string(),
    actualRoi: z.number(),
    minRequirement: z.number(),
    currentBudget: z.number(),
    dna: AgentDNAContractSchema,
  })
  .strict();

export const toProtoVortexRequest = (data: z.infer<typeof VortexRequestSchema>) => ({
  agent_id: data.agentId,
  actual_roi: data.actualRoi,
  min_requirement: data.minRequirement,
  current_budget: data.currentBudget,
  dna: {
    greed: data.dna.greed,
    cunning: data.dna.cunning,
    cognition: data.dna.cognition,
    risk_appetite: data.dna.riskAppetite,
    generation: data.dna.generation,
    fitness_score: data.dna.fitnessScore,
  },
});

export const VortexResponseSchema = z
  .object({
    isSolvent: z.boolean(),
    cannibalizedAmt: z.number(),
    remainingBudget: z.number(),
    action: z.string(),
    sovereignTreasury: z.number(),
  })
  .strict();

export type VortexRequestContract = z.infer<typeof VortexRequestSchema>;
export type VortexResponseContract = z.infer<typeof VortexResponseSchema>;

export const CriticalContractSchemas = {
  simulation: {
    request: SimulationRequestSchema,
    response: SimulationResponseSchema,
  },
  pluginExecution: {
    request: PluginRequestSchema,
    response: PluginResponseSchema,
  },
  payment: {
    request: PaymentRequestSchema,
    response: PaymentResponseSchema,
  },
  escrow: {
    request: EscrowRequestSchema,
    response: EscrowResponseSchema,
  },
  statusHealth: {
    response: HealthStatusSchema,
  },
  embodiedIntent: {
    request: EmbodiedIntentSchema,
    response: IntentResponseSchema,
  },
  verifyTx: {
    request: VerifyTxRequestSchema,
    response: VerifyTxResponseSchema,
  },
  memory: {
    store: MemoryInsightSchema,
    response: MemoryResponseSchema,
    query: MemoryQuerySchema,
    list: MemoryListSchema,
  },
  vortex: {
    evaluate: {
      request: VortexRequestSchema,
      response: VortexResponseSchema,
    },
  },
} as const;
