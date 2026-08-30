import { NextResponse } from 'next/server';

export async function GET() {
  const isMock = process.env.AI_PROVIDER === 'mock';
  const hasAzureKey = !!process.env.AZURE_OPENAI_API_KEY;
  const hasAzureEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  const azureConfigured = hasAzureKey && hasAzureEndpoint;
  const openaiConfigured = hasOpenAIKey;

  let resolvedProvider = 'mock';
  if (!isMock) {
    if (azureConfigured) resolvedProvider = 'azure';
    else if (openaiConfigured) resolvedProvider = 'openai';
  }

  const missingFields = [];
  if (!isMock && !azureConfigured && !openaiConfigured) {
    missingFields.push('OPENAI_API_KEY or AZURE_OPENAI_API_KEY');
  }

  return NextResponse.json({
    configured_provider: process.env.AI_PROVIDER || 'openai',
    resolved_provider: resolvedProvider,
    mock_fallback: resolvedProvider === 'mock',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    azure_configured: azureConfigured,
    openai_configured: openaiConfigured,
    missing_fields: missingFields
  });
}
