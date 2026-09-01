import { NextResponse } from 'next/server';
import { generateAiHooks } from '@/lib/ai/hook-generator';

/**
 * POST /api/ai/generate-hooks
 * Evaluates transcript and returns validated AI Hook recommendations.
 * Non-destructive: Proposes recommendations without mutating canonical project state.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, projectDuration, options } = body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Transcript is required. Please generate captions first.',
        proposals: [],
        diagnostics: {
          providerAvailable: false,
          fallbackUsed: false,
          totalEvaluated: 0,
          rejectedCount: 0,
          latencyMs: 0
        }
      }, { status: 400 });
    }

    const duration = typeof projectDuration === 'number' && projectDuration > 0
      ? projectDuration
      : Math.max(...transcript.map((t: any) => t.endTime || 0), 10);

    const result = await generateAiHooks(transcript, duration, options);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to generate hook suggestions',
      proposals: [],
      diagnostics: {
        providerAvailable: false,
        fallbackUsed: true,
        totalEvaluated: 0,
        rejectedCount: 0,
        latencyMs: 0
      }
    }, { status: 500 });
  }
}
