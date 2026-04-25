import {
  PaymentRequestSchema,
  SimulationRequestSchema,
  PluginRequestSchema,
  type PaymentRequestContract,
  type SimulationRequestContract,
  type PluginRequestContract,
} from "../contracts/critical-contracts";

/**
 * AMRIKYY LAB :: SOVEREIGN VALIDATION (Brain Layer)
 * PURPOSE: Zero-Trust validation for all incoming intents and gRPC requests.
 * Ensures the Next.js Orchestrator never passes garbage to the Go Muscle.
 */

export const PaymentSchema = PaymentRequestSchema;
export const SimulationSchema = SimulationRequestSchema;
export const PluginSchema = PluginRequestSchema;

export type ValidatedPayment = PaymentRequestContract;
export type ValidatedSimulation = SimulationRequestContract;
export type ValidatedPlugin = PluginRequestContract;
