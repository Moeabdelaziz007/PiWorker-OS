import { z } from 'zod';

/**
 * AMRIKYY LAB :: SOVEREIGN VALIDATION (Brain Layer)
 * PURPOSE: Zero-Trust validation for all incoming intents and gRPC requests.
 * Ensures the Next.js Orchestrator never passes garbage to the Go Muscle.
 */

export const PaymentSchema = z.object({
  recipientId: z.string().min(10, "Invalid Pi wallet address format"),
  amountPi: z.number().positive().max(1000000, "Maximum transaction limit reached"),
  priority: z.enum(["instant", "standard", "batch"]).default("standard"),
  metadata: z.record(z.string()).optional(),
});

export const SimulationSchema = z.object({
  goalId: z.string().uuid(),
  parallelInstances: z.number().int().min(1).max(500),
  modelVersion: z.string().regex(/^gemini-/, "Must be a valid Gemini model"),
});

export const PluginSchema = z.object({
  pluginId: z.string().min(3),
  sourceCode: z.string().min(1),
  envVars: z.record(z.string()),
  allowedCapabilities: z.array(z.string()),
});

export type ValidatedPayment = z.infer<typeof PaymentSchema>;
export type ValidatedSimulation = z.infer<typeof SimulationSchema>;
export type ValidatedPlugin = z.infer<typeof PluginSchema>;
