import { 
  AIModelProvider, 
  AIRouteRequest, 
  SovereignAIResponse, 
  AIProviderInterface 
} from './types';
import { GeminiProvider } from './providers/gemini';
import { MistralProvider } from './providers/mistral';
import { GroqProvider } from './providers/groq';
import { DeepSeekProvider } from './providers/deepseek';
import { HuggingFaceProvider } from './providers/huggingface';

/**
 * 🛰️ SOVEREIGN AI ORCHESTRATOR
 * The "Brain" that decides which AI model to use based on logic, speed, and cost.
 * Implements Fallback and Circuit Breaker patterns.
 */
export class SovereignAIOrchestrator {
  private static instance: SovereignAIOrchestrator;
  private providers: Map<AIModelProvider, AIProviderInterface> = new Map();
  private circuitBreaker: Map<AIModelProvider, { failedAt: number; count: number }> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): SovereignAIOrchestrator {
    if (!this.instance) {
      this.instance = new SovereignAIOrchestrator();
    }
    return this.instance;
  }

  private initializeProviders() {
    this.providers.set(AIModelProvider.GEMINI, new GeminiProvider());
    this.providers.set(AIModelProvider.MISTRAL, new MistralProvider());
    this.providers.set(AIModelProvider.GROQ, new GroqProvider());
    this.providers.set(AIModelProvider.DEEPSEEK, new DeepSeekProvider());
    this.providers.set(AIModelProvider.HUGGINGFACE, new HuggingFaceProvider());
  }

  /**
   * 🧠 Primary Dispatch Method
   */
  async dispatch(prompt: string, options: Partial<AIRouteRequest>): Promise<SovereignAIResponse> {
    const req: AIRouteRequest = {
      prompt,
      agentId: options.agentId || 'system',
      priority: options.priority || 'accuracy',
      ...options
    };

    const targetProvider = this.determineBestProvider(req);
    
    try {
      return await this.executeWithFallback(targetProvider, req);
    } catch (error) {
      console.error(`[AI-ORCHESTRATOR] Critical Failure: ${error}`);
      throw new Error(`Sovereign AI failure across all fallbacks for Agent ${req.agentId}`);
    }
  }

  private determineBestProvider(req: AIRouteRequest): AIModelProvider {
    if (req.providerPreference && req.providerPreference.length > 0) {
      return req.providerPreference[0];
    }

    if ((req.contextSize || 0) > 120000) return AIModelProvider.GEMINI;
    if (req.priority === 'speed') return AIModelProvider.GROQ;
    
    if (req.prompt.toLowerCase().includes('code') || req.prompt.includes('function')) {
      return AIModelProvider.DEEPSEEK;
    }

    return AIModelProvider.MISTRAL;
  }

  private async executeWithFallback(providerId: AIModelProvider, req: AIRouteRequest): Promise<SovereignAIResponse> {
    if (this.isCircuitOpen(providerId)) {
      console.warn(`[AI-ORCHESTRATOR] Circuit OPEN for ${providerId}, skipping to fallback.`);
      return this.executeWithFallback(this.getFallbackId(providerId), req);
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      return this.executeWithFallback(this.getFallbackId(providerId), req);
    }

    try {
      const completionReq = {
        prompt: req.prompt,
        maxTokens: req.maxTokens,
        temperature: req.temperature,
        model: req.model
      };
      return await provider.complete(completionReq);
    } catch (err) {
      this.recordFailure(providerId);
      const fallback = this.getFallbackId(providerId);
      console.log(`[AI-ORCHESTRATOR] Fallback: ${providerId} -> ${fallback}`);
      return this.executeWithFallback(fallback, req);
    }
  }

  private isCircuitOpen(id: AIModelProvider): boolean {
    const status = this.circuitBreaker.get(id);
    if (!status) return false;
    if (Date.now() - status.failedAt > 300000) {
      this.circuitBreaker.delete(id);
      return false;
    }
    return status.count >= 3;
  }

  private recordFailure(id: AIModelProvider) {
    const status = this.circuitBreaker.get(id) || { failedAt: Date.now(), count: 0 };
    status.count++;
    status.failedAt = Date.now();
    this.circuitBreaker.set(id, status);
  }

  private getFallbackId(failed: AIModelProvider): AIModelProvider {
    const chain: Record<AIModelProvider, AIModelProvider> = {
      [AIModelProvider.GROQ]: AIModelProvider.DEEPSEEK,
      [AIModelProvider.DEEPSEEK]: AIModelProvider.MISTRAL,
      [AIModelProvider.MISTRAL]: AIModelProvider.GEMINI,
      [AIModelProvider.GEMINI]: AIModelProvider.HUGGINGFACE,
      [AIModelProvider.HUGGINGFACE]: AIModelProvider.GROQ,
    };
    return chain[failed];
  }
}
