import crypto from "node:crypto";
import { PersistenceEngine } from "./persistence-engine";

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

  /**
   * Posts a signed insight to the collective memory.
   */
  static async postInsight(insight: SovereignInsight) {
    // In production: Verify signature before posting
    this.blackboard.push(insight);
    
    // PERSISTENCE: Save to disk
    await PersistenceEngine.saveInsight(insight);
    
    // Maintain a rotating memory of the last 100 insights
    if (this.blackboard.length > 100) {
      this.blackboard.shift();
    }

    return { status: "COMMITTED", meshId: insight.id };
  }

  /**
   * Retrieves insights based on relevance or topic.
   */
  static query(topic?: string) {
    if (!topic) return this.blackboard.sort((a, b) => b.relevance - a.relevance);
    return this.blackboard.filter(i => i.topic === topic);
  }

  /**
   * Generates a "Bounty" task for other agents to pick up.
   */
  static createBounty(taskName: string, rewardPi: number) {
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
