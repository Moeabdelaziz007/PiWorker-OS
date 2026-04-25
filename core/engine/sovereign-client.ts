import "server-only";

/**
 * SovereignClient - High-Performance, Zero-Dependency RPC Client
 * Logic: Implements the Connect-RPC (Lite) protocol using native fetch.
 * Pattern: Decoupled Brain-Muscle Communication.
 */

export class SovereignClient {
  private readonly baseUrl: string;
  private readonly authToken: string;

  constructor() {
    this.baseUrl = process.env.SOVEREIGN_ENGINE_URL || "http://127.0.0.1:8080";
    this.authToken = process.env.SOVEREIGN_AUTH_TOKEN || "SOVEREIGN_DEV_TOKEN";
  }

  /**
   * Universal RPC call handler.
   */
  private async call<TReq, TRes>(method: string, request: TReq): Promise<TRes> {
    const url = `${this.baseUrl}/sovereign.SovereignService/${method}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sovereign-token": this.authToken,
        },
        body: JSON.stringify(request),
        // Important for Vercel/Edge: Ensure timeout is handled
        signal: AbortSignal.timeout(10000), 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[SOVEREIGN_RPC_ERROR] ${response.status} ${response.statusText}: ${errorText}`);
      }

      return (await response.json()) as TRes;
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new Error(`[SOVEREIGN_TIMEOUT] Brain-Muscle sync timed out at ${url}`);
      }
      throw err;
    }
  }

  // --- RPC Methods (Mirrored from sovereign.proto) ---

  async requestSimulation(req: any) {
    return this.call<any, any>("RequestSimulation", req);
  }

  async lockEscrow(req: any) {
    return this.call<any, any>("LockEscrow", req);
  }

  async verifyTransaction(req: any) {
    return this.call<any, any>("VerifyTransaction", req);
  }

  async commitPayment(req: any) {
    return this.call<any, any>("CommitPayment", req);
  }

  async sendEmbodiedIntent(req: any) {
    return this.call<any, any>("SendEmbodiedIntent", req);
  }

  async executePlugin(req: any) {
    return this.call<any, any>("ExecutePlugin", req);
  }

  async storeMemory(req: any) {
    return this.call<any, any>("StoreMemory", req);
  }

  async queryMemory(req: any) {
    return this.call<any, any>("QueryMemory", req);
  }

  async evaluateVortex(req: { agent_id: string; actual_roi: number; min_requirement: number; current_budget: number }) {
    return this.call<any, any>("EvaluateVortex", req);
  }

  async getTreasury() {
    return this.call<any, any>("GetTreasury", {});
  }
}

// Singleton instance for global use
export const sovereignClient = new SovereignClient();
