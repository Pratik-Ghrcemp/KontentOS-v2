import { StoryboardBeat, StoryboardPlan, StoryboardValidationResult, StoryboardBeatRole, StoryboardTransition } from './storyboard-types';

const VALID_ROLES = new Set<StoryboardBeatRole>(['hook', 'problem', 'solution', 'proof', 'call_to_action', 'transition']);
const VALID_TRANSITIONS = new Set<StoryboardTransition>(['cut', 'crossfade', 'zoom_in', 'slide_left']);
const MIN_BEAT_DURATION = 0.5;
const MAX_BEAT_DURATION = 120.0;

function sanitizeText(raw: any, maxLength = 500): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function validateAndSanitizeStoryboard(rawPlan: Partial<StoryboardPlan>, targetDuration = 30): StoryboardValidationResult {
  const rejections: string[] = [];
  const warnings: string[] = [];

  const rawBeats = Array.isArray(rawPlan?.beats) ? rawPlan.beats : [];
  if (rawBeats.length === 0) {
    rejections.push('Storyboard plan contains 0 beats.');
  }

  const validBeats: StoryboardBeat[] = [];
  let currentTime = 0;

  for (let i = 0; i < rawBeats.length; i++) {
    const b = rawBeats[i] as any;
    if (!b || typeof b !== 'object') {
      rejections.push(`Beat at index ${i} is not a valid object.`);
      continue;
    }

    const cleanTitle = sanitizeText(b.title || `Scene ${i + 1}`, 100);
    const cleanSpoken = sanitizeText(b.spokenText || '', 1000);
    const cleanVisual = sanitizeText(b.visualIntent || 'Engaging visual relevant to speech', 500);
    const cleanHeadline = b.suggestedHeadline ? sanitizeText(b.suggestedHeadline, 100) : undefined;
    const cleanSound = b.soundCue ? sanitizeText(b.soundCue, 80) : undefined;

    const rawKeywords = Array.isArray(b.brollKeywords) ? b.brollKeywords : [];
    const cleanKeywords = rawKeywords.map((kw: any) => sanitizeText(kw, 50)).filter(Boolean).slice(0, 8);

    const role: StoryboardBeatRole = VALID_ROLES.has(b.role) ? b.role : (i === 0 ? 'hook' : i === rawBeats.length - 1 ? 'call_to_action' : 'solution');
    const transitionType: StoryboardTransition = VALID_TRANSITIONS.has(b.transitionType) ? b.transitionType : 'cut';

    let rawDur = typeof b.estimatedDuration === 'number' && !isNaN(b.estimatedDuration) ? b.estimatedDuration : 4.0;
    if (rawDur < MIN_BEAT_DURATION) {
      warnings.push(`Beat ${i + 1} duration (${rawDur}s) was clamped to minimum ${MIN_BEAT_DURATION}s.`);
      rawDur = MIN_BEAT_DURATION;
    } else if (rawDur > MAX_BEAT_DURATION) {
      warnings.push(`Beat ${i + 1} duration (${rawDur}s) exceeded max allowed (${MAX_BEAT_DURATION}s).`);
      rawDur = MAX_BEAT_DURATION;
    }

    const rawConfidence = typeof b.confidence === 'number' && !isNaN(b.confidence) ? b.confidence : 85;
    const confidence = Math.max(0, Math.min(100, rawConfidence));

    const beat: StoryboardBeat = {
      id: sanitizeText(b.id || `beat-${i + 1}-${Date.now()}`, 50),
      beatIndex: i,
      role,
      title: cleanTitle,
      spokenText: cleanSpoken,
      estimatedStartTime: Number(currentTime.toFixed(2)),
      estimatedDuration: Number(rawDur.toFixed(2)),
      visualIntent: cleanVisual,
      brollKeywords: cleanKeywords,
      suggestedHeadline: cleanHeadline,
      transitionType,
      soundCue: cleanSound,
      confidence,
      isApproved: b.isApproved !== false
    };

    currentTime += rawDur;
    validBeats.push(beat);
  }

  const cleanPlanTitle = sanitizeText(rawPlan.title || 'Storyboard Video Concept', 120);
  const totalEstimatedDuration = Number(currentTime.toFixed(2));

  const sanitizedPlan: StoryboardPlan = {
    id: sanitizeText(rawPlan.id || `sb-${Date.now()}`, 50),
    title: cleanPlanTitle,
    topic: rawPlan.topic ? sanitizeText(rawPlan.topic, 200) : undefined,
    targetDuration: targetDuration || 30,
    estimatedTotalDuration: totalEstimatedDuration,
    tone: rawPlan.tone || 'energetic',
    formatPreset: rawPlan.formatPreset || 'instagram-reels',
    beats: validBeats,
    provider: rawPlan.provider || 'heuristic',
    createdAt: rawPlan.createdAt || new Date().toISOString(),
    validationWarnings: warnings
  };

  return {
    isValid: rejections.length === 0 && validBeats.length > 0,
    sanitizedPlan,
    rejections,
    warnings
  };
}
