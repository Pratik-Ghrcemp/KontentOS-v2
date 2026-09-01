import { AIProvider, AiProviderHealth, AiStructuredRequest, AiStructuredResult } from './types';

export class MockProvider implements AIProvider {
  id = 'mock' as const;
  capabilities = [
    'idea_generation',
    'script_generation',
    'hook_analysis',
    'storyboard_generation',
    'caption_generation',
    'caption_rewrite',
    'visual_planning',
    'metadata_generation',
    'creator_analysis',
    'cta_generation',
    'repurpose'
  ] as const;

  async healthCheck(): Promise<AiProviderHealth> {
    return { available: true, provider: this.id, model: 'deterministic-mock' };
  }

  async generateText(request: AiStructuredRequest): Promise<AiStructuredResult<string>> {
    const start = Date.now();
    return {
      data: `Mock ${request.capability} response`,
      provider: this.id,
      model: 'deterministic-mock',
      degraded: true,
      fallbackUsed: true,
      latencyMs: Date.now() - start,
      reason: 'No live AI provider configured or available'
    };
  }

  async generateStructured<T = any>(request: AiStructuredRequest): Promise<AiStructuredResult<T>> {
    const start = Date.now();
    let fallbackData: any = null;

    if (request.capability === 'hook_analysis') {
      fallbackData = [
        {
          id: 'mock-hook-1',
          kind: 'hook',
          title: 'High-Retention Question Hook',
          reasoning: 'Opening question triggers cognitive curiosity gap.',
          confidence: 94,
          startTime: 0,
          endTime: 2.5,
          sourceEvidence: 'Are you still doing this the hard way?',
          actionPayload: { headline: 'Stop Wasting 5 Hours Editing Reels' }
        }
      ];
    } else if (request.capability === 'metadata_generation') {
      fallbackData = {
        title: 'The AI Creator Workflow That Changed Everything',
        description: 'How to automate your short-form video editing and platform distribution in seconds.',
        hashtags: ['#CreatorEconomy', '#VideoEditing', '#AI', '#KontentOS', '#Productivity'],
        suggestedPlatform: 'Instagram Reels'
      };
    } else if (request.capability === 'cta_generation') {
      fallbackData = {
        primaryCta: 'Save this reel for your next video workflow',
        secondaryCta: 'Link in bio for full access',
        startTime: 4.5
      };
    } else if (request.capability === 'caption_rewrite' || request.capability === 'caption_generation') {
      fallbackData = {
        style: 'hormozi',
        headline: 'Automate Everything with AI',
        keywords: ['Automate', 'AI', 'Creator']
      };
    } else {
      fallbackData = {
        status: 'mock_fallback',
        capability: request.capability,
        timestamp: new Date().toISOString()
      };
    }

    return {
      data: fallbackData as T,
      provider: this.id,
      model: 'deterministic-mock',
      degraded: true,
      fallbackUsed: true,
      latencyMs: Date.now() - start,
      reason: 'No live AI provider configured or available (deterministic fallback active)'
    };
  }
}
