/**
 * 🧬 SOVEREIGN AI TYPES
 * Mission: Unified abstraction for multi-model intelligence.
 */

export enum AIModelProvider {
  GEMINI = 'GEMINI',
  GROQ = 'GROQ',
  MISTRAL = 'MISTRAL',
  DEEPSEEK = 'DEEPSEEK',
  HUGGINGFACE = 'HUGGINGFACE'
}

export type AIRoutePriority = 'speed' | 'accuracy' | 'cost';

export interface AIRouteRequest {
  prompt: string;
  contextSize?: number;
  priority?: AIRoutePriority;
  agentId: string;
  systemPrompt?: string;
}

export interface SovereignAIResponse {
  content: string;
  metadata: {
    provider: AIModelProvider;
    modelName: string;
    latencyMs: number;
    tokensUsed: number;
    signature: string;
  };
}

export interface AIProviderInterface {
  id: AIModelProvider;
  execute(req: AIRouteRequest): Promise<SovereignAIResponse>;
}
