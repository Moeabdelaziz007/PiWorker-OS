import axios from 'axios';
import { 
  AIModelProvider, 
  AIRouteRequest, 
  SovereignAIResponse, 
  AIProviderInterface 
} from '../types';

/**
 * ⚡ GROQ PROVIDER (Speed King)
 * Optimized for Llama 3 / Mixtral with sub-500ms latency.
 */
export class GroqProvider implements AIProviderInterface {
  public id = AIModelProvider.GROQ;
  private apiKey = process.env.GROQ_API_KEY;

  async execute(req: AIRouteRequest): Promise<SovereignAIResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not found in environment');
    }

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: req.systemPrompt || 'You are an ultra-fast Sovereign Agent.' },
            { role: 'user', content: req.prompt }
          ],
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        metadata: {
          provider: this.id,
          modelName: response.data.model,
          latencyMs: Date.now() - startTime,
          tokensUsed: response.data.usage.total_tokens,
          signature: `SOV_GROQ_${Date.now().toString(16)}`
        }
      };
    } catch (error: any) {
      console.error(`[GROQ-PROVIDER] Execution Error: ${error.message}`);
      throw error;
    }
  }
}
