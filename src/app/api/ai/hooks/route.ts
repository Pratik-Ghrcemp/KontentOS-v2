import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/provider';
import { HookSuggestionRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

const SYSTEM_PROMPT = `You are a viral short-form content strategist with a proven track record on TikTok, Instagram Reels, and YouTube Shorts.
Your task is to create irresistible video opening hooks that stop the scroll in the first 3 seconds.
Rules:
- Each hook must be under 12 words.
- Use proven patterns: curiosity gap, bold claim, direct address, shocking stat, or storytelling opener.
- Avoid clickbait that feels dishonest — keep hooks authentic and platform-native.
- Output ONLY valid JSON, no markdown, no explanation.
JSON schema: { "hooks": ["string", "string", "string"] }`;

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: HookSuggestionRequest = await request.json();

    const userPrompt = `Generate exactly 3 viral video opening hooks for the following:
Topic: "${body.topic || 'productivity and AI tools'}"
Target Audience: ${body.audience || 'content creators and entrepreneurs'}
Platform: ${body.platform || 'TikTok / Instagram Reels'}
Style: Short, punchy, scroll-stopping. Do not use hashtags in the hooks.`;

    let data: any = null;
    let isMock = true;

    try {
      const result = await generateJson<{ hooks: string[] }>(userPrompt, SYSTEM_PROMPT);
      data = result.data;
      isMock = result.isMock;
    } catch (aiError: any) {
      console.warn('AI hook generation failed, falling back to mock:', aiError?.message);
    }

    if (isMock || !data?.hooks) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        hooks: [
          'Nobody talks about this productivity hack.',
          'I saved 10 hours a week doing this one thing.',
          `This is the only ${body.topic || 'tool'} you actually need.`
        ]
      });
    }

    await saveAiEvent(
      { task_type: 'hook_suggestion', preview: data.hooks[0] },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', hooks: data.hooks });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
