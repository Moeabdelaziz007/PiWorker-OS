import crypto from "node:crypto";
import { PersistenceEngine } from "./persistence-engine";
import { VectorStore } from "./vector-store";
import { EmbeddingEngine } from "./embedding-engine";
export class NeuralMemoryMesh {
    static blackboard = [];
    static activeClaims = new Map();
    /**
     * Posts a signed insight to the collective memory and indexes it for vector search.
     */
    static async postInsight(insight) {
        // In production: Verify signature before posting
        this.blackboard.push(insight);
        // 1. PERSISTENCE: Save to disk
        await PersistenceEngine.saveInsight(insight);
        // 2. VECTOR INDEXING: Generate embedding and add to store
        const contentToEmbed = `${insight.topic}: ${JSON.stringify(insight.data)}`;
        const vector = await EmbeddingEngine.generate(contentToEmbed);
        VectorStore.addEntry({
            id: insight.id,
            vector,
            metadata: insight
        });
        // Maintain a rotating memory of the last 100 insights in RAM
        if (this.blackboard.length > 100) {
            this.blackboard.shift();
        }
        return { status: "COMMITTED", meshId: insight.id, indexed: true };
    }
    /**
     * Retrieves insights based on relevance or topic.
     */
    static query(topic) {
        if (!topic)
            return this.blackboard.sort((a, b) => b.relevance - a.relevance);
        return this.blackboard.filter(i => i.topic === topic);
    }
    /**
     * Semantic Search: Finds insights similar to a natural language query.
     */
    static async findSimilar(query, limit = 3) {
        console.log(`[NEURAL_MESH] Searching for experiences similar to: "${query}"`);
        const queryVector = await EmbeddingEngine.generate(query);
        const results = VectorStore.search(queryVector, limit);
        return results.map(r => r.metadata);
    }
    /**
     * Broadcasts a collective signal to all agents in a specific channel.
     */
    static async broadcast(topic, data, agentId) {
        const insight = {
            id: `hive-${crypto.randomBytes(4).toString("hex")}`,
            agentId,
            topic,
            data,
            signature: `SIG_HIVE_${agentId}`,
            timestamp: new Date().toISOString(),
            relevance: 90
        };
        await this.postInsight(insight);
        console.log(`\x1b[1m\x1b[33m[HIVE_MIND] Agent ${agentId} signaled channel #${topic}\x1b[0m`);
        return insight;
    }
    /**
     * Claims a task for an agent. Returns true if claim successful.
     */
    static claimTask(taskId, agentId, durationMs = 300000) {
        const now = Date.now();
        const existing = this.activeClaims.get(taskId);
        if (existing && existing.expires > now) {
            console.log(`[NEURAL_MEMORY] Task ${taskId} is already claimed by ${existing.agentId}`);
            return false;
        }
        this.activeClaims.set(taskId, { agentId, expires: now + durationMs });
        console.log(`\x1b[36m[NEURAL_MEMORY] Agent ${agentId} claimed task ${taskId}\x1b[0m`);
        return true;
    }
    /**
     * Releases a task claim.
     */
    static releaseTask(taskId, agentId) {
        const claim = this.activeClaims.get(taskId);
        if (claim && claim.agentId === agentId) {
            this.activeClaims.delete(taskId);
            console.log(`[NEURAL_MEMORY] Task ${taskId} released by ${agentId}`);
        }
    }
    /**
     * Generates a "Bounty" task for other agents to pick up.
     */
    static createBounty(taskName, rewardPi) {
        const bountyId = `bnty-${crypto.randomBytes(4).toString("hex")}`;
        return {
            id: bountyId,
            task: taskName,
            reward: rewardPi,
            status: "OPEN",
            issuedAt: new Date().toISOString()
        };
    }
}
