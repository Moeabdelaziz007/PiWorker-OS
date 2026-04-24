/**
 * MAS-ZERO AGENT SPAWNER
 * Implementation: Programmatic Initialization of Micro-SaaS Agents
 * Mission: Expand the Amrikyy Lab workforce autonomously.
 */
import crypto from "node:crypto";
import { SovereignLedger } from "../identity/sovereign-ledger";
/**
 * Spawns a new agent instance and registers it in the Sovereign Ledger.
 */
export async function spawnAgent(specialization, initialBudget) {
    const agentId = `did:piworker:fleet-${crypto.randomBytes(3).toString("hex")}`;
    console.log(`[SPAWNER] Initializing new ${specialization} Agent: ${agentId}`);
    const instance = {
        agentId,
        specialization,
        status: "INITIALIZING",
        spawnTime: new Date().toISOString(),
        piBudget: initialBudget
    };
    // Register the spawn event in the Ledger for accountability
    await SovereignLedger.etch({
        agentId: "MAS_ZERO_CORE",
        action: "ORACLE_CONSULT", // Using existing action type for registration
        inputHash: crypto.createHash("sha256").update(agentId).digest("hex"),
        outputHash: crypto.createHash("sha256").update(JSON.stringify(instance)).digest("hex"),
        signature: "CORE_AUTH_GENESIS"
    });
    // Finalize initialization
    instance.status = "READY";
    console.log(`[SPAWNER] Agent ${agentId} is now ONLINE and ready for task ingestion.`);
    return instance;
}
