import { buildCreatorSystemPrompt } from '../creator-dna';
import { generateOllamaStructured, getOllamaDefaultModel, getOllamaStatus } from '../ollama-client';
import { AIProvider, AiProviderHealth, AiStructuredRequest, AiStructuredResult } from './types';

export class OllamaProvider implements AIProvider {
  id = 'ollama' as const;
  capabilities = [
    'idea_generation',
    'script_generation',
    'hook_analysis',
    'storyboard_generation',
    'caption_generation',
    'caption_rewrite',
    'visual_planning',
    'metadata_generation',
    'creator_analysis',
    'cta_generation',
    'repurpose'
  ] as const;

  async healthCheck(timeoutMs = 2000): Promise<AiProviderHealth> {
    const status = await getOllamaStatus(timeoutMs);
    return {
      available: status.available,
      provider: this.id,
      model: status.selectedModel,
      baseUrl: status.baseUrl,
      error: status.error
    };
  }

  async generateText(request: AiStructuredRequest): Promise<AiStructuredResult<string>> {
    const result = await this.generateStructured<{ text: string }>(request);
    return { ...result, data: result.data?.text || null };
  }

  async generateStructured<T = any>(request: AiStructuredRequest): Promise<AiStructuredResult<T>> {
    const start = Date.now();
    const systemPrompt = buildCreatorSystemPrompt(
      request.systemPrompt || 'You are a helpful AI assistant. Output valid JSON only.',
      request.creatorProfile
    );
    const result = await generateOllamaStructured<T>(`${systemPrompt}\n\n${request.prompt}`, {
      model: getOllamaDefaultModel() || undefined,
      temperature: request.temperature ?? 0.3,
      timeoutMs: request.timeoutMs || 15000
    });

    return {
      data: result.data || null,
      provider: this.id,
      model: getOllamaDefaultModel(),
      degraded: !result.success,
      fallbackUsed: false,
      latencyMs: Date.now() - start,
      error: result.error
    };
  }
}
