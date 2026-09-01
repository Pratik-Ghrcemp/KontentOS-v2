import { NextResponse } from 'next/server';
import { generateStoryboard } from '@/lib/ai/storyboard-engine';
import { ScriptInputRequest } from '@/lib/ai/storyboard-types';

export async function POST(request: Request) {
  try {
    const body: ScriptInputRequest = await request.json();

    if (!body || (!body.rawText?.trim() && !body.topic?.trim())) {
      return NextResponse.json(
        { error: 'Either script text (rawText) or a topic is required.' },
        { status: 400 }
      );
    }

    const plan = await generateStoryboard(body);

    return NextResponse.json({
      success: true,
      plan,
      provider: plan.provider
    });
  } catch (err: any) {
    console.error('[API /api/ai/generate-storyboard Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate storyboard' },
      { status: 500 }
    );
  }
}
