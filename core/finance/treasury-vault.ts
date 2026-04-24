import crypto from "node:crypto";
import { TreasuryStorage, TreasuryState } from "./treasury-storage";

/**
 * Amrikyy Treasury Vault
 * The central financial authority of PiWorker-OS.
 * Manages the national wealth and sovereign tax with full persistence.
 */
export class AmrikyyTreasury {
  private static state: TreasuryState = TreasuryStorage.load();
  private static SOVEREIGN_TAX_RATE = 0.10;

  private static persist() {
    TreasuryStorage.save(this.state);
  }

  // Helper for internal use
  private static get reserves() { return this.state.reserves; }
  private static get escrows() { return this.state.escrows; }

  /**
   * Creates an escrow for a task, locking funds.
   */
  static createEscrow(orderId: string, agentId: string, amount: number) {
    if (this.reserves["Pi"] < amount) {
      throw new Error(`[TREASURY] ❌ Insufficient reserves for escrow: ${amount} Pi requested, ${this.reserves["Pi"]} available.`);
    }

    this.reserves["Pi"] -= amount;
    this.escrows[orderId] = { amount, agentId, status: "LOCKED" };
    
    this.persist();
    console.log(`[TREASURY] 🔐 Escrow created for Order ${orderId}: ${amount} Pi locked.`);
    return orderId;
  }

  /**
   * Releases escrowed funds to an agent after successful task completion.
   */
  static releaseEscrow(orderId: string) {
    const escrow = this.escrows[orderId];
    if (!escrow || escrow.status !== "LOCKED") {
      throw new Error(`[TREASURY] ❌ No locked escrow found for Order ${orderId}.`);
    }

    escrow.status = "RELEASED";
    this.persist();
    console.log(`[TREASURY] 🔓 Escrow released for Order ${orderId}: ${escrow.amount} Pi credited to ${escrow.agentId}.`);
    return true;
  }

  /**
   * Processes an agent's task profit in a specific currency.
   */
  static processInflow(agentId: string, grossProfit: number, currency: string = "Pi") {
    if (!this.reserves[currency]) this.reserves[currency] = 0;
    
    const taxAmount = grossProfit * this.SOVEREIGN_TAX_RATE;
    const netProfit = grossProfit - taxAmount;
    
    this.reserves[currency] += taxAmount;
    this.persist();

    return {
      txId: `tx-tax-${crypto.randomBytes(4).toString("hex")}`,
      agentId,
      grossProfit,
      taxAmount,
      currency,
      netToAgent: netProfit,
      newReserve: this.reserves[currency],
    };
  }

  /**
   * Deducts a usage fee for plugins and tools.
   */
  static deductUsageFee(agentId: string, amount: number, toolName: string) {
    this.reserves["Pi"] += amount;
    this.persist();
    console.log(`[TREASURY] 💰 Deducted ${amount} Pi from ${agentId} for ${toolName}.`);
    return true;
  }

  /**
   * Returns current state of all national assets.
   */
  static getStats() {
    return {
      reserves: this.reserves,
      taxRate: this.SOVEREIGN_TAX_RATE,
      status: "STABLE",
      lastAudit: this.state.lastUpdate
    };
  }
}
