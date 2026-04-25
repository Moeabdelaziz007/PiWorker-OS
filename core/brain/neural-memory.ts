import "server-only";
import crypto from "node:crypto";
import { VectorStore } from "./vector-store";
import { EmbeddingEngine } from "./embedding-engine";
import { sovereignClient } from "../engine/sovereign-client";

/**
 * Neural Memory Mesh
 * The collective intelligence layer of Amrikyy Lab.
 * Acts as a Sovereign Blackboard for agent coordination.
 */
export interface SovereignInsight {
  id: string;
  agentId: string;
  topic: string;
  data: any;
  signature: string;
  timestamp: string;
  relevance: number; // 0-100
}

export class NeuralMemoryMesh {
  private static blackboard: SovereignInsight[] = [];
  private static activeClaims: Map<string, { agentId: string, expires: number }> = new Map();

  /**
   * Restores the collective intelligence state from the Sovereign Muscle.
   */
  static async initialize() {
    console.log(`[NEURAL_MESH] Synchronizing collective memory with Sovereign Muscle...`);
    
    try {
        const response = await sovereignClient.queryMemory({ topic: "", agent_id: "" });
        if (response && response.insights) {
            this.blackboard = response.insights.map((i: any) => ({
                id: i.id,
                agentId: i.agent_id,
                topic: i.topic,
                data: JSON.parse(i.data_json || "{}"),
                signature: i.signature,
                timestamp: i.timestamp,
                relevance: i.relevance
            })).slice(-100);
        }
    } catch (err) {
        console.warn(`⚠️ [NEURAL_MESH] Could not sync with Muscle. Falling back to local state.`);
    }
    
    // 2. Initialize Vector Store (Still local to Brain for semantic reasoning)
    await VectorStore.initialize();
    
    console.log(`[NEURAL_MESH] Memory Mesh synchronized with ${this.blackboard.length} active insights.`);
  }

  /**
   * Posts a signed insight to the collective memory (Sovereign Muscle).
   */
  static async postInsight(insight: SovereignInsight) {
    this.blackboard.push(insight);
    
    // 1. SOVEREIGN PERSISTENCE: Send to Go Muscle
    try {
        await sovereignClient.storeMemory({
            id: insight.id,
            agent_id: insight.agentId,
            topic: insight.topic,
            data_json: JSON.stringify(insight.data),
            signature: insight.signature,
            timestamp: insight.timestamp,
            relevance: insight.relevance
        });
    } catch (err) {
        console.error(`❌ [NEURAL_MESH] Sovereign store failure:`, err);
    }
    
    // 2. VECTOR INDEXING: Generate embedding and add to store
    const contentToEmbed = `${insight.topic}: ${JSON.stringify(insight.data)}`;
    const vector = await EmbeddingEngine.generate(contentToEmbed);
    
    await VectorStore.addEntry({
        id: insight.id,
        vector,
        metadata: insight
    });

    if (this.blackboard.length > 100) {
      this.blackboard.shift();
    }

    return { status: "COMMITTED", meshId: insight.id, indexed: true };
  }

  /**
   * Retrieves insights based on relevance or topic.
   */
  static query(topic?: string) {
    if (!topic) return this.blackboard.sort((a, b) => b.relevance - a.relevance);
    return this.blackboard.filter(i => i.topic === topic);
  }

  /**
   * Semantic Search: Finds insights similar to a natural language query.
   */
  static async findSimilar(query: string, limit: number = 3): Promise<SovereignInsight[]> {
    console.log(`[NEURAL_MESH] Searching for experiences similar to: "${query}"`);
    const queryVector = await EmbeddingEngine.generate(query);
    const results = VectorStore.search(queryVector, limit);
    return results.map(r => r.metadata as SovereignInsight);
  }

  /**
   * Broadcasts a collective signal to all agents in a specific channel.
   */
  static async broadcast(topic: string, data: any, agentId: string) {
    const insight: SovereignInsight = {
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
   * Claims a task for an agent.
   */
  static claimTask(taskId: string, agentId: string, durationMs: number = 300000): boolean {
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
  static releaseTask(taskId: string, agentId: string) {
    const claim = this.activeClaims.get(taskId);
    if (claim && claim.agentId === agentId) {
      this.activeClaims.delete(taskId);
      console.log(`[NEURAL_MEMORY] Task ${taskId} released by ${agentId}`);
    }
  }
}
