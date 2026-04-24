import { AgentInstance, AgentSpecialization, spawnAgent } from "./agent-spawner.js";
import { PersistenceEngine } from "../brain/persistence-engine.js";
import { AmrikyyTreasury } from "../finance/treasury-vault.js";

class FleetManager {
  private fleet: Map<string, AgentInstance> = new Map();

  /**
   * Registers an agent and synchronizes state to disk.
   */
  async register(agent: AgentInstance) {
    this.fleet.set(agent.agentId, agent);
    console.log(`[FLEET_MANAGER] Tracking Agent: ${agent.agentId} (${agent.specialization})`);
    await this.syncToDisk();
  }

  /**
   * Updates an agent's status and syncs.
   */
  async updateStatus(agentId: string, status: "READY" | "BUSY" | "OFFLINE") {
    const agent = this.fleet.get(agentId);
    if (agent) {
      agent.status = status;
      await this.syncToDisk();
    }
  }

  /**
   * Evaluates if the fleet needs to expand based on treasury health.
   */
  async evaluateScaling() {
    const stats = AmrikyyTreasury.getStats();
    console.log(`[FLEET_MANAGER] Scaling Evaluation: Reserve at ${stats.reserve} Pi.`);

    if (stats.reserve >= 200 && this.fleet.size < 10) {
      console.log("\x1b[1m\x1b[32m[SCALING] Wealth threshold met. Spawning new Sovereign Agent...\x1b[0m");
      const specializations: AgentSpecialization[] = ["BountyHunter", "MarketingSpecialist", "CodeAuditor"];
      const randomSpec = specializations[Math.floor(Math.random() * specializations.length)];
      
      const newAgent = await spawnAgent(`AUTON-${this.fleet.size + 1}`, 50);
      await this.register(newAgent);
      
      console.log(`\x1b[32m[SCALING] Success: Agent ${newAgent.agentId} joined the fleet.\x1b[0m`);
    }
  }

  private async syncToDisk() {
    await PersistenceEngine.saveFleetState(Array.from(this.fleet.values()));
  }

  /**
   * Loads the fleet state from disk during initialization.
   */
  async initialize() {
    console.log("[FLEET_MANAGER] Initializing Sovereign Fleet...");
    // Future: Load from PersistenceEngine.loadFleetState();
  }

  /**
   * Retrieves the healthiest agent for a specific specialization.
   */
  findExecutor(specialization: AgentSpecialization): AgentInstance | null {
    for (const agent of this.fleet.values()) {
      if (agent.specialization === specialization && agent.status === "READY") {
        return agent;
      }
    }
    return null;
  }

  /**
   * Returns current fleet metrics.
   */
  getMetrics() {
    const total = this.fleet.size;
    const active = Array.from(this.fleet.values()).filter(a => a.status === "BUSY").length;
    const ready = total - active;
    
    return { total, active, ready };
  }

  getAllAgents() {
    return Array.from(this.fleet.values());
  }
}

export const fleetManager = new FleetManager();
