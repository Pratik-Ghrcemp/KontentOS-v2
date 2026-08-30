import { CreatorBrainContext } from './creator-dna';

export type AiProvider = 'openai' | 'azure-openai' | 'anthropic' | 'mock';
export type AiTaskType = 'caption_generation' | 'caption_rewrite' | 'hook_suggestion' | 'hashtag_suggestion' | 'cta_suggestion' | 'repurpose' | 'speech_transcription';
export type AiJobStatus = 'idle' | 'loading' | 'success' | 'error';
export type CaptionRewriteTone = 'punchy' | 'pro' | 'emotional' | 'hinglish';

export interface AiRequest {
  provider?: AiProvider;
  assetId?: string;
  context?: string;
  creatorProfile?: CreatorBrainContext;
}

export interface AiResponse {
  success: boolean;
  error?: string;
  provider: AiProvider;
  latencyMs?: number;
}

export interface CaptionGenerationRequest extends AiRequest {
  durationSeconds: number;
  platform?: string;
}
export interface CaptionGenerationResult extends AiResponse {
  segments: { text: string, start_time: number, end_time: number }[];
}

export interface CaptionRewriteRequest extends AiRequest {
  text: string;
  tone: CaptionRewriteTone;
}
export interface CaptionRewriteResult extends AiResponse {
  rewrittenText: string;
}

export interface HookSuggestionRequest extends AiRequest {
  topic: string;
  audience?: string;
  platform?: string;
}
export interface HookSuggestionResult extends AiResponse {
  hooks: string[];
}

export interface HashtagSuggestionRequest extends AiRequest {
  topic: string;
  platform: string;
}
export interface HashtagSuggestionResult extends AiResponse {
  hashtags: string[];
}

export interface CtaSuggestionRequest extends AiRequest {
  goal: string;
  platform?: string;
  contentType?: string;
}
export interface CtaSuggestionResult extends AiResponse {
  ctas: string[];
}

export interface ContentRepurposeRequest extends AiRequest {
  sourceText: string;
}
export interface ContentRepurposeResult extends AiResponse {
  ideas: { platform: string; text: string }[];
}

export interface AiGenerationEvent {
  id: string;
  task_type: AiTaskType;
  created_at: string;
  preview: string;
}
