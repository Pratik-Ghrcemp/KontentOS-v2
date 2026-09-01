import { AiProposal, AiTranscriptSegment } from './proposal-types';
import { generateStructured } from './gateway';
import { validateAiProposals } from './validation-pipeline';
import { EditState } from '../editing/types';
import { AiProviderId } from './providers/types';

export interface GenerateSuggestionsOptions {
  maxSuggestions?: number;
  preferredProvider?: AiProviderId | 'heuristic';
}

export interface GenerateSuggestionsResult {
  success: boolean;
  provider: AiProviderId | 'heuristic';
  model?: string | null;
  proposals: AiProposal[];
  diagnostics: {
    providerAvailable: boolean;
    fallbackUsed: boolean;
    totalEvaluated: number;
    rejectedCount: number;
    latencyMs: number;
    error?: string;
  };
}

const EMPHASIS_KEYWORDS = [
  'video editor', 'saves', 'hours', 'automated', 'secret', 'important',
  'transform', 'best', 'power', 'fast', 'easy', 'welcome', 'never'
];

/**
 * Deterministic Heuristic Suggestions Generator (100% Offline)
 */
export function generateHeuristicSuggestions(
  transcript: AiTranscriptSegment[],
  editState: EditState,
  options: GenerateSuggestionsOptions = {}
): AiProposal[] {
  const maxSuggestions = options.maxSuggestions || 6;
  const projectDuration = editState.duration > 0 ? editState.duration : 10;
  const rawProposals: any[] = [];

  if (!transcript || transcript.length === 0) {
    return [];
  }

  const videoTrack = editState.tracks.find(t => t.type === 'video') || editState.tracks[0];
  const textTrack = editState.tracks.find(t => t.type === 'text') || { id: 'track-text-1' };

  // 1. Kinetic Punch Zoom Proposal: Emphasize core value proposition moments
  transcript.forEach((seg, idx) => {
    const textLower = seg.text.toLowerCase();
    const matchedKeyword = EMPHASIS_KEYWORDS.find(kw => textLower.includes(kw));

    if (matchedKeyword) {
      rawProposals.push({
        id: `sug-zoom-${idx + 1}`,
        kind: 'zoom',
        title: `Kinetic Punch Zoom (${matchedKeyword.toUpperCase()})`,
        startTime: seg.startTime,
        endTime: Math.min(projectDuration, seg.endTime),
        confidence: 90,
        reasoning: `Punch in 1.15x scale to visually emphasize the key spoken term "${matchedKeyword}".`,
        sourceEvidence: seg.text.trim(),
        targetTrackId: videoTrack?.id,
        source: 'heuristic',
        data: {
          scale: 1.15,
          text: `Zoom on "${matchedKeyword}"`
        }
      });
    }
  });

  // 2. Headline Overlay Proposal: Inject dynamic lower-third / center callout badge
  transcript.forEach((seg, idx) => {
    const textLower = seg.text.toLowerCase();
    if (textLower.includes('saves hours of work') || textLower.includes('automated video editor') || textLower.includes('welcome to studio hub')) {
      const cleanHeadline = seg.text
        .replace(/[^\w\s]/gi, '')
        .toUpperCase()
        .slice(0, 30);

      rawProposals.push({
        id: `sug-headline-${idx + 1}`,
        kind: 'headline',
        title: `Headline Overlay: "${cleanHeadline}"`,
        startTime: seg.startTime,
        endTime: Math.min(projectDuration, seg.startTime + 2.5),
        confidence: 92,
        reasoning: 'Spoken highlight represents a major value proposition. Reinforce visually with high-contrast text overlay.',
        sourceEvidence: seg.text.trim(),
        targetTrackId: textTrack.id,
        source: 'heuristic',
        data: {
          text: cleanHeadline,
          suggestedHeadline: cleanHeadline,
          stylePreset: 'boxed',
          color: '#fbbf24'
        }
      });
    }
  });

  // 3. Pacing Compaction / Dead-Air Cut Proposal: Remove long pause intervals
  for (let i = 0; i < transcript.length - 1; i++) {
    const current = transcript[i];
    const next = transcript[i + 1];
    const gap = next.startTime - current.endTime;

    if (gap >= 0.7) {
      rawProposals.push({
        id: `sug-cut-gap-${i + 1}`,
        kind: 'cut',
        title: `Trim ${gap.toFixed(1)}s Speech Gap`,
        startTime: current.endTime + 0.05,
        endTime: next.startTime - 0.05,
        confidence: 88,
        reasoning: `Detected a ${gap.toFixed(1)}s silence gap between phrases. Removing it tightens pacing and boosts viewer retention.`,
        sourceEvidence: `Pause between "${current.text.slice(-15)}" and "${next.text.slice(0, 15)}"`,
        source: 'heuristic',
        data: { ripple: true }
      });
    }
  }

  // Deduplicate and balance top candidates across categories
  const zooms = rawProposals.filter(p => p.kind === 'zoom').slice(0, 2);
  const headlines = rawProposals.filter(p => p.kind === 'headline').slice(0, 2);
  const cuts = rawProposals.filter(p => p.kind === 'cut').slice(0, 2);
  const balanced = [...zooms, ...headlines, ...cuts];

  const report = validateAiProposals(balanced, {
    projectDuration,
    availableTrackIds: editState.tracks.map(t => t.id)
  });

  return report.validatedProposals.slice(0, maxSuggestions);
}

/**
 * Master Suggestions Generator: routes through the unified gateway first
 * (Gemini -> OpenAI/Azure -> Ollama -> mock), then uses deterministic
 * heuristic proposals if the live chain is unavailable or invalid.
 */
export async function generateAiSuggestions(
  transcript: AiTranscriptSegment[],
  editState: EditState,
  options: GenerateSuggestionsOptions = {}
): Promise<GenerateSuggestionsResult> {
  const startTime = Date.now();
  let providerUsed: AiProviderId | 'heuristic' = options.preferredProvider === 'heuristic' ? 'heuristic' : (options.preferredProvider || 'gemini');
  let model: string | null | undefined;
  let fallbackUsed = false;
  let rawProposals: any[] = [];
  let providerError: string | undefined;

  const projectDuration = editState.duration > 0 ? editState.duration : 10;

  if (!transcript || transcript.length === 0) {
    return {
      success: false,
      provider: 'heuristic',
      model: null,
      proposals: [],
      diagnostics: {
        providerAvailable: false,
        fallbackUsed: false,
        totalEvaluated: 0,
        rejectedCount: 0,
        latencyMs: 0,
        error: 'No transcript segments found. Generate captions first.'
      }
    };
  }

  if (providerUsed !== 'heuristic') {
    const summary = transcript.slice(0, 30).map(t =>
      `[${t.startTime.toFixed(2)}s - ${t.endTime.toFixed(2)}s]: "${t.text}"`
    ).join('\n');

    const prompt = `Analyze this video transcript (duration: ${projectDuration.toFixed(2)}s) and suggest editing enhancements.
Transcript:
${summary}

Generate a JSON object with a "proposals" array containing 3 to 5 recommendations.
Use only these edit kinds: zoom, headline, cut, pacing, hook.
Every proposal must be safe for a non-destructive ghost preview and must include sourceEvidence from the transcript when possible.
{
  "proposals": [
    {
      "id": "sug-1",
      "kind": "zoom" | "cut" | "headline" | "pacing",
      "title": "Short descriptive title",
      "startTime": number,
      "endTime": number,
      "confidence": number (60-100),
      "reasoning": "Clear plain language rationale",
      "sourceEvidence": "Quote from transcript",
      "source": "${providerUsed}"
    }
  ]
}`;

    const gatewayRes = await generateStructured<{ proposals: any[] }>({
      capability: 'hook_analysis',
      schemaName: 'studio_hub_editing_suggestions',
      prompt,
      systemPrompt: 'You are an expert short-form video editor. Return valid JSON only. Never claim an edit is applied; only propose ghost-preview-safe changes.',
      preferredProvider: options.preferredProvider === 'heuristic' ? undefined : options.preferredProvider,
      temperature: 0.2,
      timeoutMs: 12000
    });

    providerUsed = gatewayRes.provider;
    model = gatewayRes.model;
    fallbackUsed = gatewayRes.fallbackUsed || gatewayRes.degraded || gatewayRes.provider === 'mock';
    providerError = gatewayRes.error || gatewayRes.reason;

    if (gatewayRes.data?.proposals && Array.isArray(gatewayRes.data.proposals) && gatewayRes.data.proposals.length > 0 && gatewayRes.provider !== 'mock') {
      rawProposals = gatewayRes.data.proposals.map((proposal, index) => ({
        ...proposal,
        id: proposal.id || `sug-${gatewayRes.provider}-${index + 1}`,
        source: gatewayRes.provider
      }));
    }
  }

  if (fallbackUsed || providerUsed === 'heuristic' || rawProposals.length === 0) {
    rawProposals = generateHeuristicSuggestions(transcript, editState, options);
    providerUsed = 'heuristic';
  }

  const validationReport = validateAiProposals(rawProposals, {
    projectDuration,
    availableTrackIds: editState.tracks.map(t => t.id)
  });

  const latencyMs = Date.now() - startTime;

  return {
    success: validationReport.validatedProposals.length > 0,
    provider: providerUsed,
    model,
    proposals: validationReport.validatedProposals.slice(0, options.maxSuggestions || 6),
    diagnostics: {
      providerAvailable: providerUsed !== 'heuristic',
      fallbackUsed,
      totalEvaluated: transcript.length,
      rejectedCount: validationReport.rejectedProposals.length,
      latencyMs,
      error: providerError
    }
  };
}
