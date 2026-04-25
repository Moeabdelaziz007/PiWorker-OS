import { AIProviderInterface, AIModelProvider, AICompletionRequest, AICompletionResponse } from '../types';

export class HuggingFaceProvider implements AIProviderInterface {
  private apiKey: string;
  private defaultModel = 'mistralai/Mistral-7B-Instruct-v0.3'; // نموذج قوي ومجاني

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.apiKey) throw new Error('Hugging Face API Key is missing');

    const model = request.model || this.defaultModel;
    
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            inputs: request.prompt,
            parameters: {
              max_new_tokens: request.maxTokens || 1000,
              temperature: request.temperature || 0.7,
              return_full_text: false,
            },
          }),
        }
      );

      const result = await response.json();
      
      // Hugging Face قد يرجع مصفوفة أو كائن بناءً على النموذج
      const content = Array.isArray(result) 
        ? result[0].generated_text 
        : result.generated_text || JSON.stringify(result);

      return {
        content,
        provider: AIModelProvider.HUGGINGFACE,
        model: model,
        usage: {
          promptTokens: 0, // HF API لا يرجع التوكنز دائماً بشكل مباشر
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      throw error;
    }
  }
}
