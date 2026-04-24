import { z } from 'zod';
/**
 * Gemma Sovereign Brain Adapter
 * Logic: Interface with local Ollama instance for zero-cost, private reasoning.
 * Pattern: Clean Room Logic Extraction from Google DeepMind Gemma specs.
 */
export const GemmaConfigSchema = z.object({
    baseUrl: z.string().url().default('http://localhost:11434'),
    executorModel: z.string().default('gemma:2b'), // Fast, lightweight for tasks
    orchestratorModel: z.string().default('gemma:27b'), // Deep reasoning for CEO roles
    temperature: z.number().min(0).max(1).default(0.7),
    contextWindow: z.number().default(8192),
});
export class GemmaAdapter {
    config;
    constructor(config) {
        this.config = GemmaConfigSchema.parse(config || {});
    }
    /**
     * Generates a response from the local Gemma model.
     * Logic: Switches model based on the 'isOrchestrator' flag for Hybrid Reasoning.
     */
    async generate(prompt, isOrchestrator = false, systemPrompt) {
        const modelToUse = isOrchestrator ? this.config.orchestratorModel : this.config.executorModel;
        console.log(`[GemmaAdapter] Using model: ${modelToUse} (Role: ${isOrchestrator ? 'CEO' : 'Executor'})`);
        try {
            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelToUse,
                    prompt: prompt,
                    system: systemPrompt || 'You are MAS-ZERO, the sovereign governor of the PiWorker-OS ecosystem. Act with absolute precision and engineering excellence.',
                    stream: false,
                    options: {
                        temperature: this.config.temperature,
                        num_ctx: this.config.contextWindow,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama Error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.response;
        }
        catch (error) {
            console.error('[GemmaAdapter] Generation Failed:', error);
            throw new Error(`Sovereign Brain Failure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Simple health check for local Ollama/Gemma availability.
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
}
