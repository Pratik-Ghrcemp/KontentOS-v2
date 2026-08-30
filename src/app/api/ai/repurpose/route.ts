import { NextResponse } from 'next/server';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { generateJson } from '@/lib/ai/provider';
import { ContentRepurposeRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: ContentRepurposeRequest = await request.json();
    
    const { data, isMock } = await generateJson(
      `Repurpose this topic into 3 short content ideas for Twitter, LinkedIn, and YouTube Shorts. Topic: ${body.sourceText || 'AI productivity'}`,
      'You are a content strategist. Output JSON strictly matching this schema: { "ideas": [{ "platform": "...", "text": "..." }] }'
    );

    if (isMock || !data) {
      const mockIdeas = [
        { platform: 'Twitter/X', text: `I just discovered a crazy trick for ${body.sourceText || 'this'}. A thread 🧵👇` },
        { platform: 'LinkedIn', text: 'Productivity is evolving. Here is how I transformed my workflow, and what you can learn from it.' },
        { platform: 'YouTube Shorts', text: 'Title Idea: DO THIS to save 10 hours a week! #shorts' }
      ];
      await saveAiEvent(
        { task_type: 'repurpose', preview: mockIdeas[0].text.slice(0, 30) },
        userId,
        body,
        { ideas: mockIdeas }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        provider: 'mock',
        ideas: mockIdeas
      });
    }

    const ideas = (data as { ideas: any }).ideas;
    await saveAiEvent(
      { task_type: 'repurpose', preview: Array.isArray(ideas) && ideas[0]?.text ? String(ideas[0].text).slice(0, 30) : 'Repurposed ideas' },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', ideas });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
