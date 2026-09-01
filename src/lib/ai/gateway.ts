import { saveAiEvent } from '@/lib/data/ai-history-service';
import { GeminiProvider, MockProvider, OllamaProvider, OpenAIProvider } from './providers';
import { AIProvider, AiCapability, AiProviderId, AiStructuredRequest, AiStructuredResult } from './providers/types';
import { AiTaskType } from './types';

const providerInstances: Record<AiProviderId, AIProvider> = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  'azure-openai': new OpenAIProvider(),
  ollama: new OllamaProvider(),
  mock: new MockProvider()
};

const capabilityRoutes: Record<AiCapability, AiProviderId[]> = {
  idea_generation: ['gemini', 'openai', 'ollama', 'mock'],
  script_generation: ['gemini', 'openai', 'ollama', 'mock'],
  hook_analysis: ['gemini', 'openai', 'ollama', 'mock'],
  storyboard_generation: ['gemini', 'openai', 'ollama', 'mock'],
  caption_generation: ['gemini', 'openai', 'ollama', 'mock'],
  caption_rewrite: ['gemini', 'openai', 'ollama', 'mock'],
  visual_planning: ['gemini', 'openai', 'ollama', 'mock'],
  metadata_generation: ['gemini', 'openai', 'ollama', 'mock'],
  creator_analysis: ['gemini', 'openai', 'ollama', 'mock'],
  cta_generation: ['gemini', 'openai', 'ollama', 'mock'],
  repurpose: ['gemini', 'openai', 'ollama', 'mock']
};

const taskByCapability: Partial<Record<AiCapability, AiTaskType>> = {
  caption_generation: 'caption_generation',
  caption_rewrite: 'caption_rewrite',
  hook_analysis: 'hook_suggestion',
  metadata_generation: 'hashtag_suggestion',
  cta_generation: 'cta_suggestion',
  repurpose: 'repurpose'
};

export interface AiGatewayRequest extends AiStructuredRequest {
  userId?: string;
  preferredProvider?: AiProviderId;
  responsePreview?: (data: any) => string;
  persistEvent?: boolean;
}

export interface AiGatewayStatus {
  configuredProvider: AiProviderId | 'auto';
  routes: Record<AiCapability, AiProviderId[]>;
  providers: Array<{
    provider: AiProviderId;
    available: boolean;
    model?: string | null;
    baseUrl?: string;
    error?: string;
  }>;
}

function configuredProvider(): AiProviderId | 'auto' {
  const configured = process.env.AI_PROVIDER as AiProviderId | undefined;
  if (configured && configured in providerInstances) return configured;
  return 'auto';
}

function providerOrder(capability: AiCapability, preferredProvider?: AiProviderId): AiProviderId[] {
  if (preferredProvider) {
    return Array.from(new Set([preferredProvider, ...capabilityRoutes[capability]]));
  }

  const configured = configuredProvider();
  if (configured !== 'auto') {
    return Array.from(new Set([configured, ...capabilityRoutes[capability]]));
  }

  return capabilityRoutes[capability];
}

async function recordGatewayEvent(request: AiGatewayRequest, result: AiStructuredResult<any>) {
  if (!request.persistEvent || !request.userId) return;

  const taskType = taskByCapability[request.capability];
  if (!taskType) return;

  const preview = request.responsePreview?.(result.data) || `${request.capability} via ${result.provider}`;
  await saveAiEvent(
    { task_type: taskType, preview },
    request.userId,
    {
      capability: request.capability,
      schemaName: request.schemaName,
      prompt: request.prompt,
      creatorProfilePresent: Boolean(request.creatorProfile)
    },
    {
      provider: result.provider,
      model: result.model,
      degraded: result.degraded,
      fallbackUsed: result.fallbackUsed,
      latencyMs: result.latencyMs,
      reason: result.reason,
      error: result.error,
      data: result.data
    },
    result.provider
  ).catch(() => {});
}

export async function generateStructured<T = any>(request: AiGatewayRequest): Promise<AiStructuredResult<T>> {
  const start = Date.now();
  const errors: string[] = [];
  const order = providerOrder(request.capability, request.preferredProvider);

  for (const providerId of order) {
    const provider = providerInstances[providerId];
    if (!provider.capabilities.includes(request.capability)) continue;

    if (providerId !== 'mock') {
      const health = await provider.healthCheck(Math.min(request.timeoutMs || 15000, 2500));
      if (!health.available) {
        errors.push(`${providerId}: ${health.error || 'unavailable'}`);
        continue;
      }
    }

    const result = await provider.generateStructured<T>(request);
    const successful = result.data !== null && !result.error;
    if (successful || providerId === 'mock') {
      const finalResult = {
        ...result,
        fallbackUsed: providerId !== order[0] || result.fallbackUsed,
        degraded: providerId === 'mock' || result.degraded,
        reason: providerId === 'mock'
          ? (errors.length ? `Fallback chain exhausted: ${errors.join('; ')}` : result.reason)
          : result.reason,
        latencyMs: Date.now() - start
      };
      await recordGatewayEvent(request, finalResult);
      return finalResult;
    }

    errors.push(`${providerId}: ${result.error || 'empty response'}`);
  }

  const mockResult = await providerInstances.mock.generateStructured<T>(request);
  const finalResult = {
    ...mockResult,
    fallbackUsed: true,
    degraded: true,
    reason: errors.length ? `Fallback chain exhausted: ${errors.join('; ')}` : mockResult.reason,
    latencyMs: Date.now() - start
  };
  await recordGatewayEvent(request, finalResult);
  return finalResult;
}

export async function getAiGatewayStatus(): Promise<AiGatewayStatus> {
  const providerIds: AiProviderId[] = ['gemini', 'openai', 'ollama', 'mock'];
  const providers = await Promise.all(providerIds.map(async (providerId) => {
    const health = await providerInstances[providerId].healthCheck(1000);
    return {
      provider: providerId,
      available: health.available,
      model: health.model,
      baseUrl: health.baseUrl,
      error: health.error
    };
  }));

  return {
    configuredProvider: configuredProvider(),
    routes: capabilityRoutes,
    providers
  };
}
