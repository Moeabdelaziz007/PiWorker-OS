import axios from 'axios';
import { 
  AIModelProvider, 
  AIRouteRequest, 
  SovereignAIResponse, 
  AIProviderInterface 
} from '../types';

/**
 * 🌪️ MISTRAL AI PROVIDER
 * Custom implementation for PiWorker-OS Sovereign Infrastructure.
 */
export class MistralProvider implements AIProviderInterface {
  public id = AIModelProvider.MISTRAL;
  private apiKey = process.env.MISTRAL_API_KEY;
  private orgId = '70d476f0-1d6d-41ce-bbe5-32e50712baac'; // Sovereign Org ID

  async execute(req: AIRouteRequest): Promise<SovereignAIResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY not found in environment');
    }

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: req.systemPrompt || 'You are a Sovereign Agent in the PiWorker-OS ecosystem.' },
            { role: 'user', content: req.prompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Mistral-Org': this.orgId
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
          signature: `SOV_MISTRAL_${Date.now().toString(16)}`
        }
      };
    } catch (error: any) {
      console.error(`[MISTRAL-PROVIDER] Execution Error: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
}
