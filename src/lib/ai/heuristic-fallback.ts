import { AiAnalysisRequest, AiProposal, AiTranscriptSegment } from './proposal-types';
import { validateAiProposals } from './validation-pipeline';

const HOOK_KEYWORDS = ['welcome', 'saves', 'hours', 'automated', 'secret', 'never', 'how to', 'best', 'easy', 'fast', 'stop', 'ultimate'];
const FILLER_WORDS = ['um', 'uh', 'you know', 'basically', 'actually', 'like', 'sort of'];

/**
 * Deterministic rule-based analysis engine for 100% offline fallback.
 * Guarantees valid, verified proposals without requiring Ollama or cloud LLMs.
 */
export function generateHeuristicProposals(request: AiAnalysisRequest): AiProposal[] {
  const { transcript, projectDuration, availableTrackIds } = request;
  const rawProposals: any[] = [];

  if (!transcript || transcript.length === 0) {
    return [];
  }

  // 1. Hook Candidate Heuristic: Evaluate opening statements & high-curiosity phrases
  transcript.forEach((seg, idx) => {
    const textLower = seg.text.toLowerCase();
    const isEarly = seg.startTime < 10.0;
    const containsKeyword = HOOK_KEYWORDS.some(kw => textLower.includes(kw));
    const isQuestion = seg.text.includes('?');

    if (isEarly && (containsKeyword || isQuestion || idx === 0)) {
      const duration = Math.max(0.5, seg.endTime - seg.startTime);
      rawProposals.push({
        id: `heuristic-hook-${idx + 1}`,
        kind: 'hook',
        title: containsKeyword ? 'High-Impact Opening Teaser' : 'Direct Topic Intro Hook',
        startTime: seg.startTime,
        endTime: Math.min(projectDuration, seg.startTime + Math.max(2.0, duration)),
        confidence: isQuestion ? 92 : containsKeyword ? 88 : 82,
        reasoning: containsKeyword
          ? `Contains high-engagement value proposition keywords ("${HOOK_KEYWORDS.find(kw => textLower.includes(kw))}").`
          : 'Opening statement with immediate context clarity.',
        sourceEvidence: seg.text.trim(),
        source: 'heuristic',
        data: {
          suggestedHeadline: seg.text.replace(/[^\w\s]/gi, '').toUpperCase().slice(0, 30)
        }
      });
    }
  });

  // 2. Pacing & Silence Cut Heuristic: Detect pauses between consecutive speech tokens
  for (let i = 0; i < transcript.length - 1; i++) {
    const current = transcript[i];
    const next = transcript[i + 1];
    const gap = next.startTime - current.endTime;

    if (gap >= 0.8) {
      rawProposals.push({
        id: `heuristic-cut-gap-${i + 1}`,
        kind: 'cut',
        title: `Trim ${gap.toFixed(1)}s Speech Pause`,
        startTime: current.endTime + 0.05,
        endTime: next.startTime - 0.05,
        confidence: 90,
        reasoning: `Identified ${gap.toFixed(1)}s dead-air gap between phrases. Removing it tightens pacing.`,
        sourceEvidence: `Pause between "${current.text.slice(-15)}" and "${next.text.slice(0, 15)}"`,
        source: 'heuristic',
        data: { ripple: true }
      });
    }
  }

  // 3. Filler Word Cut Heuristic
  transcript.forEach((seg, idx) => {
    const textLower = seg.text.toLowerCase();
    const matchedFiller = FILLER_WORDS.find(f => textLower.includes(f));
    if (matchedFiller) {
      rawProposals.push({
        id: `heuristic-filler-${idx + 1}`,
        kind: 'cut',
        title: `Remove Filler "${matchedFiller}"`,
        startTime: seg.startTime,
        endTime: Math.min(seg.endTime, seg.startTime + 0.8),
        confidence: 85,
        reasoning: `Detected speech disfluency filler word "${matchedFiller}".`,
        sourceEvidence: seg.text.trim(),
        source: 'heuristic',
        data: { ripple: true }
      });
    }
  });

  // 4. Kinetic Punch-in Zoom Heuristic: Key conceptual emphasis points
  transcript.forEach((seg, idx) => {
    const textLower = seg.text.toLowerCase();
    if (textLower.includes('video editor') || textLower.includes('saves') || textLower.includes('automated')) {
      rawProposals.push({
        id: `heuristic-zoom-${idx + 1}`,
        kind: 'zoom',
        title: 'Kinetic Punch Zoom (1.15x)',
        startTime: seg.startTime,
        endTime: seg.endTime,
        confidence: 86,
        reasoning: 'Emphasizes key value proposition keyword on screen.',
        sourceEvidence: seg.text.trim(),
        source: 'heuristic',
        data: { scale: 1.15 }
      });
    }
  });

  // Pass through the strict validation pipeline to ensure complete compliance
  const report = validateAiProposals(rawProposals, {
    projectDuration,
    availableTrackIds
  });

  return report.validatedProposals;
}
