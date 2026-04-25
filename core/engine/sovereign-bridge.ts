import { TelemetryLogger } from "../utils/telemetry-logger";
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
import axios from 'axios';

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

/**
 * SovereignBridge (The Diplomatic Channel)
 * Connects the TypeScript Orchestrator to the Go Sovereign Engine.
 */
export class SovereignBridge {
  private static ENGINE_URL: string = process.env.SOVEREIGN_ENGINE_URL || "http://localhost:50051";
  private static GATEWAY_URL: string = process.env.SOVEREIGN_ENGINE_URL?.replace(':50051', ':8080') || "http://localhost:8080";
  
  private static getAuthToken(): string {
    if (typeof window !== 'undefined') return "BROWSER_AUTH_PENDING";
    const token = process.env.SOVEREIGN_AUTH_TOKEN;
    if (!token) return "SOVEREIGN_DEV_TOKEN";
    return token;
  }
  
  private static client: any = null;

  // Helper to create secure metadata for gRPC calls
  private static async getMetadata(): Promise<any> {
    const { createMetadata } = await import('./grpc-client');
    return createMetadata(this.getAuthToken());
  }

  private static async getClient() {
    if (typeof window !== 'undefined' || process.env.VERCEL) return null;
    
    try {
      const { getGrpcClient } = await import('./grpc-client');
      return getGrpcClient(this.ENGINE_URL);
    } catch (e) {
      return null;
    }
  }

  /**
   * Delegates a complex simulation task to the Go Engine.
   */
  public static async requestSimulation(req: SimulationRequest): Promise<SimulationResponse> {
    console.log(`🚀 [Bridge] Delegating Goal ${req.goalId} to Go Sovereign Engine...`);
    SimulationRequestSchema.parse(req);

    const client = await this.getClient();
    if (!client) {
      const response = await this.callViaHttp('simulate', {
        goalId: req.goalId,
        instances: req.parallelInstances,
        complexity: req.complexity ?? 0.5,
        modelVersion: req.modelVersion || "gemini-1.5-pro",
        personas: req.personas ?? ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"],
      });
      return SimulationResponseSchema.parse(response);

    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.RequestSimulation({
        goalId: req.goalId,
        instances: req.parallelInstances,
        complexity: req.complexity ?? 0.5,
        modelVersion: req.modelVersion || "gemini-1.5-pro",
        personas: req.personas ?? ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"],
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(SimulationResponseSchema.parse(response));
      });
    });
  }

  /**
   * إرسال نية مجسدة (Embodied Intent) إلى محرك Go للتحكم الفيزيائي
   */
  public static async sendEmbodiedIntent(req: EmbodiedIntentRequest): Promise<IntentResponse> {
    console.log(`🤖 [Bridge] Sending Embodied Intent ${req.intentId} to Go Engine...`);
    const client = await this.getClient();

    if (!client) {
      return this.callViaHttp('intent', req);
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.SendEmbodiedIntent(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as IntentResponse);
      });
    });
  }

  public static async executePlugin(req: PluginRequest): Promise<PluginResponse> {
    console.log(`🛡️ [Bridge] Delegating Sandbox Execution for ${req.pluginId} to Go...`);
    PluginRequestSchema.parse(req);

    const client = await this.getClient();
    let signature = req.signature ?? "SIGNED_VIA_PROXY";
    if (typeof window === 'undefined') {
      const crypto = await import('node:crypto');
      const secret = process.env.AGENT_SYSTEM_SECRET || "TEMP_SIGN_SECRET";
      signature = crypto.createHmac('sha256', secret).update(req.sourceCode).digest('hex');
    }

    if (!client) {
      const response = await this.callViaHttp('execute', {
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature,
      });
      return PluginResponseSchema.parse(response);
    }

    const metadata = await this.getMetadata();

    return new Promise((resolve, reject) => {
      client.ExecutePlugin({
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: signature
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(PluginResponseSchema.parse(response));
      });
    });
  }

  /**
   * Authorizes and commits a Pi payment via the Sovereign Engine.
   */
  public static async commitPayment(req: PaymentRequest): Promise<PaymentResponse> {
    console.log(`💰 [Bridge] Committing Payment for ${req.recipientId}: ${req.amountPi} Pi...`);
    
    const normalizedRequest = PaymentRequestSchema.parse({
      ...req,
      agentAuthToken: req.agentAuthToken || this.getAuthToken(),
    });

    const client = await this.getClient();
    if (!client) {
      const response = await this.callViaHttp('payment', normalizedRequest);
      return PaymentResponseSchema.parse(response);
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.CommitPayment(normalizedRequest, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(PaymentResponseSchema.parse(response));
      });
    });
  }

  /**
   * Verifies a Pi transaction on the ledger.
   */
  public static async verifyTransaction(req: VerifyTxRequest): Promise<VerifyTxResponse> {
    console.log(`🔍 [Bridge] Verifying Transaction ${req.txId}...`);
    
    const client = await this.getClient();
    if (!client) {
      return this.callViaHttp('verify-tx', req);
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.VerifyTransaction(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as VerifyTxResponse);
      });
    });
  }

  /**
   * Listen for real-time telemetry and fiscal events via SSE.
   */
  public static listenToEvents(callback: (data: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const url = `${baseUrl}/api/sovereign/events`;
    
    console.log(`📡 [Bridge] Subscribing to Sovereign Event Stream: ${url}`);
    
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (e) {
        console.error("❌ [Bridge] Failed to parse SSE data:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("⚠️ [Bridge] SSE Connection lost. Retrying...");
    };

    return () => eventSource.close();
  }

  /**
   * Financial Layer: Lock Escrow (Sovereign Guard)
   * Locks funds in an escrow on the Go Sovereign Engine.
   */
  public static async lockEscrow(agentId: string, amountPi: number): Promise<boolean> {
    console.log(`🛡️ [Bridge] Locking ${amountPi} Pi in escrow for ${agentId}...`);
    
    const client = await this.getClient();
    const txId = `escrow-${Math.random().toString(16).slice(2, 10)}`;
    const req: EscrowRequest = EscrowRequestSchema.parse({
      txId,
      amountPi,
      targetWallet: agentId,
    });

    if (!client) {
      const response = await this.callViaHttp('lock-escrow', req);
      return EscrowResponseSchema.parse(response).locked;
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.LockEscrow(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(EscrowResponseSchema.parse(response).locked);
      });
    });
  }

  /**
   * Unified HTTP Fallback Caller
   */
  private static async callViaHttp(method: string, data: any): Promise<any> {
    const baseUrl = typeof window !== 'undefined' ? "" : (process.env.NEXT_PUBLIC_APP_URL || "");
    console.log(`🌐 [Bridge] Falling back to HTTP/1.1 for ${method}...`);
    
    const url = process.env.VERCEL 
      ? `${baseUrl}/api/sovereign/${method}`
      : `${this.GATEWAY_URL}/api/sovereign/${method}`;

    try {
      const response = await axios.post(url, data, {
        headers: {
          'X-Sovereign-Token': this.getAuthToken(),
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`❌ [Bridge] HTTP Fallback Failed: ${error.message}`);
      throw error;
    }
  }

  // Simplified existing methods to use the same pattern if needed
  public static async getSystemStatus(): Promise<any> {
    const url = process.env.VERCEL 
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/sovereign/status`
      : `${this.GATEWAY_URL}/api/status`;
    
    try {
      const response = await axios.get(url, {
        headers: { 'X-Sovereign-Token': this.getAuthToken() }
      });
      return response.data;
    } catch (error: any) {
      return { status: "OFFLINE", error: error.message };
    }
  }
}
