/**
 * MAS-ZERO :: SOVEREIGN VECTOR STORE
 * Mission: Provide ultra-fast local vector search for agent experiences.
 * Uses Cosine Similarity for semantic retrieval.
 */
export class VectorStore {
    static entries = [];
    /**
     * Adds an entry to the vector store.
     */
    static addEntry(entry) {
        this.entries.push(entry);
    }
    /**
     * Finds the top K similar entries based on cosine similarity.
     */
    static search(queryVector, topK = 3) {
        if (this.entries.length === 0)
            return [];
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
    static cosineSimilarity(v1, v2) {
        if (v1.length !== v2.length)
            return 0;
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
