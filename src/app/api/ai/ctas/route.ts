import { NextResponse } from 'next/server';
import { generateStructured } from '@/lib/ai/gateway';
import { CtaSuggestionRequest } from '@/lib/ai/types';
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
Make each CTA feel distinct - vary the action type (save, share, follow, comment, etc.).`;

    const result = await generateStructured<{ ctas: string[] }>({
      capability: 'cta_generation',
      schemaName: 'cta_suggestions',
      prompt: userPrompt,
      systemPrompt: SYSTEM_PROMPT,
      creatorProfile: body.creatorProfile,
      userId,
      persistEvent: true,
      responsePreview: (data) => data?.ctas?.[0] || 'CTA suggestions'
    });

    if (!result.data?.ctas) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        degraded: true,
        fallbackUsed: true,
        reason: result.reason || result.error || 'No AI provider configured',
        latencyMs: result.latencyMs,
        ctas: [
          'Save this so you never forget it.',
          'Tag someone who really needs this.',
          'Follow for more tips like this every week.'
        ]
      });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      degraded: result.degraded,
      fallbackUsed: result.fallbackUsed,
      latencyMs: result.latencyMs,
      ctas: result.data.ctas
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
