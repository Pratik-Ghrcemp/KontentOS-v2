import { CreatorBrainContext } from '../creator-dna';

export type AiCapability =
  | 'idea_generation'
  | 'script_generation'
  | 'hook_analysis'
  | 'storyboard_generation'
  | 'caption_generation'
  | 'caption_rewrite'
  | 'visual_planning'
  | 'metadata_generation'
  | 'creator_analysis'
  | 'cta_generation'
  | 'repurpose';

export type AiProviderId = 'gemini' | 'openai' | 'azure-openai' | 'ollama' | 'mock';

export interface AiProviderHealth {
  available: boolean;
  provider: AiProviderId;
  model?: string | null;
  baseUrl?: string;
  error?: string;
}

export interface AiStructuredRequest {
  capability: AiCapability;
  prompt: string;
  systemPrompt?: string;
  schemaName?: string;
  creatorProfile?: CreatorBrainContext;
  temperature?: number;
  timeoutMs?: number;
}

export interface AiStructuredResult<T = any> {
  data: T | null;
  provider: AiProviderId;
  model?: string | null;
  degraded: boolean;
  fallbackUsed: boolean;
  latencyMs: number;
  reason?: string;
  error?: string;
  rawResponse?: any;
}

export interface AIProvider {
  id: AiProviderId;
  capabilities: readonly AiCapability[];
  healthCheck(timeoutMs?: number): Promise<AiProviderHealth>;
  generateText(request: AiStructuredRequest): Promise<AiStructuredResult<string>>;
  generateStructured<T = any>(request: AiStructuredRequest): Promise<AiStructuredResult<T>>;
}
