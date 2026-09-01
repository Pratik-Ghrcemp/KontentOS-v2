import { NextResponse } from 'next/server';
import { getAiGatewayStatus } from '@/lib/ai/gateway';

export async function GET() {
  const gateway = await getAiGatewayStatus();

  return NextResponse.json({
    configured_provider: process.env.AI_PROVIDER || 'auto',
    resolved_provider: gateway.providers.find(p => p.available && p.provider !== 'mock')?.provider || 'mock',
    mock_fallback: !gateway.providers.some(p => p.available && p.provider !== 'mock'),
    model: gateway.providers.find(p => p.available && p.model)?.model || 'gemini-1.5-flash',
    gateway
  });
}

import { getAuthedContext, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

export async function POST(req: Request) {
  const auth = await getAuthedContext(req);
  if (!auth) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKey, provider = 'gemini' } = body || {};

    if (apiKey && typeof apiKey === 'string') {
      const cleanKey = apiKey.trim();
      if (provider === 'gemini') {
        process.env.GEMINI_API_KEY = cleanKey;
        process.env.GOOGLE_GEMINI_API_KEY = cleanKey;
      } else if (provider === 'openai') {
        process.env.OPENAI_API_KEY = cleanKey;
      }
    }

    const gateway = await getAiGatewayStatus();
    const resolved = gateway.providers.find(p => p.available && p.provider !== 'mock')?.provider || 'mock';

    return NextResponse.json({
      success: true,
      configured_provider: provider,
      resolved_provider: resolved,
      mock_fallback: resolved === 'mock',
      gateway
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update API key' }, { status: 400 });
  }
}
