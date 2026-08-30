import { NextResponse } from 'next/server';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { generateJson } from '@/lib/ai/provider';
import { CaptionRewriteRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: CaptionRewriteRequest = await request.json();
    
    const { data, isMock } = await generateJson(
      `Rewrite this caption in a ${body.tone} tone. Keep it roughly the same length. Original: "${body.text}"`,
      'You are a social media copywriter. Output JSON strictly matching this schema: { "rewrittenText": "..." }'
    );

    if (isMock || !data) {
      const rewrites: Record<string, string> = {
        punchy: "Wait, WHAT?! 🤯",
        pro: "Here is a professional insight regarding this topic.",
        emotional: "I can't believe this actually happened to me...",
        hinglish: "Bhai kya hi trick hai yeh! 🔥 Try zaroor karna."
      };
      const text = rewrites[body.tone] || "Updated mock text.";
      await saveAiEvent(
        { task_type: 'caption_rewrite', preview: text.slice(0, 30) },
        userId,
        body,
        { rewrittenText: text }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        provider: 'mock',
        rewrittenText: text
      });
    }

    const rewritten = (data as { rewrittenText: any }).rewrittenText;
    await saveAiEvent(
      { task_type: 'caption_rewrite', preview: String(rewritten).slice(0, 30) },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', rewrittenText: rewritten });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
