import OpenAI from 'openai';
import { buildCreatorSystemPrompt } from '../creator-dna';
import { AIProvider, AiProviderHealth, AiStructuredRequest, AiStructuredResult } from './types';

export const OPENAI_MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';

function getOpenAIClient(): { client: OpenAI; provider: 'openai' | 'azure-openai'; model: string } | null {
  const openAiKey = process.env.OPENAI_API_KEY;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || OPENAI_MODEL;

  if (azureKey && azureEndpoint) {
    return {
      provider: 'azure-openai',
      model: azureDeployment,
      client: new OpenAI({
        apiKey: azureKey,
        baseURL: `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${azureDeployment}`,
        defaultQuery: { 'api-version': '2024-02-15-preview' },
        defaultHeaders: { 'api-key': azureKey }
      })
    };
  }

  if (openAiKey) {
    return {
      provider: 'openai',
      model: OPENAI_MODEL,
      client: new OpenAI({ apiKey: openAiKey })
    };
  }

  return null;
}

export class OpenAIProvider implements AIProvider {
  id = 'openai' as const;
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

  async healthCheck(): Promise<AiProviderHealth> {
    const resolved = getOpenAIClient();
    if (!resolved) {
      return { available: false, provider: this.id, model: OPENAI_MODEL, error: 'OPENAI_API_KEY or Azure OpenAI env vars are not configured' };
    }
    return { available: true, provider: resolved.provider, model: resolved.model };
  }

  async generateText(request: AiStructuredRequest): Promise<AiStructuredResult<string>> {
    const result = await this.generateStructured<{ text: string }>(request);
    return { ...result, data: result.data?.text || null };
  }

  async generateStructured<T = any>(request: AiStructuredRequest): Promise<AiStructuredResult<T>> {
    const start = Date.now();
    const resolved = getOpenAIClient();
    if (!resolved) {
      return {
        data: null,
        provider: this.id,
        model: OPENAI_MODEL,
        degraded: true,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        error: 'OpenAI is not configured'
      };
    }

    try {
      const systemPrompt = buildCreatorSystemPrompt(
        request.systemPrompt || 'You are a helpful AI assistant. Output valid JSON only.',
        request.creatorProfile
      );
      const response = await resolved.client.chat.completions.create({
        model: resolved.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: request.temperature ?? 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');

      return {
        data: JSON.parse(content) as T,
        provider: resolved.provider,
        model: resolved.model,
        degraded: false,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        rawResponse: response
      };
    } catch (error: any) {
      return {
        data: null,
        provider: resolved.provider,
        model: resolved.model,
        degraded: true,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        error: error?.message || 'OpenAI generation failed'
      };
    }
  }
}
