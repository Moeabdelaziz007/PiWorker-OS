import fs from "node:fs/promises";
import path from "node:path";
import { PiWorkerDID } from "./piworker-did";
import { EconomicRiskLevel } from "../governance-engine";
const REGISTRY_PATH = path.join(process.cwd(), "core/identity/agents.json");
/**
 * SOVEREIGN AGENT REGISTRY
 * Persistence layer for the autonomous workforce.
 */
export class AgentRegistry {
    static instance;
    agents = new Map();
    constructor() { }
    static async getInstance() {
        if (!AgentRegistry.instance) {
            AgentRegistry.instance = new AgentRegistry();
            await AgentRegistry.instance.load();
        }
        return AgentRegistry.instance;
    }
    /**
     * Loads agents from the persistent JSON store.
     */
    async load() {
        try {
            const data = await fs.readFile(REGISTRY_PATH, "utf-8");
            const parsed = JSON.parse(data);
            for (const agent of parsed) {
                this.agents.set(agent.id, agent);
            }
            console.log(`[REGISTRY] Loaded ${this.agents.size} agents from disk.`);
        }
        catch (error) {
            console.log("[REGISTRY] No existing registry found. Starting fresh.");
            await this.save(); // Initialize file
        }
    }
    /**
     * Persists the current fleet to disk.
     */
    async save() {
        const data = JSON.stringify(Array.from(this.agents.values()), null, 2);
        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, data);
    }
    /**
     * Registers a new agent or updates an existing one.
     */
    async registerAgent(agent) {
        // If agent doesn't have a DID-like ID, we can wrap it or ensure it's recorded
        this.agents.set(agent.id, agent);
        await this.save();
        console.log(`[REGISTRY] Agent ${agent.name} (${agent.id}) registered.`);
        return agent;
    }
    /**
     * Retrieves an agent by ID.
     */
    getAgent(id) {
        return this.agents.get(id);
    }
    /**
     * Lists all registered agents.
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Mints a new Sovereign Agent Identity.
     */
    async mintIdentity(name, role, capabilities, specialization) {
        const { did, passport } = PiWorkerDID.generate(name);
        // Convert DID-like UUID to our internal standard
        const internalId = `pw-agt-${did.split(':').pop()?.replace(/-/g, '').slice(0, 12)}`;
        const newAgent = {
            id: internalId,
            name,
            role,
            publicKey: passport.verificationMethod[0].publicKeyMultibase,
            status: "active",
            capabilities,
            specialization,
            governance: {
                betrayalThreshold: 0.9,
                minRoiRequirement: 1.0,
                riskTolerance: EconomicRiskLevel.MEDIUM
            },
            dna: {
                chromosomes: [role === "ceo" ? "strategy_node" : "execution_node"],
                mutations: [],
                generation: 1,
                fitnessScore: 100
            },
            metrics: {
                totalProfit: 0,
                tasksCompleted: 0,
                reputation: 1,
                spawnTime: new Date().toISOString()
            }
        };
        return await this.registerAgent(newAgent);
    }
}
