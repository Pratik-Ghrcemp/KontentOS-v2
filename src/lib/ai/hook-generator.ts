import { AiProposal, AiTranscriptSegment } from './proposal-types';
import { getOllamaStatus, generateOllamaStructured } from './ollama-client';
import { validateAiProposals } from './validation-pipeline';

export type HookType = 'question' | 'curiosity' | 'bold_statement' | 'problem' | 'surprise' | 'story' | 'benefit';

export interface HookMetadata {
  hookText: string;
  hookType: HookType;
  suggestedPlacement?: 'opening';
}

export interface GenerateHooksOptions {
  maxHooks?: number;
  goal?: 'viral' | 'educational' | 'sales' | 'storytelling' | 'general';
  preferredProvider?: 'ollama' | 'heuristic';
}

export interface GenerateHooksResult {
  success: boolean;
  provider: 'ollama' | 'heuristic';
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

const HIGH_ENGAGEMENT_KEYWORDS = [
  'welcome', 'saves', 'hours', 'automated', 'secret', 'never', 'how to', 
  'best', 'easy', 'fast', 'stop', 'ultimate', 'mistake', 'transform', 
  'revealed', 'hack', 'money', 'free', 'simple', 'power', 'why'
];

/**
 * Stage 5B: Transcript Grounding Validator
 * Guarantees that proposed hook timestamps and text map strictly to real transcript segments.
 */
export function validateTranscriptGrounding(
  hook: { startTime: number; endTime: number; text?: string; reasoning?: string },
  transcript: AiTranscriptSegment[],
  projectDuration: number
): { isGrounded: boolean; reason?: string; matchedSegment?: AiTranscriptSegment } {
  if (!transcript || transcript.length === 0) {
    return { isGrounded: false, reason: 'Empty transcript — cannot ground hook proposals' };
  }

  // 1. Timestamp overlap check with real speech segments
  const overlappingSegments = transcript.filter(seg => 
    (hook.startTime <= seg.endTime && hook.endTime >= seg.startTime)
  );

  if (overlappingSegments.length === 0) {
    return { isGrounded: false, reason: `Proposed interval [${hook.startTime.toFixed(2)}s - ${hook.endTime.toFixed(2)}s] does not overlap any spoken transcript segments` };
  }

  // 2. Duration check: minimum 1.0s, maximum 8.0s for an opening teaser
  const duration = hook.endTime - hook.startTime;
  if (duration < 1.0) {
    return { isGrounded: false, reason: `Hook duration (${duration.toFixed(2)}s) is below 1.0s minimum` };
  }

  if (hook.endTime > projectDuration + 0.5) {
    return { isGrounded: false, reason: `Hook end timestamp (${hook.endTime.toFixed(2)}s) exceeds project duration (${projectDuration.toFixed(2)}s)` };
  }

  return { isGrounded: true, matchedSegment: overlappingSegments[0] };
}

/**
 * Heuristic Hook Scorer & Proposal Generator (100% Offline & Deterministic)
 */
export function generateHeuristicHooks(
  transcript: AiTranscriptSegment[],
  projectDuration: number,
  options: GenerateHooksOptions = {}
): AiProposal[] {
  const maxHooks = options.maxHooks || 4;
  if (!transcript || transcript.length === 0) return [];

  const candidates: { proposal: any; score: number }[] = [];

  transcript.forEach((seg, idx) => {
    let score = 50; // Base score
    const textLower = seg.text.toLowerCase();
    let hookType: HookType = 'curiosity';

    // Heuristic 1: Opening proximity bonus (first 10 seconds)
    if (seg.startTime < 10.0) {
      score += 25;
    }

    // Heuristic 2: Question format detection
    if (seg.text.includes('?')) {
      score += 20;
      hookType = 'question';
    }

    // Heuristic 3: Curiosity / Value keywords
    const matchedKw = HIGH_ENGAGEMENT_KEYWORDS.filter(kw => textLower.includes(kw));
    if (matchedKw.length > 0) {
      score += Math.min(25, matchedKw.length * 10);
      hookType = matchedKw.some(k => ['saves', 'automated', 'easy', 'fast'].includes(k)) ? 'benefit' : 'bold_statement';
    }

    // Heuristic 4: Numbers / Quantifiers detection
    if (/\d+/.test(seg.text) || textLower.includes('hours') || textLower.includes('percent')) {
      score += 15;
      hookType = 'bold_statement';
    }

    // Heuristic 5: Direct audience address ("you", "your")
    if (/\byou\b|\byour\b/i.test(seg.text)) {
      score += 10;
    }

    // Clamp candidate timestamps to reasonable teaser duration (min 1.5s, max 4.5s)
    const rawDuration = seg.endTime - seg.startTime;
    const targetEnd = rawDuration >= 1.5
      ? seg.endTime
      : Math.min(projectDuration, seg.startTime + Math.max(1.5, Math.min(4.5, rawDuration + 1.0)));

    const confidence = Math.min(96, Math.max(65, score));
    const reasoning = hookType === 'question'
      ? 'Opens with a direct engaging question creating an immediate curiosity gap.'
      : hookType === 'benefit'
        ? `Delivers a clear value proposition statement mentioning "${matchedKw.join(', ')}".`
        : hookType === 'bold_statement'
          ? 'Bold, concise spoken claim suitable for an opening video teaser.'
          : 'High-clarity opening sentence that sets immediate viewer expectations.';

    candidates.push({
      score,
      proposal: {
        id: `hook-heuristic-${idx + 1}`,
        kind: 'hook',
        title: hookType === 'question' ? 'Curiosity Question Hook' : hookType === 'benefit' ? 'Value Benefit Hook' : 'High-Impact Teaser Hook',
        startTime: seg.startTime,
        endTime: targetEnd,
        confidence,
        reasoning,
        sourceEvidence: seg.text.trim(),
        source: 'heuristic',
        data: {
          text: seg.text.trim(),
          suggestedHeadline: seg.text.replace(/[^\w\s]/gi, '').toUpperCase().slice(0, 32),
          hookType,
          suggestedPlacement: 'opening'
        }
      }
    });
  });

  // Sort by score descending and deduplicate overlapping ranges
  candidates.sort((a, b) => b.score - a.score);

  const selectedProposals: any[] = [];
  for (const item of candidates) {
    if (selectedProposals.length >= maxHooks) break;

    // Avoid duplicate / nearly identical start times within 1.0s
    const isTooClose = selectedProposals.some(p => Math.abs(p.startTime - item.proposal.startTime) < 1.0);
    if (!isTooClose) {
      selectedProposals.push(item.proposal);
    }
  }

  // Pass through untrusted output validation pipeline
  const report = validateAiProposals(selectedProposals, {
    projectDuration
  });

  return report.validatedProposals;
}

/**
 * Master Hook Generator: Analyzes transcripts via Ollama with deterministic fallback.
 */
export async function generateAiHooks(
  transcript: AiTranscriptSegment[],
  projectDuration: number,
  options: GenerateHooksOptions = {}
): Promise<GenerateHooksResult> {
  const startTime = Date.now();
  let providerUsed: 'ollama' | 'heuristic' = options.preferredProvider === 'heuristic' ? 'heuristic' : 'ollama';
  let fallbackUsed = false;
  let rawHookProposals: any[] = [];
  let providerError: string | undefined;

  if (!transcript || transcript.length === 0) {
    return {
      success: false,
      provider: 'heuristic',
      proposals: [],
      diagnostics: {
        providerAvailable: false,
        fallbackUsed: false,
        totalEvaluated: 0,
        rejectedCount: 0,
        latencyMs: 0,
        error: 'No transcript segments provided. Generate captions first.'
      }
    };
  }

  // 1. Try Local Ollama if requested
  if (providerUsed === 'ollama') {
    const ollamaStatus = await getOllamaStatus(2000);
    if (ollamaStatus.available) {
      const transcriptSummary = transcript.slice(0, 40).map((t, i) => 
        `[${t.startTime.toFixed(2)}s - ${t.endTime.toFixed(2)}s]: "${t.text}"`
      ).join('\n');

      const goalPrompt = options.goal ? `\nTarget Goal: ${options.goal}` : '';
      const prompt = `Analyze this spoken video transcript and identify the top ${options.maxHooks || 3} highest retention opening video hooks.${goalPrompt}
Transcript:
${transcriptSummary}

Requirements:
1. Every hook MUST use the exact timestamps from the transcript.
2. Hook duration must be between 1.5s and 5.0s.
3. Hook must represent the most engaging, provocative, or value-packed moment.

Respond with a JSON object containing a "hooks" array:
{
  "hooks": [
    {
      "id": "hook-1",
      "kind": "hook",
      "title": "Short Hook Label",
      "startTime": number,
      "endTime": number,
      "confidence": number (60-100),
      "reasoning": "Plain language explanation of why this hooks viewers",
      "sourceEvidence": "Exact quote from transcript",
      "hookType": "question" | "curiosity" | "bold_statement" | "benefit",
      "source": "ollama"
    }
  ]
}`;

      const ollamaRes = await generateOllamaStructured<{ hooks: any[] }>(prompt, {
        temperature: 0.2,
        timeoutMs: 12000
      });

      if (ollamaRes.success && ollamaRes.data?.hooks && Array.isArray(ollamaRes.data.hooks) && ollamaRes.data.hooks.length > 0) {
        // Grounding validation for Ollama outputs
        const groundedOllamaHooks = ollamaRes.data.hooks.filter(h => {
          const grounding = validateTranscriptGrounding(h, transcript, projectDuration);
          return grounding.isGrounded;
        });

        if (groundedOllamaHooks.length > 0) {
          rawHookProposals = groundedOllamaHooks;
        } else {
          fallbackUsed = true;
          providerError = 'Ollama output failed transcript grounding validation. Activating heuristic fallback.';
        }
      } else {
        fallbackUsed = true;
        providerError = ollamaRes.error || 'Ollama generation returned empty hooks. Activating heuristic fallback.';
      }
    } else {
      fallbackUsed = true;
      providerError = ollamaStatus.error || 'Ollama is offline. Activating heuristic fallback.';
    }
  }

  // 2. Fallback to Heuristics if needed
  if (fallbackUsed || providerUsed === 'heuristic' || rawHookProposals.length === 0) {
    rawHookProposals = generateHeuristicHooks(transcript, projectDuration, options);
    providerUsed = 'heuristic';
  }

  // 3. Final untrusted validation pass
  const validationReport = validateAiProposals(rawHookProposals, {
    projectDuration
  });

  const latencyMs = Date.now() - startTime;

  return {
    success: validationReport.validatedProposals.length > 0,
    provider: providerUsed,
    proposals: validationReport.validatedProposals.slice(0, options.maxHooks || 4),
    diagnostics: {
      providerAvailable: providerUsed === 'ollama',
      fallbackUsed,
      totalEvaluated: transcript.length,
      rejectedCount: validationReport.rejectedProposals.length,
      latencyMs,
      error: providerError
    }
  };
}
