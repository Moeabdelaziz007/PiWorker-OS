import { z } from "zod";

export const SimulationRequestSchema = z.object({
  goalId: z.string().min(1),
  instances: z.number().int().min(1).max(500),
  modelVersion: z.string().regex(/^gemini-/),
  complexity: z.number().min(0).max(1).optional(),
  personas: z.array(z.string().min(1)).optional(),
}).strict();

export const GeminiReasoningSchema = z.object({
  logicChain: z.string(),
  criticalRisks: z.array(z.string()),
  opportunities: z.array(z.string()),
  confidenceScore: z.string(),
}).strict();

export const SimulationResponseSchema = z.object({
  goalId: z.string().min(1),
  predictedRoi: z.number(),
  riskScore: z.number(),
  strategyRecommendation: z.string(),
  reasoning: GeminiReasoningSchema,
  estimatedRevenueUsd: z.number(),
}).strict();

export const EscrowRequestSchema = z.object({
  txId: z.string().min(1),
  amountPi: z.number().positive(),
  targetWallet: z.string().min(1),
}).strict();

export const EscrowResponseSchema = z.object({
  locked: z.boolean(),
  escrowAddress: z.string().min(1),
}).strict();

export const PaymentRequestSchema = z.object({
  recipientId: z.string().min(10, "Invalid Pi wallet address format"),
  amountPi: z.number().positive().max(1000000, "Maximum transaction limit reached"),
  agentAuthToken: z.string().min(1),
  priority: z.enum(["instant", "standard", "batch"]).default("standard"),
}).strict();

export const PaymentResponseSchema = z.object({
  success: z.boolean(),
  txId: z.string(),
  explorerUrl: z.string(),
  errorMessage: z.string().optional(),
}).strict();

export const PluginRequestSchema = z.object({
  pluginId: z.string().min(3),
  sourceCode: z.string().min(1),
  envVars: z.record(z.string()),
  allowedCapabilities: z.array(z.string()),
  signature: z.string().min(1).optional(),
}).strict();

export const PluginResponseSchema = z.object({
  pluginId: z.string(),
  success: z.boolean(),
  outputJson: z.string(),
  errorMessage: z.string(),
  executionTimeMs: z.number(),
  logs: z.array(z.string()),
}).strict();

export const HealthStatusSchema = z.object({
  timestamp: z.string(),
  status: z.enum(["OPERATIONAL", "DEGRADED"]),
  layers: z.object({
    orchestrator: z.object({ status: z.string(), version: z.string() }).strict(),
    sovereign_engine: z.object({
      status: z.enum(["UNKNOWN", "ONLINE", "OFFLINE"]),
      latency: z.string().nullable(),
      error: z.string().optional(),
    }).strict(),
    pi_network: z.object({ status: z.string(), network: z.string() }).strict(),
  }).strict(),
}).strict();

export type SimulationRequestContract = z.infer<typeof SimulationRequestSchema>;
export type SimulationResponseContract = z.infer<typeof SimulationResponseSchema>;
export type EscrowRequestContract = z.infer<typeof EscrowRequestSchema>;
export type EscrowResponseContract = z.infer<typeof EscrowResponseSchema>;
export type PaymentRequestContract = z.infer<typeof PaymentRequestSchema>;
export type PaymentResponseContract = z.infer<typeof PaymentResponseSchema>;
export type PluginRequestContract = z.infer<typeof PluginRequestSchema>;
export type PluginResponseContract = z.infer<typeof PluginResponseSchema>;
export type HealthStatusContract = z.infer<typeof HealthStatusSchema>;

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
} as const;
