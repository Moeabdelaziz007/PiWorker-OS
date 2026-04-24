import crypto from "node:crypto";
import { PersistenceEngine } from "./persistence-engine";
export class NeuralMemoryMesh {
    static blackboard = [];
    /**
     * Posts a signed insight to the collective memory.
     */
    static async postInsight(insight) {
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
    static query(topic) {
        if (!topic)
            return this.blackboard.sort((a, b) => b.relevance - a.relevance);
        return this.blackboard.filter(i => i.topic === topic);
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
