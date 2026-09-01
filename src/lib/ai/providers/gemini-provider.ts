import { buildCreatorSystemPrompt } from '../creator-dna';
import { AIProvider, AiProviderHealth, AiStructuredRequest, AiStructuredResult } from './types';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || null;
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export class GeminiProvider implements AIProvider {
  id = 'gemini' as const;
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
    const key = getGeminiKey();
    if (!key) {
      return { available: false, provider: this.id, model: GEMINI_MODEL, error: 'GEMINI_API_KEY is not configured' };
    }
    return { available: true, provider: this.id, model: GEMINI_MODEL };
  }

  async generateText(request: AiStructuredRequest): Promise<AiStructuredResult<string>> {
    const result = await this.generateStructured<{ text: string }>(request);
    return { ...result, data: result.data?.text || null };
  }

  async generateStructured<T = any>(request: AiStructuredRequest): Promise<AiStructuredResult<T>> {
    const start = Date.now();
    const key = getGeminiKey();
    if (!key) {
      return {
        data: null,
        provider: this.id,
        model: GEMINI_MODEL,
        degraded: true,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        error: 'Gemini is not configured'
      };
    }

    try {
      const systemPrompt = buildCreatorSystemPrompt(
        request.systemPrompt || 'You are a helpful AI assistant. Output valid JSON only.',
        request.creatorProfile
      );
      const response = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: timeoutSignal(request.timeoutMs || 15000),
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${request.prompt}` }] }],
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error('Empty Gemini response');

      return {
        data: JSON.parse(content) as T,
        provider: this.id,
        model: GEMINI_MODEL,
        degraded: false,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        rawResponse: json
      };
    } catch (error: any) {
      return {
        data: null,
        provider: this.id,
        model: GEMINI_MODEL,
        degraded: true,
        fallbackUsed: false,
        latencyMs: Date.now() - start,
        error: error?.name === 'AbortError' ? `Gemini timed out after ${request.timeoutMs || 15000}ms` : (error?.message || 'Gemini generation failed')
      };
    }
  }
}
