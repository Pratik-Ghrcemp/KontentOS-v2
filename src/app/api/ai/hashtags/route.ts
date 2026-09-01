import { NextResponse } from 'next/server';
import { generateStructured } from '@/lib/ai/gateway';
import { HashtagSuggestionRequest } from '@/lib/ai/types';
import { getAuthedUserId, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { buildCreatorSystemPrompt } from '@/lib/ai/creator-dna';

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

    const result = await generateStructured<{ hashtags: string[] }>({
      capability: 'metadata_generation',
      schemaName: 'hashtag_suggestions',
      prompt: userPrompt,
      systemPrompt: buildCreatorSystemPrompt(SYSTEM_PROMPT, body.creatorProfile),
      creatorProfile: body.creatorProfile,
      userId,
      persistEvent: true,
      responsePreview: (data) => data?.hashtags?.join(' ') || 'Hashtag suggestions'
    });

    if (!result.data?.hashtags) {
      return NextResponse.json({
        success: true,
        provider: 'mock',
        degraded: true,
        fallbackUsed: true,
        reason: result.reason || result.error || 'No AI provider configured',
        latencyMs: result.latencyMs,
        hashtags: ['#contentcreator', '#aitools', '#creatortips', '#shortformvideo', `#${(body.topic || 'videocreation').replace(/\s+/g, '').toLowerCase()}`]
      });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      degraded: result.degraded,
      fallbackUsed: result.fallbackUsed,
      latencyMs: result.latencyMs,
      hashtags: result.data.hashtags
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
