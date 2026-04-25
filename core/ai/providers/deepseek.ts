import axios from 'axios';
import { 
  AIModelProvider, 
  AIRouteRequest, 
  SovereignAIResponse, 
  AIProviderInterface 
} from '../types';

/**
 * 🐉 DEEPSEEK PROVIDER (Logic & Logic King)
 * High-precision Chinese model for complex tasks.
 */
export class DeepSeekProvider implements AIProviderInterface {
  public id = AIModelProvider.DEEPSEEK;
  private apiKey = process.env.DEEPSEEK_API_KEY;

  async execute(req: AIRouteRequest): Promise<SovereignAIResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY not found in environment');
    }

    try {
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: req.systemPrompt || 'You are a Sovereign Logic Agent.' },
            { role: 'user', content: req.prompt }
          ],
          stream: false
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
          signature: `SOV_DEEPSEEK_${Date.now().toString(16)}`
        }
      };
    } catch (error: any) {
      console.error(`[DEEPSEEK-PROVIDER] Execution Error: ${error.message}`);
      throw error;
    }
  }
}
