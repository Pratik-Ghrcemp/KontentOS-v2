import { NextResponse } from 'next/server';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { transcribeAudioBuffer } from '@/lib/ai/provider';
import { saveAiEvent } from '@/lib/data/ai-history-service';

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const language = (formData.get('language') as string) || undefined;
    const prompt = (formData.get('prompt') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'Missing audio/video file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as any).name || 'input-audio.mp4';

    const { segments, text, isMock } = await transcribeAudioBuffer(buffer, filename, language, prompt);

    if (isMock || segments.length === 0) {
      // Deterministic fallback timed segments if Whisper API key is unset
      const fallbackSegments = [
        { text: 'Are you still doing this manually?', start_time: 0, end_time: 2.5 },
        { text: 'There is a smarter way to do it.', start_time: 2.6, end_time: 4.5 },
        { text: 'Let AI handle the heavy lifting.', start_time: 4.6, end_time: 6.5 },
        { text: 'Save hours every single week.', start_time: 6.6, end_time: 9.0 }
      ];

      await saveAiEvent(
        { task_type: 'speech_transcription', preview: '4 fallback transcript segments' },
        userId,
        { filename, language },
        { segments: fallbackSegments, isFallback: true }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        provider: 'mock',
        text: 'Are you still doing this manually? There is a smarter way to do it...',
        segments: fallbackSegments
      });
    }

    await saveAiEvent(
      { task_type: 'speech_transcription', preview: `${segments.length} transcribed segments` },
      userId,
      { filename, language },
      { text: text.slice(0, 100), segmentCount: segments.length }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      provider: 'openai',
      text,
      segments
    });
  } catch (err: any) {
    console.error('Transcription API Error:', err);
    return NextResponse.json({ error: err?.message || 'Transcription failed' }, { status: 500 });
  }
}
