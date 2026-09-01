import { NextResponse } from 'next/server';
import { getOllamaStatus } from '@/lib/ai/ollama-client';

/**
 * GET /api/ai/ollama/status
 * Diagnostic status endpoint for local Ollama daemon.
 * Always returns HTTP 200 with structured availability metrics.
 */
export async function GET() {
  try {
    const status = await getOllamaStatus(2500);

    return NextResponse.json({
      success: status.available,
      provider: 'ollama',
      available: status.available,
      baseUrl: status.baseUrl,
      models: status.models,
      selectedModel: status.selectedModel ?? null,
      error: status.error ?? null
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      provider: 'ollama',
      available: false,
      models: [],
      selectedModel: null,
      error: err.message || 'Unexpected error checking Ollama status'
    }, { status: 200 });
  }
}
