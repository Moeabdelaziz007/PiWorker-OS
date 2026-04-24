import { GoogleGenerativeAI } from "@google/generative-ai";
/**
 * MAS-ZERO :: EMBEDDING ENGINE
 * Mission: Generate high-dimensional vectors for semantic memory.
 */
export class EmbeddingEngine {
    static genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    /**
     * Generates an embedding for a given text.
     * Uses text-embedding-004 for optimal semantic mapping.
     */
    static async generate(text) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        }
        catch (error) {
            console.error("[EMBEDDING] Generation failed, returning zero-vector fallback:", error);
            // Fallback: 768-dimensional zero vector (standard for text-embedding-004)
            return new Array(768).fill(0);
        }
    }
}
