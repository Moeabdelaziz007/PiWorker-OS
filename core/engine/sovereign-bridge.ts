import crypto from 'node:crypto';
import fs from 'node:fs';
import { TelemetryLogger } from "../utils/telemetry-logger";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';

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
}

/**
 * SovereignBridge (The Diplomatic Channel)
 * Connects the TypeScript Orchestrator to the Go Sovereign Engine.
 */
export class SovereignBridge {
  private static readonly ENGINE_URL = process.env.SOVEREIGN_ENGINE_URL || "localhost:50051";
  private static getAuthToken(): string {
    const token = process.env.SOVEREIGN_AUTH_TOKEN;
    if (!token) throw new Error("FATAL: SOVEREIGN_AUTH_TOKEN not set in environment.");
    return token;
  }
  private static client: any = null;

  // Helper to create secure metadata for gRPC calls
  private static getMetadata(): grpc.Metadata {
    const metadata = new grpc.Metadata();
    metadata.add('sovereign-auth-token', this.getAuthToken());
    return metadata;
  }

  private static getClient() {
    if (!this.client) {
      const PROTO_PATH = path.join(process.cwd(), 'sidecar/sovereign-engine/proto/sovereign.proto');
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      const sovereignProto = grpc.loadPackageDefinition(packageDefinition).sovereign as any;

      // 🔒 [mTLS] Load certificates for Neural Vault Security
      let caCert, clientCert, clientKey;

      if (process.env.SOVEREIGN_CA_CERT) {
        // Priority 1: Environment Variables
        caCert = Buffer.from(process.env.SOVEREIGN_CA_CERT, 'utf-8');
        clientCert = Buffer.from(process.env.SOVEREIGN_CLIENT_CERT || '', 'utf-8');
        clientKey = Buffer.from(process.env.SOVEREIGN_CLIENT_KEY || '', 'utf-8');
      } else {
        // Priority 2: Local Files (Dev)
        caCert = fs.readFileSync(path.join(process.cwd(), 'infra/certs/ca.crt'));
        clientCert = fs.readFileSync(path.join(process.cwd(), 'infra/certs/client.crt'));
        clientKey = fs.readFileSync(path.join(process.cwd(), 'infra/certs/client.key'));
      }

      const sslCreds = grpc.credentials.createSsl(
        caCert,
        clientKey,
        clientCert
      );

      this.client = new sovereignProto.SovereignService(
        this.ENGINE_URL,
        sslCreds, 
        {
          "grpc.primary_user_agent": "PiWorker-Orchestrator/2.0",
          "grpc.default_authority": "axiev.org"
        }
      );
      console.log(`[gRPC] Sovereign Bridge secured and connected to ${this.ENGINE_URL}`);
    }
    return this.client;
  }

  /**
   * Delegates a complex simulation task to the Go Engine.
   * This prevents the Node.js event loop from collapsing under heavy compute.
   */
  public static async requestSimulation(req: SimulationRequest): Promise<SimulationResponse> {
    console.log(`🚀 [Bridge] Delegating Goal ${req.goalId} to Go Sovereign Engine...`);

    const startTime = Date.now();
    const TIMEOUT_MS = 15000; // Increased timeout for deep Go simulations

    try {
      // Race between the actual simulation call and a timeout promise
      const result = await Promise.race([
        this.executeSimulationCall(req),
        new Promise((_, reject) => setTimeout(() => reject(new Error("SOVEREIGN_ENGINE_TIMEOUT")), TIMEOUT_MS))
      ]) as SimulationResponse;

      const duration = Date.now() - startTime;
      console.log(`📊 [Bridge] Go Engine returned results for ${req.goalId} in ${duration}ms.`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      console.error(`❌ [Bridge] Safety Triggered: ${msg}`);
      throw new Error(`Sovereign Failure: ${msg}`);
    }
  }

  private static async executeSimulationCall(req: SimulationRequest): Promise<SimulationResponse> {
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      client.RequestSimulation({
        goalId: req.goalId,
        instances: req.parallelInstances,
        complexity: 0.9,
        modelVersion: req.modelVersion || "gemini-1.5-pro",
        personas: ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"]
      }, this.getMetadata(), (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Go Engine Simulation Error:", error);
          return reject(error);
        }
        resolve(response as SimulationResponse);
      });
    });
  }

  /**
   * إرسال نية مجسدة (Embodied Intent) إلى محرك Go للتحكم الفيزيائي
   */
  public static async sendEmbodiedIntent(req: EmbodiedIntentRequest): Promise<IntentResponse> {
    console.log(`🤖 [Bridge] Sending Embodied Intent ${req.intentId} to Go Engine...`);

    // محاكاة استجابة gRPC من محرك Go
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      accepted: true,
      statusMessage: "π0.7_BRIDGE_SYNCED",
      trackingId: `track_${crypto.randomBytes(4).toString("hex")}`
    };
  }

  /**
   * Triggers a financial escrow lock in the Go sidecar.
   */
  public static async lockEscrow(agentId: string, amount: number): Promise<boolean> {
    console.log(`🔒 [Bridge] Requesting Go Escrow Lock: ${amount} Pi for ${agentId}`);
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      client.LockEscrow({
        txId: `escrow-${crypto.randomBytes(4).toString("hex")}`,
        amountPi: amount,
        targetWallet: agentId
      }, this.getMetadata(), (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Escrow Lock Error:", error);
          return reject(error);
        }
        resolve(response.locked);
      });
    });
  }

  /**
   * Verifies a native Pi Network transaction via the Go Engine.
   */
  public static async verifyTransaction(req: VerifyTxRequest): Promise<VerifyTxResponse> {
    console.log(`🔍 [Bridge] Verifying Pi Transaction ${req.txId} via Go Engine...`);
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      client.VerifyTransaction({
        txId: req.txId,
        expectedReceiver: req.expectedReceiver,
        expectedAmount: req.expectedAmount
      }, this.getMetadata(), (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Ledger Verification Error:", error);
          return reject(error);
        }
        resolve(response as VerifyTxResponse);
      });
    });
  }

  /**
   * Authorizes a payment via the Go Sovereign Engine.
   * SECURITY: Injects the AGENT_SYSTEM_SECRET for authorization.
   */
  public static async commitPayment(recipientId: string, amount: number, priority: string = "instant"): Promise<any> {
    console.log(`💰 [Bridge] Requesting Secure Payment: ${amount} Pi to ${recipientId}`);
    const client = this.getClient();

    const agentToken = process.env.AGENT_SYSTEM_SECRET;
    if (!agentToken) throw new Error("FATAL: AGENT_SYSTEM_SECRET not set. Payments blocked.");

    return new Promise((resolve, reject) => {
      client.CommitPayment({
        recipientId: recipientId,
        amountPi: amount,
        agentAuthToken: agentToken,
        priority: priority
      }, this.getMetadata(), (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Payment Authorization Error:", error);
          return reject(error);
        }
        if (!response.success) {
          console.error(`❌ [Bridge] Payment Rejected: ${response.tx_id}`);
          return reject(new Error("UNAUTHORIZED_PAYMENT_REQUEST"));
        }
        resolve(response);
      });
    });
  }

  /**
   * Executes untrusted plugin code within the Go Sovereign Sandbox (Ring 3).
   * SECURITY: Generates an IBCT-compliant signature for the source code.
   */
  public static async executePlugin(req: PluginRequest): Promise<PluginResponse> {
    console.log(`🛡️ [Bridge] Delegating Sandbox Execution for ${req.pluginId} to Go...`);
    const client = this.getClient();

    // 🖋️ [Steel Gate] Sign the source code to prevent MITM tampering
    const secret = process.env.AGENT_SYSTEM_SECRET || "TEMP_SIGN_SECRET";
    const signature = crypto.createHmac('sha256', secret).update(req.sourceCode).digest('hex');

    return new Promise((resolve, reject) => {
      client.ExecutePlugin({
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: signature
      }, this.getMetadata(), (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Sandbox Execution Error:", error);
          return reject(error);
        }
        resolve(response as PluginResponse);
      });
    });
  }
}
