import crypto from "node:crypto";
/**
 * Amrikyy Treasury Vault
 * The central financial authority of PiWorker-OS.
 * Manages the national wealth (175 Pi) and sovereign tax.
 */
export class AmrikyyTreasury {
    static RESERVES = {
        "Pi": 175.0,
        "SOL": 0.0,
        "ETH": 0.0
    };
    static ESCROWS = {};
    static SOVEREIGN_TAX_RATE = 0.10;
    /**
     * Creates an escrow for a task, locking funds.
     */
    static createEscrow(orderId, agentId, amount) {
        if (this.RESERVES["Pi"] < amount) {
            throw new Error(`[TREASURY] ❌ Insufficient reserves for escrow: ${amount} Pi requested, ${this.RESERVES["Pi"]} available.`);
        }
        this.RESERVES["Pi"] -= amount;
        this.ESCROWS[orderId] = { amount, agentId, status: "LOCKED" };
        console.log(`[TREASURY] 🔐 Escrow created for Order ${orderId}: ${amount} Pi locked.`);
        return orderId;
    }
    /**
     * Releases escrowed funds to an agent after successful task completion.
     */
    static releaseEscrow(orderId) {
        const escrow = this.ESCROWS[orderId];
        if (!escrow || escrow.status !== "LOCKED") {
            throw new Error(`[TREASURY] ❌ No locked escrow found for Order ${orderId}.`);
        }
        escrow.status = "RELEASED";
        // Funds are "released" to the agent's hypothetical wallet (simulated by processInflow if needed)
        console.log(`[TREASURY] 🔓 Escrow released for Order ${orderId}: ${escrow.amount} Pi credited to ${escrow.agentId}.`);
        return true;
    }
    /**
     * Processes an agent's task profit in a specific currency.
     */
    static processInflow(agentId, grossProfit, currency = "Pi") {
        if (!this.RESERVES[currency])
            this.RESERVES[currency] = 0;
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
    static deductUsageFee(agentId, amount, toolName) {
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
