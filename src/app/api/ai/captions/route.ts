import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/provider';
import { CaptionGenerationRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

const SYSTEM_PROMPT = `You are an expert video editor and social media content creator specializing in short-form viral content.
Your task is to generate accurate, engaging, and timestamped captions for a video.
Rules:
- Keep each segment under 10 words for readability.
- Ensure natural breaks at pauses/sentences.
- Write in an engaging, direct conversational tone.
- Timestamps must be sequential and not overlap.
- Output ONLY valid JSON, no markdown, no explanation.
JSON schema: { "segments": [{ "text": "string", "start_time": number, "end_time": number }] }`;

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: CaptionGenerationRequest = await request.json();

    const userPrompt = `Generate 3 to 5 captioned segments for a ${body.durationSeconds || 30}s short-form video.
Topic/Context: "${body.context || 'general motivational content'}"
Platform: ${body.platform || 'TikTok/Instagram Reels'}
Tone: engaging, direct, punchy.
Total duration must match the video length.`;

    let data: any = null;
    let isMock = true;

    try {
      const result = await generateJson<{ segments: any[] }>(userPrompt, SYSTEM_PROMPT);
      data = result.data;
      isMock = result.isMock;
    } catch (aiError: any) {
      // Rate limit (429) or Auth error (401) — fall through to mock
      console.warn('AI caption generation failed, falling back to mock:', aiError?.message);
    }

    if (isMock || !data?.segments) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        segments: [
          { text: 'Are you still doing this manually?', start_time: 0, end_time: 2.5 },
          { text: 'There is a smarter way to do it.', start_time: 2.6, end_time: 4.5 },
          { text: 'Let AI handle the heavy lifting.', start_time: 4.6, end_time: 6.5 },
          { text: 'Save hours every single week.', start_time: 6.6, end_time: 9.0 },
        ]
      });
    }

    await saveAiEvent(
      { task_type: 'caption_generation', preview: `${data.segments.length} segments generated` },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', segments: data.segments });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
