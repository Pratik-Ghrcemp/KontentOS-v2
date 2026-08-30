import { NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/provider';
import { HashtagSuggestionRequest } from '@/lib/ai/types';
import { saveAiEvent } from '@/lib/data/ai-history-service';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

const SYSTEM_PROMPT = `You are a social media SEO and discoverability expert specializing in short-form video platforms.
Your task is to suggest highly relevant, trending hashtags that maximize reach and discoverability.
Rules:
- Mix broad high-volume tags with niche specific ones for best reach.
- Always include the # symbol.
- Avoid banned or shadowbanned hashtags.
- Tailor suggestions to the specific platform's hashtag culture.
- Output ONLY valid JSON, no markdown, no explanation.
JSON schema: { "hashtags": ["#string", "#string", "#string", "#string", "#string"] }`;

export async function POST(request: Request) {
  const userId = await getAuthedUserId(request);
  if (!userId) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body: HashtagSuggestionRequest = await request.json();

    const userPrompt = `Suggest exactly 5 trending, high-reach hashtags for a ${body.platform || 'Instagram Reels'} post.
Topic: "${body.topic || 'content creation and AI tools'}"
Mix: 2 broad (1M+ posts), 2 medium (100K-1M posts), 1 very niche (<100K posts).
The niche tag should be hyper-relevant to the specific topic.`;

    let data: any = null;
    let isMock = true;

    try {
      const result = await generateJson<{ hashtags: string[] }>(userPrompt, SYSTEM_PROMPT);
      data = result.data;
      isMock = result.isMock;
    } catch (aiError: any) {
      console.warn('AI hashtag generation failed, falling back to mock:', aiError?.message);
    }

    if (isMock || !data?.hashtags) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        hashtags: ['#contentcreator', '#aitools', '#creatortips', '#shortformvideo', `#${(body.topic || 'videocreation').replace(/\s+/g, '').toLowerCase()}`]
      });
    }

    await saveAiEvent(
      { task_type: 'hashtag_suggestion', preview: data.hashtags.join(' ') },
      userId,
      body,
      data
    ).catch(() => {});

    return NextResponse.json({ success: true, provider: 'openai', hashtags: data.hashtags });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
