import axios from 'axios';
import { createHmac } from 'node:crypto';
import { PluginSchema, SimulationSchema } from './validation';

export interface SimulationRequest {
  goalId: string;
  parallelInstances: number;
  modelVersion: string; // gemini-1.5-pro
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

export interface EscrowResponse {
  locked: boolean;
  escrowAddress: string;
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
    SimulationSchema.parse(req);

    const client = await this.getClient();
    if (!client) {
      return this.callViaHttp('simulate', {
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || "gemini-1.5-pro"
      });
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.RequestSimulation({
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || "gemini-1.5-pro",
        personas: ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"]
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as SimulationResponse);
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
    PluginSchema.parse(req);

    const client = await this.getClient();
    if (!client) {
      return this.callViaHttp('execute', {
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: "SIGNED_CLIENT_SIDE" // Simplified for now
      });
    }

    const metadata = await this.getMetadata();
    const secret = process.env.AGENT_SYSTEM_SECRET || "TEMP_SIGN_SECRET";
    const signature = createHmac('sha256', secret).update(req.sourceCode).digest('hex');

    return new Promise((resolve, reject) => {
      client.ExecutePlugin({
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: signature
      }, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as PluginResponse);
      });
    });
  }

  /**
   * Authorizes and commits a Pi payment via the Sovereign Engine.
   */
  public static async commitPayment(req: PaymentRequest): Promise<PaymentResponse> {
    console.log(`💰 [Bridge] Committing Payment for ${req.recipientId}: ${req.amountPi} Pi...`);
    
    const client = await this.getClient();
    if (!client) {
      return this.callViaHttp('payment', req);
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.CommitPayment(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as PaymentResponse);
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
    const req: EscrowRequest = {
      txId,
      amountPi,
      targetWallet: agentId
    };

    if (!client) {
      const response = await this.callViaHttp('lock-escrow', req);
      return response.locked;
    }

    const metadata = await this.getMetadata();
    return new Promise((resolve, reject) => {
      client.LockEscrow(req, metadata, (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response.locked);
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
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/status`
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
