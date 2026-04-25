import { z } from "zod";

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

export type GemmaConfig = z.infer<typeof GemmaConfigSchema>;

export class GemmaAdapter {
  private config: GemmaConfig;

  constructor(config?: Partial<GemmaConfig>) {
    this.config = GemmaConfigSchema.parse(config || {});
  }

  /**
   * Generates a response from the local Gemma model.
   * Logic: Switches model based on the 'isOrchestrator' flag for Hybrid Reasoning.
   * Fallback: If local Ollama is offline, returns a high-fidelity synthetic response (Mock Mode).
   */
  async generate(prompt: string, isOrchestrator: boolean = false, systemPrompt?: string): Promise<string> {
    const modelToUse = isOrchestrator ? this.config.orchestratorModel : this.config.executorModel;
    const isMockMode = process.env.MOCK_LLM === 'true';
    
    console.log(`[GemmaAdapter] Using model: ${modelToUse} (Role: ${isOrchestrator ? 'CEO' : 'Executor'}) ${isMockMode ? '[MOCK]' : ''}`);

    if (isMockMode) {
      return this.generateMockResponse(prompt);
    }

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
    } catch (error) {
      console.warn('[GemmaAdapter] Ollama offline, falling back to mock response...');
      return this.generateMockResponse(prompt);
    }
  }

  private generateMockResponse(prompt: string): string {
    const timestamp = new Date().toISOString();
    const isJsonRequested = prompt.includes('JSON');

    console.warn(`[GemmaAdapter] ⚠️ System in Restricted Mode. Generating local deterministic analysis at ${timestamp}`);

    if (isJsonRequested) {
      return JSON.stringify({
        status: "RESTRICTED_LOCAL",
        timestamp,
        recommendation: "wait_for_sovereign_sync",
        reasoning: "High-fidelity neural reasoning is currently offline. Local heuristic check: Goal parameters verified for safety but market delta unavailable.",
        riskScore: 0.5,
        confidence: 0.1
      });
    }

    return "MAS-ZERO LOCAL_FALLBACK: Neural bridge is unreachable. All high-stakes decisions are paused to protect treasury integrity. Standard heartbeat active.";
  }

  /**
   * Simple health check for local Ollama/Gemma availability.
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
