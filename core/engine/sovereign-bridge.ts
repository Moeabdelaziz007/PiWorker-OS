import { TelemetryLogger } from '../utils/telemetry-logger';
import { ErrorCategory, logStructured } from '../utils/observability';
import {
  EscrowRequestSchema,
  EscrowResponseSchema,
  PaymentRequestSchema,
  PaymentResponseSchema,
  PluginRequestSchema,
  PluginResponseSchema,
  SimulationRequestSchema,
  SimulationResponseSchema,
} from '../contracts/critical-contracts';
import { sovereignClient } from './sovereign-client';

export interface BridgeCallContext {
  correlationId?: string;
  requestId?: string;
  authContext?: string;
}

export type SimulationRequest = import("../contracts/critical-contracts").SimulationRequestContract;
export type SimulationResponse = import("../contracts/critical-contracts").SimulationResponseContract;

export interface EmbodiedIntentRequest {
  intentId: string;
  agentId: string;
  subtaskLanguage: string;
  executionMetadata: Record<string, string>;
  controlMode: string;
  visualSubgoals: Buffer[];
}

export interface IntentResponse {
  accepted: boolean;
  statusMessage: string;
  trackingId: string;
}

export type VerifyTxRequest = {
  txId: string;
  expectedReceiver: string;
  expectedAmount: number;
};

export type VerifyTxResponse = {
  verified: boolean;
  statusMessage: string;
  senderAddress: string;
};

export type EscrowRequest = import("../contracts/critical-contracts").EscrowRequestContract;
export type EscrowResponse = import("../contracts/critical-contracts").EscrowResponseContract;
export type PaymentRequest = import("../contracts/critical-contracts").PaymentRequestContract;
export type PaymentResponse = import("../contracts/critical-contracts").PaymentResponseContract;
export type PluginRequest = import("../contracts/critical-contracts").PluginRequestContract;
export type PluginResponse = import("../contracts/critical-contracts").PluginResponseContract;

export class SovereignBridge {
  private static isDevEnvironment(): boolean {
    const env = (process.env.APP_ENV || process.env.NODE_ENV || "").toLowerCase().trim();
    return env === "" || env === "development" || env === "dev" || env === "test" || env === "local";
  }

  private static requireEnvSecret(name: string, devFallback?: string): string {
    const value = process.env[name]?.trim();
    if (value) return value;

    if (devFallback && this.isDevEnvironment()) {
      return devFallback;
    }

    throw new Error(`[SEC_ERROR] Missing required secret: ${name}`);
  }

  private static getAuthToken(): string {
    if (typeof window !== 'undefined') return 'BROWSER_AUTH_PENDING';
    return this.requireEnvSecret("SOVEREIGN_AUTH_TOKEN", "SOVEREIGN_DEV_TOKEN");
  }

  private static async makeContext(context?: BridgeCallContext): Promise<Required<BridgeCallContext>> {
    let requestId = context?.requestId;
    if (!requestId) {
        if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
            requestId = window.crypto.randomUUID();
        } else {
            requestId = Math.random().toString(36).substring(2);
        }
    }
    
    return {
      requestId: requestId!,
      correlationId: context?.correlationId || requestId!,
      authContext: context?.authContext || 'SERVICE',
    };
  }

  public static async requestSimulation(req: SimulationRequest, context?: BridgeCallContext): Promise<SimulationResponse> {
    SimulationRequestSchema.parse(req);
    const resolved = await this.makeContext(context);

    logStructured({
      component: 'API_BRIDGE',
      operation: 'request_simulation',
      auth_context: resolved.authContext,
      request_id: resolved.requestId,
      correlation_id: resolved.correlationId,
      message: `Delegating simulation for ${req.goalId} via Connect-Lite`,
    });

    const response = await sovereignClient.requestSimulation({
      ...req,
      complexity: req.complexity ?? 0.5,
      modelVersion: req.modelVersion || "gemini-1.5-pro",
      personas: req.personas ?? ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"],
    });

    return SimulationResponseSchema.parse(response);
  }

  public static async sendEmbodiedIntent(req: EmbodiedIntentRequest, context?: BridgeCallContext): Promise<IntentResponse> {
    const resolved = await this.makeContext(context);
    const response = await sovereignClient.sendEmbodiedIntent(req);
    return response as IntentResponse;
  }

  public static async executePlugin(req: PluginRequest, context?: BridgeCallContext): Promise<PluginResponse> {
    PluginRequestSchema.parse(req);
    const resolved = await this.makeContext(context);

    let signature = req.signature ?? "SIGNED_VIA_PROXY";
    if (typeof window === 'undefined') {
      const crypto = await import('node:crypto');
      const secret = this.requireEnvSecret("AGENT_SYSTEM_SECRET", "TEMP_SIGN_SECRET");
      signature = crypto.createHmac('sha256', secret).update(req.sourceCode).digest('hex');
    }

    const response = await sovereignClient.executePlugin({
      ...req,
      signature,
    });

    return PluginResponseSchema.parse(response);
  }

  public static async commitPayment(req: PaymentRequest, context?: BridgeCallContext): Promise<PaymentResponse> {
    const normalizedRequest = PaymentRequestSchema.parse({
      ...req,
      agentAuthToken: req.agentAuthToken || this.getAuthToken(),
    });
    const resolved = await this.makeContext(context);
    const response = await sovereignClient.commitPayment(normalizedRequest);
    return PaymentResponseSchema.parse(response);
  }

  public static async verifyTransaction(req: VerifyTxRequest, context?: BridgeCallContext): Promise<VerifyTxResponse> {
    const resolved = await this.makeContext(context);
    const response = await sovereignClient.verifyTransaction(req);
    return response as VerifyTxResponse;
  }

  public static listenToEvents(callback: (data: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // For SSE, we still point to the external Go engine if possible, 
    // but usually Next.js acts as a proxy for SSE to handle auth/cors.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = `${baseUrl}/api/sovereign/events`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        callback(JSON.parse(event.data));
      } catch (e) {
        console.error('❌ [Bridge] Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = () => console.warn('⚠️ [Bridge] SSE Connection lost. Retrying...');
    return () => eventSource.close();
  }

  public static async lockEscrow(agentId: string, amountPi: number, context?: BridgeCallContext): Promise<boolean> {
    const resolved = await this.makeContext(context);
    const txId = `escrow-${Math.random().toString(16).slice(2, 10)}`;
    
    const req: EscrowRequest = EscrowRequestSchema.parse({
      txId,
      amountPi,
      targetWallet: agentId,
    });

    const response = await sovereignClient.lockEscrow(req);
    return EscrowResponseSchema.parse(response).locked;
  }
}
