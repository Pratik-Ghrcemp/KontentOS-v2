import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/provider';
import { CtaSuggestionRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

const SYSTEM_PROMPT = `You are a conversion-focused social media copywriter who specializes in short-form video CTAs.
Your task is to write compelling, action-driving calls-to-action that feel natural and not pushy.
Rules:
- Each CTA must be under 12 words.
- Match the platform's native tone (casual for TikTok, slightly polished for LinkedIn).
- Use action verbs: Save, Follow, Comment, Share, Click, Tag, Watch.
- Create urgency or value without being spammy.
- Output ONLY valid JSON, no markdown, no explanation.
JSON schema: { "ctas": ["string", "string", "string"] }`;

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: CtaSuggestionRequest = await request.json();

    const userPrompt = `Write exactly 3 high-converting video CTAs for:
Goal: "${body.goal || 'increase engagement and followers'}"
Platform: ${body.platform || 'Instagram Reels / TikTok'}
Content Type: ${body.contentType || 'educational how-to video'}
Make each CTA feel distinct — vary the action type (save, share, follow, comment, etc.).`;

    let data: any = null;
    let isMock = true;

    try {
      const result = await generateJson<{ ctas: string[] }>(userPrompt, SYSTEM_PROMPT);
      data = result.data;
      isMock = result.isMock;
    } catch (aiError: any) {
      console.warn('AI CTA generation failed, falling back to mock:', aiError?.message);
    }

    if (isMock || !data?.ctas) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        ctas: [
          'Save this so you never forget it.',
          'Tag someone who really needs this.',
          'Follow for more tips like this every week.'
        ]
      });
    }

    await saveAiEvent(
      { task_type: 'cta_suggestion', preview: data.ctas[0] },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', ctas: data.ctas });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
