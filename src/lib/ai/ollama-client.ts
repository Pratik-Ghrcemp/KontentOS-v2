import { OllamaStatus } from './proposal-types';

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_TIMEOUT_MS = 5000;

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL;
}

export function getOllamaDefaultModel(): string | null {
  return process.env.OLLAMA_MODEL || null;
}

/**
 * Checks local Ollama server health and queries installed models.
 * Never throws an unhandled error — returns a clean status object.
 */
export async function getOllamaStatus(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<OllamaStatus> {
  const baseUrl = getOllamaBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        available: false,
        provider: 'ollama',
        baseUrl,
        models: [],
        selectedModel: null,
        error: `Ollama returned HTTP ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();
    const models: string[] = Array.isArray(data.models)
      ? data.models.map((m: any) => m.name || m.model || String(m))
      : [];

    const configuredModel = getOllamaDefaultModel();
    const selectedModel = (configuredModel && models.includes(configuredModel))
      ? configuredModel
      : (models.length > 0 ? models[0] : null);

    return {
      available: true,
      provider: 'ollama',
      baseUrl,
      models,
      selectedModel
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');

    return {
      available: false,
      provider: 'ollama',
      baseUrl,
      models: [],
      selectedModel: null,
      error: isAbort
        ? `Ollama connection timed out after ${timeoutMs}ms`
        : isConnRefused
          ? `Ollama daemon is not running on ${baseUrl}`
          : (err.message || 'Unknown Ollama connection error')
    };
  }
}

/**
 * Discovers list of available models on the local Ollama instance.
 */
export async function discoverOllamaModels(): Promise<string[]> {
  const status = await getOllamaStatus();
  return status.models;
}

export interface OllamaGenerateOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Generates a structured JSON response from local Ollama with timeout and abort support.
 */
export async function generateOllamaStructured<T = any>(
  prompt: string,
  options: OllamaGenerateOptions = {}
): Promise<{ success: boolean; data?: T; rawText?: string; error?: string; latencyMs: number }> {
  const startTime = Date.now();
  const baseUrl = getOllamaBaseUrl();
  const status = await getOllamaStatus(2000);

  if (!status.available) {
    return {
      success: false,
      error: status.error || 'Ollama is offline or unreachable',
      latencyMs: Date.now() - startTime
    };
  }

  const modelToUse = options.model || status.selectedModel;
  if (!modelToUse) {
    return {
      success: false,
      error: 'No Ollama model available or installed. Run `ollama pull llama3.2:3b` first.',
      latencyMs: Date.now() - startTime
    };
  }

  const timeoutMs = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external abort signal if provided
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        prompt,
        system: options.systemPrompt || 'You are an expert video editor. You must respond in valid, parseable JSON strictly adhering to the requested schema.',
        format: 'json',
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Ollama generation failed with HTTP ${response.status}: ${response.statusText}`,
        latencyMs: Date.now() - startTime
      };
    }

    const resJson = await response.json();
    const rawResponse = resJson.response || '';

    try {
      const parsedData = JSON.parse(rawResponse) as T;
      return {
        success: true,
        data: parsedData,
        rawText: rawResponse,
        latencyMs: Date.now() - startTime
      };
    } catch (parseErr: any) {
      return {
        success: false,
        rawText: rawResponse,
        error: `Failed to parse structured JSON from Ollama response: ${parseErr.message}`,
        latencyMs: Date.now() - startTime
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    return {
      success: false,
      error: isAbort ? `Ollama generation timed out after ${timeoutMs}ms` : (err.message || 'Ollama generation failed'),
      latencyMs: Date.now() - startTime
    };
  }
}
