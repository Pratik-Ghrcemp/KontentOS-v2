import { VisualIntent } from './types';

/**
 * Stop words to filter out when parsing visual keywords
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'this', 'that', 'these', 'those',
  'how', 'why', 'what', 'when', 'where', 'who', 'which', 'will', 'would', 'should', 'can', 'could'
]);

/**
 * Pure helper to extract meaningful keywords from text.
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(words));
}

/**
 * Deterministic mood classifier based on semantic cues in beat title, role, or text.
 */
export function classifyMood(text: string, role?: string): string {
  const lower = (text + ' ' + (role || '')).toLowerCase();
  if (lower.includes('hook') || lower.includes('secret') || lower.includes('stop') || lower.includes('warning') || lower.includes('urgent')) {
    return 'high_energy_urgent';
  }
  if (lower.includes('problem') || lower.includes('mistake') || lower.includes('struggle') || lower.includes('hard') || lower.includes('pain')) {
    return 'dramatic_tension';
  }
  if (lower.includes('solution') || lower.includes('fix') || lower.includes('easy') || lower.includes('hack') || lower.includes('win')) {
    return 'inspiring_breakthrough';
  }
  if (lower.includes('proof') || lower.includes('metric') || lower.includes('revenue') || lower.includes('chart') || lower.includes('result')) {
    return 'analytical_authoritative';
  }
  if (lower.includes('cta') || lower.includes('call') || lower.includes('action') || lower.includes('subscribe') || lower.includes('follow')) {
    return 'compelling_direct';
  }
  return 'cinematic_modern';
}

/**
 * Deterministic motion style selector based on mood and beat role.
 */
export function determineMotionStyle(role?: string, mood?: string): string {
  if (role === 'hook' || mood?.includes('urgent')) return 'fast_punch_zoom';
  if (role === 'problem' || mood?.includes('tension')) return 'slow_push_dramatic';
  if (role === 'solution' || mood?.includes('inspiring')) return 'dynamic_pan_reveal';
  if (role === 'proof' || mood?.includes('analytical')) return 'subtle_drift_focus';
  if (role === 'call_to_action') return 'steady_punch_in';
  return 'subtle_drift';
}

/**
 * Deterministic color theme selector for visual assets.
 */
export function determineColorTheme(role?: string): string {
  switch (role) {
    case 'hook': return 'neon_cyber';
    case 'problem': return 'minimal_dark';
    case 'solution': return 'vibrant_creator';
    case 'proof': return 'corporate_clean';
    case 'call_to_action': return 'warm_editorial';
    default: return 'vibrant_creator';
  }
}

/**
 * Parses a single Storyboard beat into a structured VisualIntent.
 */
export function parseVisualIntentFromBeat(beat: {
  id: string;
  title: string;
  role?: string;
  visualHook?: string;
  spokenText?: string;
  bRollIdeas?: string[];
  estimatedStartTime?: number;
  estimatedDuration?: number;
}): VisualIntent {
  const combinedText = [
    beat.title,
    beat.visualHook || '',
    beat.spokenText || '',
    ...(beat.bRollIdeas || [])
  ].join(' ');

  const keywords = extractKeywords(combinedText);
  const mood = classifyMood(combinedText, beat.role);
  const motionStyle = determineMotionStyle(beat.role, mood);
  const colorTheme = determineColorTheme(beat.role);

  // Derive Primary Subject and Secondary Subjects
  const primarySubject = beat.bRollIdeas && beat.bRollIdeas.length > 0
    ? beat.bRollIdeas[0]
    : (beat.visualHook || keywords.slice(0, 2).join(' ') || 'Content Creator');

  const secondarySubjects = (beat.bRollIdeas && beat.bRollIdeas.length > 1)
    ? beat.bRollIdeas.slice(1)
    : keywords.slice(2, 6);

  // Generate deterministic search queries
  const searchQueries: string[] = [];
  if (beat.bRollIdeas && beat.bRollIdeas.length > 0) {
    beat.bRollIdeas.forEach(idea => searchQueries.push(idea));
  }
  if (beat.visualHook) {
    searchQueries.push(beat.visualHook);
  }
  if (keywords.length >= 2) {
    searchQueries.push(keywords.slice(0, 3).join(' '));
  }
  if (searchQueries.length === 0) {
    searchQueries.push(`${beat.title} visual scene`);
  }

  return {
    beatId: beat.id,
    role: beat.role,
    primarySubject,
    secondarySubjects,
    mood,
    motionStyle,
    colorTheme,
    keywords,
    searchQueries: Array.from(new Set(searchQueries)),
    targetDuration: beat.estimatedDuration || 5.0,
    suggestedStartTime: beat.estimatedStartTime || 0
  };
}

/**
 * Batch parses multiple storyboard beats or raw script text into VisualIntent array.
 */
export function parseVisualIntents(beats: Array<any>): VisualIntent[] {
  return beats.map(parseVisualIntentFromBeat);
}
