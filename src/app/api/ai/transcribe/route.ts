import { NextResponse } from 'next/server';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { transcribeAudioBuffer } from '@/lib/ai/provider';
import { getWhisperInstallationStatus } from '@/lib/ai/local-whisper-worker';
import { saveAiEvent } from '@/lib/data/ai-history-service';
import { isDemoMode } from '@/lib/supabase';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Diagnostic status endpoint to check local whisper.cpp installation state.
 */
export async function GET(request: Request) {
  try {
    const status = await getWhisperInstallationStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  // Early rejection before parsing formData or loading memory
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_BYTES) {
    return NextResponse.json({
      success: false,
      error: `Media file exceeds maximum upload limit (${MAX_UPLOAD_BYTES / (1024 * 1024)}MB). Please trim before transcribing.`
    }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const language = (formData.get('language') as string) || undefined;
    const prompt = (formData.get('prompt') as string) || undefined;
    const rawDuration = formData.get('duration') as string | null;
    const durationSeconds = rawDuration ? parseFloat(rawDuration) : undefined;

    if (!file) {
      return NextResponse.json({ error: 'Missing audio/video file' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({
        success: false,
        error: `Media file exceeds maximum upload limit (${MAX_UPLOAD_BYTES / (1024 * 1024)}MB). Please trim before transcribing.`
      }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as any).name || 'input-audio.mp4';

    const result = await transcribeAudioBuffer(
      buffer,
      filename,
      language,
      prompt,
      durationSeconds,
      request.signal
    );

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 502 });
    }

    if (result.isMock || result.segments.length === 0) {
      return NextResponse.json({
        success: false,
        error: result.error || 'No speech segments detected in media file. Please check that the video has an audible voice track.'
      }, { status: 422 });
    }

    await saveAiEvent(
      { task_type: 'speech_transcription', preview: `${result.segments.length} transcribed segments` },
      userId,
      { filename, language },
      { text: result.text.slice(0, 100), segmentCount: result.segments.length }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      provider: result.provider || 'local_whisper_cpp',
      text: result.text,
      segments: result.segments
    });
  } catch (error: any) {
    if (request.signal?.aborted || error.message?.includes('cancelled')) {
      return NextResponse.json({ success: false, error: 'Transcription cancelled' }, { status: 499 });
    }
    console.error('Transcription API Route Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Transcription processing failed'
    }, { status: 500 });
  }
}
