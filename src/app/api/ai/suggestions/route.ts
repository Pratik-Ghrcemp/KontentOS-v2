import { NextResponse } from 'next/server';
import { generateAiSuggestions } from '@/lib/ai/suggestions-engine';
import { EditState } from '@/lib/editing/types';
import { AiTranscriptSegment } from '@/lib/ai/proposal-types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcript = body?.transcript as AiTranscriptSegment[] | undefined;
    const editState = body?.editState as EditState | undefined;

    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json({ success: false, error: 'Transcript segments are required.' }, { status: 400 });
    }

    if (!editState || !Array.isArray(editState.items) || !Array.isArray(editState.tracks)) {
      return NextResponse.json({ success: false, error: 'A valid editState is required.' }, { status: 400 });
    }

    const result = await generateAiSuggestions(transcript, editState, {
      maxSuggestions: Number(body?.maxSuggestions || 6),
      preferredProvider: body?.preferredProvider
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'AI suggestion generation failed.' },
      { status: 500 }
    );
  }
}
