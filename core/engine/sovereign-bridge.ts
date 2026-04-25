import axios from 'axios';
import { TelemetryLogger } from '../utils/telemetry-logger';
import { PaymentSchema, PluginSchema, SimulationSchema } from './validation';
import { ErrorCategory, logStructured } from '../utils/observability';

export interface BridgeCallContext {
  correlationId?: string;
  requestId?: string;
  authContext?: string;
}

export interface SimulationRequest {
  goalId: string;
  parallelInstances: number;
  modelVersion: string;
}

export interface GeminiReasoning {
  logicChain: string;
  criticalRisks: string[];
  opportunities: string[];
  confidenceScore: string;
}

export interface SimulationResponse {
  goalId: string;
  predictedRoi: number;
  riskScore: number;
  strategyRecommendation: string;
  reasoning: GeminiReasoning;
  estimatedRevenueUsd: number;
}

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

export interface VerifyTxRequest {
  txId: string;
  expectedReceiver: string;
  expectedAmount: number;
}

export interface VerifyTxResponse {
  verified: boolean;
  statusMessage: string;
  senderAddress: string;
}

export interface EscrowRequest {
  txId: string;
  amountPi: number;
  targetWallet: string;
}

export interface PaymentRequest {
  recipientId: string;
  amountPi: number;
  agentAuthToken: string;
  priority: string;
}

export interface PaymentResponse {
  success: boolean;
  txId: string;
  explorerUrl: string;
  errorMessage?: string;
}

export interface PluginRequest {
  pluginId: string;
  sourceCode: string;
  envVars: Record<string, string>;
  allowedCapabilities: string[];
}

export interface PluginResponse {
  pluginId: string;
  success: boolean;
  outputJson: string;
  errorMessage: string;
  executionTimeMs: number;
  logs: string[];
}

export class SovereignBridge {
  private static ENGINE_URL: string = process.env.SOVEREIGN_ENGINE_URL || 'http://localhost:50051';
  private static GATEWAY_URL: string = process.env.SOVEREIGN_ENGINE_URL?.replace(':50051', ':8080') || 'http://localhost:8080';

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

  private static async getMetadata(context?: BridgeCallContext): Promise<any> {
    const { createMetadata } = await import('./grpc-client');
    const resolved = await this.makeContext(context);
    return createMetadata(this.getAuthToken(), resolved.correlationId, resolved.requestId);
  }

  private static async getClient() {
    if (typeof window !== 'undefined' || process.env.VERCEL) return null;

    try {
      const { getGrpcClient } = await import('./grpc-client');
      return getGrpcClient(this.ENGINE_URL);
    } catch {
      return null;
    }
  }

  public static async requestSimulation(req: SimulationRequest, context?: BridgeCallContext): Promise<SimulationResponse> {
    SimulationSchema.parse(req);
    const resolved = await this.makeContext(context);
    const client = await this.getClient();

    logStructured({
      component: 'API_BRIDGE',
      operation: 'request_simulation',
      auth_context: resolved.authContext,
      request_id: resolved.requestId,
      correlation_id: resolved.correlationId,
      message: `Delegating simulation for ${req.goalId}`,
    });

    if (!client) {
      return this.callViaHttp('simulate', {
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || 'gemini-1.5-pro',
      }, resolved);
    }

    const metadata = await this.getMetadata(resolved);
    return new Promise((resolve, reject) => {
      client.RequestSimulation({
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || 'gemini-1.5-pro',
        personas: ['Bull', 'Bear', 'Chaos', 'Conservative', 'Aggressive'],
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as SimulationResponse);
      });
    });
  }

  public static async sendEmbodiedIntent(req: EmbodiedIntentRequest, context?: BridgeCallContext): Promise<IntentResponse> {
    const resolved = await this.makeContext(context);
    const client = await this.getClient();

    if (!client) return this.callViaHttp('intent', req, resolved);

    const metadata = await this.getMetadata(resolved);
    return new Promise((resolve, reject) => {
      client.SendEmbodiedIntent(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as IntentResponse);
      });
    });
  }

  public static async executePlugin(req: PluginRequest, context?: BridgeCallContext): Promise<PluginResponse> {
    PluginSchema.parse(req);
    const resolved = await this.makeContext(context);
    const client = await this.getClient();

    if (!client) {
      return this.callViaHttp('execute', {
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: 'SIGNED_CLIENT_SIDE',
      }, resolved);
    }

    const metadata = await this.getMetadata(resolved);
    let signature = "SIGNED_VIA_PROXY";

    if (typeof window === 'undefined') {
      const crypto = await import('node:crypto');
      const secret = this.requireEnvSecret("AGENT_SYSTEM_SECRET", "TEMP_SIGN_SECRET");
      signature = crypto.createHmac('sha256', secret).update(req.sourceCode).digest('hex');
    }

    return new Promise((resolve, reject) => {
      client.ExecutePlugin({
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature,
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as PluginResponse);
      });
    });
  }

  public static async commitPayment(req: PaymentRequest, context?: BridgeCallContext): Promise<PaymentResponse> {
    const resolved = await this.makeContext(context);
    const client = await this.getClient();

    if (!client) return this.callViaHttp('payment', req, resolved);

    const metadata = await this.getMetadata(resolved);
    return new Promise((resolve, reject) => {
      client.CommitPayment(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as PaymentResponse);
      });
    });
  }

  public static async verifyTransaction(req: VerifyTxRequest, context?: BridgeCallContext): Promise<VerifyTxResponse> {
    const resolved = await this.makeContext(context);
    const client = await this.getClient();

    if (!client) return this.callViaHttp('verify-tx', req, resolved);

    const metadata = await this.getMetadata(resolved);
    return new Promise((resolve, reject) => {
      client.VerifyTransaction(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as VerifyTxResponse);
      });
    });
  }

  public static listenToEvents(callback: (data: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

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
    const client = await this.getClient();
    const txId = `escrow-${Math.random().toString(16).slice(2, 10)}`;
    const req = { txId, amountPi, targetWallet: agentId };

    if (!client) {
      const response = await this.callViaHttp('lock-escrow', req, resolved);
      return response.locked;
    }

    const metadata = await this.getMetadata(resolved);
    return new Promise((resolve, reject) => {
      client.LockEscrow(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response.locked);
      });
    });
  }

  private static async callViaHttp(method: string, data: any, context: Required<BridgeCallContext>): Promise<any> {
    const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || '');
    const url = process.env.VERCEL
      ? `${baseUrl}/api/sovereign/${method}`
      : `${this.GATEWAY_URL}/api/sovereign/${method}`;

    try {
      const response = await axios.post(url, data, {
        headers: {
          'X-Sovereign-Token': this.getAuthToken(),
          'X-Correlation-Id': context.correlationId,
          'X-Request-Id': context.requestId,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      const code: ErrorCategory = method === 'execute' ? 'BUILD' : 'NETWORK';
      logStructured({
        level: 'ERROR',
        component: 'API_BRIDGE',
        operation: `http_fallback_${method}`,
        auth_context: context.authContext,
        request_id: context.requestId,
        correlation_id: context.correlationId,
        error_code: code,
        message: error.message,
      });

      TelemetryLogger.log('ERROR', 'BRIDGE_HTTP_FALLBACK_FAILURE', {
        error_code: code,
        method,
        requestId: context.requestId,
        correlationId: context.correlationId,
      });
      throw error;
    }
  }

  public static async getSystemStatus(context?: BridgeCallContext): Promise<any> {
    const resolved = await this.makeContext(context);
    const url = process.env.VERCEL
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/status`
      : `${this.GATEWAY_URL}/api/status`;

    try {
      const response = await axios.get(url, {
        headers: {
          'X-Sovereign-Token': this.getAuthToken(),
          'X-Correlation-Id': resolved.correlationId,
          'X-Request-Id': resolved.requestId,
        },
      });
      return response.data;
    } catch (error: any) {
      return { status: 'OFFLINE', error: error.message };
    }
  }
}
