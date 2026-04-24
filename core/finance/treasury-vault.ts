import crypto from "node:crypto";

/**
 * Amrikyy Treasury Vault
 * The central financial authority of PiWorker-OS.
 * Manages the national wealth (175 Pi) and sovereign tax.
 */
export class AmrikyyTreasury {
  private static RESERVES: Record<string, number> = {
    "Pi": 175.0,
    "SOL": 0.0,
    "ETH": 0.0
  };
  private static SOVEREIGN_TAX_RATE = 0.10;

  /**
   * Processes an agent's task profit in a specific currency.
   */
  static processInflow(agentId: string, grossProfit: number, currency: string = "Pi") {
    if (!this.RESERVES[currency]) this.RESERVES[currency] = 0;
    
    const taxAmount = grossProfit * this.SOVEREIGN_TAX_RATE;
    const netProfit = grossProfit - taxAmount;
    
    this.RESERVES[currency] += taxAmount;

    return {
      txId: `tx-tax-${crypto.randomBytes(4).toString("hex")}`,
      agentId,
      grossProfit,
      taxAmount,
      currency,
      netToAgent: netProfit,
      newReserve: this.RESERVES[currency],
    };
  }

  /**
   * Deducts a usage fee for plugins and tools.
   */
  static deductUsageFee(agentId: string, amount: number, toolName: string) {
    this.RESERVES["Pi"] += amount;
    console.log(`[TREASURY] 💰 Deducted ${amount} Pi from ${agentId} for ${toolName}.`);
    return true;
  }

  /**
   * Returns current state of all national assets.
   */
  static getStats() {
    return {
      reserves: this.RESERVES,
      taxRate: this.SOVEREIGN_TAX_RATE,
      status: "STABLE",
      lastAudit: new Date().toISOString()
    };
  }
}
