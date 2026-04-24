import { AgentRegistry } from "../identity/agent-registry";
import { AmrikyyTreasury } from "../finance/treasury-vault";
class FleetManager {
    registry;
    async getRegistry() {
        if (!this.registry) {
            this.registry = await AgentRegistry.getInstance();
        }
        return this.registry;
    }
    /**
     * Registers an agent and synchronizes state to disk.
     */
    async register(agent) {
        const reg = await this.getRegistry();
        await reg.registerAgent(agent);
        console.log(`[FLEET_MANAGER] Tracking Sovereign Agent: ${agent.name} (${agent.id})`);
    }
    /**
     * Updates an agent's status and syncs.
     */
    async updateStatus(agentId, status) {
        const reg = await this.getRegistry();
        const agent = reg.getAgent(agentId);
        if (agent) {
            agent.status = status;
            await reg.registerAgent(agent);
        }
    }
    /**
     * Evaluates if the fleet needs to expand based on treasury health.
     */
    async evaluateScaling() {
        const stats = AmrikyyTreasury.getStats();
        const reg = await this.getRegistry();
        const fleetSize = reg.getAllAgents().length;
        console.log(`[FLEET_MANAGER] Scaling Evaluation: Reserve at ${stats.reserves['(default)'] || 0} Pi.`);
        if ((stats.reserves['(default)'] || 0) >= 200 && fleetSize < 10) {
            console.log("\x1b[1m\x1b[32m[SCALING] Wealth threshold met. Spawning new Sovereign Agent...\x1b[0m");
            const specializations = ["BountyHunter", "MarketingSpecialist", "CodeAuditor"];
            const randomSpec = specializations[Math.floor(Math.random() * specializations.length)];
            const newAgent = await reg.mintIdentity(`Agent-${randomSpec}`, "executor", ["automated_task"], randomSpec);
            console.log(`\x1b[32m[SCALING] Success: Agent ${newAgent.name} joined the fleet.\x1b[0m`);
        }
    }
    async syncToDisk() {
        // Legacy method - no longer needed as AgentRegistry handles persistence
    }
    /**
     * Loads the fleet state from disk during initialization.
     */
    async initialize() {
        console.log("[FLEET_MANAGER] Initializing Sovereign Fleet Registry...");
        await this.getRegistry();
    }
    /**
     * Retrieves the healthiest agent for a specific specialization.
     */
    async findExecutor(specialization) {
        const reg = await this.getRegistry();
        for (const agent of reg.getAllAgents()) {
            if (agent.specialization === specialization && (agent.status === "active" || agent.status === "idle")) {
                return agent;
            }
        }
        return null;
    }
    /**
     * Returns current fleet metrics.
     */
    async getMetrics() {
        const reg = await this.getRegistry();
        const agents = reg.getAllAgents();
        const total = agents.length;
        const active = agents.filter(a => a.status === "active" || a.status === "busy").length;
        const ready = total - active;
        return { total, active, ready };
    }
    async requestCollaboration(requesterId, targetSpecialization, task) {
        const specialist = await this.findExecutor(targetSpecialization);
        if (specialist) {
            console.log(`\x1b[33m[COLLABORATION] ${requesterId} requesting ${targetSpecialization} for: ${task}\x1b[0m`);
            await this.updateStatus(specialist.id, "busy");
            return { success: true, specialistId: specialist.id };
        }
        return { success: false, message: "No available specialist found." };
    }
    async getAllAgents() {
        const reg = await this.getRegistry();
        return reg.getAllAgents();
    }
}
export const fleetManager = new FleetManager();
