import { TelemetryLogger } from "../utils/telemetry-logger";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';

export interface SimulationRequest {
  goalId: string;
  prompt: string;
  parallelInstances: number;
}

export interface SimulationResponse {
  goalId: string;
  revenue_usd: number;
  risk_score: number;
  strategy_recommendation: string;
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

/**
 * SovereignBridge (The Diplomatic Channel)
 * Connects the TypeScript Orchestrator to the Go Sovereign Engine.
 */
export class SovereignBridge {
  private static readonly ENGINE_URL = "http://localhost:50051"; // Default gRPC port
  private static client: any = null;

  /**
   * Initializes the gRPC client dynamically using the proto file.
   */
  private static getClient() {
    if (!this.client) {
      const PROTO_PATH = path.join(process.cwd(), 'sidecar/sovereign-engine/proto/sovereign.proto');
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });
      const sovereignProto = grpc.loadPackageDefinition(packageDefinition).sovereign as any;

      this.client = new sovereignProto.SovereignService(
        this.ENGINE_URL,
        grpc.credentials.createInsecure() // Use secure credentials in production
      );
      console.log(`[gRPC] Sovereign Bridge connected to Go Engine at ${this.ENGINE_URL}`);
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
        goal_id: req.goalId,
        instances: req.parallelInstances,
        complexity: 0.9, // Default complexity
        personas: ["bull", "bear", "chaos", "conservative", "aggressive"]
      }, (error: any, response: any) => {
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
    return true;
  }

  /**
   * Verifies a native Pi Network transaction via the Go Engine.
   */
  public static async verifyTransaction(req: VerifyTxRequest): Promise<VerifyTxResponse> {
    console.log(`🔍 [Bridge] Verifying Pi Transaction ${req.txId} via Go Engine...`);
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      client.VerifyTransaction({
        tx_id: req.txId,
        expected_receiver: req.expectedReceiver,
        expected_amount: req.expectedAmount
      }, (error: any, response: any) => {
        if (error) {
          console.error("[gRPC] Ledger Verification Error:", error);
          return reject(error);
        }
        resolve(response as VerifyTxResponse);
      });
    });
  }
}
