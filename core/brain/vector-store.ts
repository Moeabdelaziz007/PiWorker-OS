import "server-only";
import { sovereignClient } from "../engine/sovereign-client";

export interface VectorEntry {
    id: string;
    vector: number[];
    metadata: any;
}

export class VectorStore {
    private static entries: VectorEntry[] = [];

    /**
     * Initializes the vector store by loading existing entries from the Sovereign Muscle.
     */
    static async initialize() {
        console.log(`[VECTOR_STORE] Synchronizing semantic memory with Sovereign Muscle...`);
        try {
            const response = await sovereignClient.queryMemory({ topic: "vector_index", agent_id: "system" });
            if (response && response.insights) {
                this.entries = response.insights.map((i: any) => ({
                    id: i.id,
                    vector: JSON.parse(i.data_json || "[]"),
                    metadata: {} // Metadata is reconstructed from insights mesh
                }));
            }
        } catch (err) {
            console.warn(`⚠️ [VECTOR_STORE] Could not sync vectors with Muscle. Starting fresh.`);
        }
        console.log(`[VECTOR_STORE] ${this.entries.length} semantic embeddings active.`);
    }

    /**
     * Adds an entry to the vector store and persists it in the Sovereign Muscle.
     */
    static async addEntry(entry: VectorEntry) {
        this.entries.push(entry);
        
        try {
            await sovereignClient.storeMemory({
                id: entry.id,
                agent_id: "system",
                topic: "vector_index",
                data_json: JSON.stringify(entry.vector),
                signature: "SIG_VECTOR",
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error(`❌ [VECTOR_STORE] Failed to persist vector:`, err);
        }
    }

    /**
     * Finds the top K similar entries based on cosine similarity.
     */
    static search(queryVector: number[], topK: number = 3): VectorEntry[] {
        if (this.entries.length === 0) return [];

        const results = this.entries.map(entry => ({
            entry,
            similarity: this.cosineSimilarity(queryVector, entry.vector)
        }));

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK)
            .map(r => r.entry);
    }

    /**
     * Standard Cosine Similarity Calculation.
     */
    private static cosineSimilarity(v1: number[], v2: number[]): number {
        if (v1.length !== v2.length) return 0;
        
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (let i = 0; i < v1.length; i++) {
            dotProduct += v1[i] * v2[i];
            mag1 += v1[i] * v1[i];
            mag2 += v2[i] * v2[i];
        }

        const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * Clears the store (for testing or reset).
     */
    static clear() {
        this.entries = [];
    }
}
