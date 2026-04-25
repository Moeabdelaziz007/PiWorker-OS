import crypto from 'node:crypto';
import fs from 'node:fs';
import { TelemetryLogger } from "../utils/telemetry-logger";
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { PathResolver } from '../utils/path-resolver';
import { SovereignCipher } from '../utils/sovereign-cipher';
import axios from 'axios';
import { PaymentSchema, SimulationSchema, PluginSchema } from './validation';

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
  private static readonly ENGINE_URL = process.env.SOVEREIGN_ENGINE_URL || "localhost:50051";
  private static readonly GATEWAY_URL = process.env.SOVEREIGN_GATEWAY_URL || "http://localhost:50052";
  
  private static getAuthToken(): string {
    const token = process.env.SOVEREIGN_AUTH_TOKEN;
    if (!token) return "SOVEREIGN_DEV_TOKEN"; // Fallback for dev
    return token;
  }
  
  private static client: any = null;

  // Helper to create secure metadata for gRPC calls
  private static getMetadata(): grpc.Metadata {
    const metadata = new grpc.Metadata();
    metadata.add('x-sovereign-token', this.getAuthToken());
    return metadata;
  }

  private static getClient() {
    if (process.env.VERCEL) return null; // Force HTTP on Vercel

    if (!this.client) {
      try {
        const PROTO_PATH = PathResolver.getProtoPath();
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
          keepCase: false,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true
        });
        const sovereignProto = grpc.loadPackageDefinition(packageDefinition).sovereign as any;
        const insecureCreds = grpc.credentials.createInsecure();

        this.client = new sovereignProto.SovereignService(
          this.ENGINE_URL,
          insecureCreds, 
          {
            "grpc.primary_user_agent": "PiWorker-Orchestrator/2.0",
            "grpc.default_authority": "axiev.org"
          }
        );
      } catch (e) {
        console.warn("⚠️ [Bridge] gRPC Initialization failed, falling back to HTTP.");
        return null;
      }
    }
    return this.client;
  }

  /**
   * Delegates a complex simulation task to the Go Engine.
   */
  public static async requestSimulation(req: SimulationRequest): Promise<SimulationResponse> {
    console.log(`🚀 [Bridge] Delegating Goal ${req.goalId} to Go Sovereign Engine...`);
    SimulationSchema.parse(req);

    const client = this.getClient();
    if (!client) {
      return this.callViaHttp('simulate', {
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || "gemini-1.5-pro"
      });
    }

    return new Promise((resolve, reject) => {
      client.RequestSimulation({
        goalId: req.goalId,
        instances: req.parallelInstances,
        modelVersion: req.modelVersion || "gemini-1.5-pro",
        personas: ["Bull", "Bear", "Chaos", "Conservative", "Aggressive"]
      }, this.getMetadata(), (error: any, response: any) => {
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
    const client = this.getClient();

    if (!client) {
      return this.callViaHttp('intent', req);
    }

    return new Promise((resolve, reject) => {
      client.SendEmbodiedIntent(req, this.getMetadata(), (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as IntentResponse);
      });
    });
  }

  public static async executePlugin(req: PluginRequest): Promise<PluginResponse> {
    console.log(`🛡️ [Bridge] Delegating Sandbox Execution for ${req.pluginId} to Go...`);
    PluginSchema.parse(req);

    const secret = process.env.AGENT_SYSTEM_SECRET || "TEMP_SIGN_SECRET";
    const signature = crypto.createHmac('sha256', secret).update(req.sourceCode).digest('hex');

    const client = this.getClient();
    if (!client) {
      return this.callViaHttp('execute', {
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: signature
      });
    }

    return new Promise((resolve, reject) => {
      client.ExecutePlugin({
        pluginId: req.pluginId,
        sourceCode: req.sourceCode,
        envVars: req.envVars,
        allowedCapabilities: req.allowedCapabilities,
        signature: signature
      }, this.getMetadata(), (error: any, response: any) => {
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
    
    const client = this.getClient();
    if (!client) {
      return this.callViaHttp('payment', req);
    }

    return new Promise((resolve, reject) => {
      client.CommitPayment(req, this.getMetadata(), (error: any, response: any) => {
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
    
    const client = this.getClient();
    if (!client) {
      return this.callViaHttp('verify-tx', req);
    }

    return new Promise((resolve, reject) => {
      client.VerifyTransaction(req, this.getMetadata(), (error: any, response: any) => {
        if (error) return reject(error);
        resolve(response as VerifyTxResponse);
      });
    });
  }

  /**
   * Unified HTTP Fallback Caller
   */
  private static async callViaHttp(method: string, payload: any): Promise<any> {
    console.log(`🌐 [Bridge] Falling back to HTTP/1.1 for ${method}...`);
    // On Vercel, the API is at /api/sovereign/* (configured in vercel.json)
    const url = process.env.VERCEL 
      ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/sovereign/${method}`
      : `${this.GATEWAY_URL}/api/sovereign/${method}`;

    try {
      const response = await axios.post(url, payload, {
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
