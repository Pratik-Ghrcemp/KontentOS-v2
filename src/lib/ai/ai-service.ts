import {
  CaptionGenerationRequest, CaptionGenerationResult,
  CaptionRewriteRequest, CaptionRewriteResult,
  HookSuggestionRequest, HookSuggestionResult,
  HashtagSuggestionRequest, HashtagSuggestionResult,
  CtaSuggestionRequest, CtaSuggestionResult,
  ContentRepurposeRequest, ContentRepurposeResult
} from './types';
import { supabase } from '@/lib/supabase';

// The API routes now handle the mock vs real logic based on API keys.
// So the frontend service just makes the fetch call with the session token.
async function authedFetch(path: string, body: unknown): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
}

export async function generateCaptions(request: CaptionGenerationRequest): Promise<CaptionGenerationResult> {
  const res = await authedFetch('/api/ai/captions', request);
  return res.json();
}

export async function rewriteCaption(request: CaptionRewriteRequest): Promise<CaptionRewriteResult> {
  const res = await authedFetch('/api/ai/rewrite-caption', request);
  return res.json();
}

export async function suggestHooks(request: HookSuggestionRequest): Promise<HookSuggestionResult> {
  const res = await authedFetch('/api/ai/hooks', request);
  return res.json();
}

export async function suggestHashtags(request: HashtagSuggestionRequest): Promise<HashtagSuggestionResult> {
  const res = await authedFetch('/api/ai/hashtags', request);
  return res.json();
}

export async function suggestCtas(request: CtaSuggestionRequest): Promise<CtaSuggestionResult> {
  const res = await authedFetch('/api/ai/ctas', request);
  return res.json();
}

export async function repurposeContent(request: ContentRepurposeRequest): Promise<ContentRepurposeResult> {
  const res = await authedFetch('/api/ai/repurpose', request);
  return res.json();
}

export async function transcribeMedia(file: Blob, language?: string, prompt?: string): Promise<{ success: boolean; provider: string; text: string; segments: { text: string; start_time: number; end_time: number }[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  const formData = new FormData();
  formData.append('file', file);
  if (language) formData.append('language', language);
  if (prompt) formData.append('prompt', prompt);

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers,
    body: formData
  });

  return res.json();
}
