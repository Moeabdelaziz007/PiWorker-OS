import crypto from "node:crypto";
import { TreasuryStorageFactory, TreasuryState, ITreasuryStorage } from "./treasury-storage";
import { SovereignBridge } from "../engine/sovereign-bridge";

/**
 * Amrikyy Treasury Vault
 * The central financial authority of PiWorker-OS.
 * Manages the national wealth and sovereign tax with full persistence.
 * [SERVERLESS READY] Optimized for Vercel/KV environments.
 */
export class AmrikyyTreasury {
  private static storage: ITreasuryStorage = TreasuryStorageFactory.getStorage();
  private static SOVEREIGN_TAX_RATE = 0.10;

  /**
   * Creates an escrow for a task, locking funds.
   * [Sovereign Sync] Prioritizes Go Muscle for fiscal integrity.
   */
  static async createEscrow(orderId: string, agentId: string, amount: number) {
    console.log(`[TREASURY] 🛡️ Initiating Escrow for ${orderId}...`);
    
    // 1. Attempt Go Muscle Sync (Priority 1)
    try {
      const lockedOnMuscle = await SovereignBridge.lockEscrow(agentId, amount);
      if (lockedOnMuscle) {
        console.log(`[TREASURY] ✅ Go Muscle confirmed escrow lock for ${agentId}.`);
      }
    } catch (err: any) {
      console.warn(`[TREASURY] ⚠️ Go Muscle unreachable: ${err.message}. Falling back to local sovereign vault.`);
    }

    // 2. Local Persistent Fallback (Priority 2)
    const state = await this.storage.load();
    
    if (state.reserves["Pi"] < amount) {
      throw new Error(`[TREASURY] ❌ Insufficient reserves: ${amount} Pi requested, ${state.reserves["Pi"]} available.`);
    }

    state.reserves["Pi"] -= amount;
    state.escrows[orderId] = { amount, agentId, status: "LOCKED" };
    
    await this.storage.save(state);
    return orderId;
  }

  /**
   * Releases escrowed funds to an agent after successful task completion.
   */
  static async releaseEscrow(orderId: string) {
    const state = await this.storage.load();
    const escrow = state.escrows[orderId];

    if (!escrow || escrow.status !== "LOCKED") {
      throw new Error(`[TREASURY] ❌ No locked escrow found for Order ${orderId}.`);
    }

    escrow.status = "RELEASED";
    await this.storage.save(state);
    console.log(`[TREASURY] 🔓 Escrow released for Order ${orderId}: ${escrow.amount} Pi credited to ${escrow.agentId}.`);
    return true;
  }

  /**
   * Processes an agent's task profit in a specific currency.
   */
  static async processInflow(agentId: string, grossProfit: number, currency: string = "Pi") {
    const state = await this.storage.load();
    
    if (!state.reserves[currency]) state.reserves[currency] = 0;
    
    const taxAmount = grossProfit * this.SOVEREIGN_TAX_RATE;
    const netProfit = grossProfit - taxAmount;
    
    state.reserves[currency] += taxAmount;
    await this.storage.save(state);

    console.log(`[TREASURY] 📥 Processed inflow for ${agentId}: Gross=${grossProfit} ${currency}, Net=${netProfit}, Tax=${taxAmount}`);

    return {
      txId: `tx-tax-${crypto.randomBytes(4).toString("hex")}`,
      agentId,
      grossProfit,
      taxAmount,
      currency,
      netToAgent: netProfit,
      newReserve: state.reserves[currency],
    };
  }

  /**
   * Deducts a usage fee for plugins and tools.
   */
  static async deductUsageFee(agentId: string, amount: number, toolName: string) {
    const state = await this.storage.load();
    state.reserves["Pi"] += amount;
    await this.storage.save(state);
    console.log(`[TREASURY] 💰 Deducted ${amount} Pi from ${agentId} for ${toolName}.`);
    return true;
  }

  /**
   * Directly modifies a specific currency reserve.
   * [Sovereign Utility] Used for swaps and diversification.
   */
  static async modifyReserve(currency: string, delta: number) {
    const state = await this.storage.load();
    if (!state.reserves[currency]) state.reserves[currency] = 0;
    state.reserves[currency] += delta;
    await this.storage.save(state);
    return state.reserves[currency];
  }

  /**
   * Returns current state of all national assets.
   * [Sovereign Sync] Merges Muscle balance with Brain reserves.
   */
  static async getStats() {
    const state = await this.storage.load();
    let muscleBalance = 0;

    try {
      const muscleStatus = await SovereignBridge.getSystemStatus();
      muscleBalance = muscleStatus.pi_balance || 0;
    } catch (err) {
      // Ignore bridge errors for stats fallback
    }

    return {
      reserves: {
        ...state.reserves,
        "Muscle_Pi": muscleBalance, // For audit transparency
        "Total_Sovereign_Pi": (state.reserves["Pi"] || 0) + muscleBalance
      },
      taxRate: this.SOVEREIGN_TAX_RATE,
      status: muscleBalance > 0 ? "SYNCHRONIZED" : "LOCAL_ONLY",
      lastAudit: state.lastUpdate
    };
  }
}
