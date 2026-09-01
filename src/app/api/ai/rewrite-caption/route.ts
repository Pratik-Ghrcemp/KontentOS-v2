import { NextResponse } from 'next/server';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { generateStructured } from '@/lib/ai/gateway';
import { CaptionRewriteRequest } from '@/lib/ai/types';

const SYSTEM_PROMPT = 'You are a social media copywriter. Output JSON strictly matching this schema: { "rewrittenText": "..." }';

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: CaptionRewriteRequest = await request.json();
    const result = await generateStructured<{ rewrittenText: string }>({
      capability: 'caption_rewrite',
      schemaName: 'caption_rewrite',
      prompt: `Rewrite this caption in a ${body.tone} tone. Keep it roughly the same length. Original: "${body.text}"`,
      systemPrompt: SYSTEM_PROMPT,
      creatorProfile: body.creatorProfile,
      userId,
      persistEvent: true,
      responsePreview: (data) => String(data?.rewrittenText || '').slice(0, 30)
    });

    const rewrittenText = result.data?.rewrittenText || (
      {
        punchy: 'Wait, WHAT?!',
        pro: 'Here is a professional insight regarding this topic.',
        emotional: "I can't believe this actually happened to me...",
        hinglish: 'Bhai kya hi trick hai yeh! Try zaroor karna.'
      }[body.tone] || 'Updated mock text.'
    );

    return NextResponse.json({
      success: true,
      provider: result.provider,
      degraded: true,
      fallbackUsed: !result.data?.rewrittenText || result.degraded,
      latencyMs: result.latencyMs,
      rewrittenText
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
