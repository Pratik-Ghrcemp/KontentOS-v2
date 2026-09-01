import { AiProposal, AiProposalKind, AiProposalStatus } from './proposal-types';

const VALID_KINDS = new Set<string>(['hook', 'cut', 'zoom', 'headline', 'pacing']);
const VALID_SOURCES = new Set<string>(['gemini', 'openai', 'azure-openai', 'ollama', 'heuristic', 'anthropic', 'mock']);
const MIN_DURATION_SECONDS = 0.2;
const MAX_TEXT_LENGTH = 500;

export interface ValidationContext {
  projectDuration: number;
  availableTrackIds?: string[];
}

export interface ValidationReport {
  isValid: boolean;
  validatedProposals: AiProposal[];
  rejectedProposals: { proposal: any; reasons: string[] }[];
  warnings: string[];
}

/**
 * Sanitizes text by stripping HTML/script tags and trimming excessive lengths.
 */
function sanitizeText(raw: any, maxLength = MAX_TEXT_LENGTH): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip script schemes
    .replace(/[\r\n\t]+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Stage 1: Structural Validation
 */
function validateStructure(raw: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: ['Proposal item must be a non-null object'] };
  }

  if (!raw.id || typeof raw.id !== 'string') {
    errors.push('Missing or invalid string id');
  }

  if (!raw.kind || !VALID_KINDS.has(raw.kind)) {
    errors.push(`Invalid kind: ${raw.kind}. Must be one of: ${Array.from(VALID_KINDS).join(', ')}`);
  }

  if (!raw.title || typeof raw.title !== 'string') {
    errors.push('Missing or invalid string title');
  }

  if (!raw.reasoning || typeof raw.reasoning !== 'string') {
    errors.push('Missing or invalid string reasoning');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Stage 2: Timestamp Validation
 */
function validateTimestamps(
  startTime: any,
  endTime: any,
  projectDuration: number
): { valid: boolean; start: number; end: number; errors: string[] } {
  const errors: string[] = [];
  const start = Number(startTime);
  const end = Number(endTime);

  if (isNaN(start) || !isFinite(start)) {
    errors.push(`Invalid startTime: ${startTime} (must be a finite number)`);
  }
  if (isNaN(end) || !isFinite(end)) {
    errors.push(`Invalid endTime: ${endTime} (must be a finite number)`);
  }

  if (errors.length > 0) {
    return { valid: false, start: 0, end: 0, errors };
  }

  if (start < 0) {
    errors.push(`startTime cannot be negative (${start})`);
  }

  if (end <= start) {
    errors.push(`endTime (${end}) must be strictly greater than startTime (${start})`);
  }

  const duration = end - start;
  if (duration < MIN_DURATION_SECONDS) {
    errors.push(`Duration (${duration.toFixed(2)}s) is below minimum allowed threshold (${MIN_DURATION_SECONDS}s)`);
  }

  if (projectDuration > 0 && end > projectDuration + 0.5) {
    errors.push(`endTime (${end.toFixed(2)}s) exceeds project duration (${projectDuration.toFixed(2)}s)`);
  }

  return { valid: errors.length === 0, start, end, errors };
}

/**
 * Stage 3: Project Boundary Validation
 */
function validateBoundaries(
  raw: any,
  availableTrackIds?: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (raw.targetTrackId && availableTrackIds && availableTrackIds.length > 0) {
    if (!availableTrackIds.includes(raw.targetTrackId)) {
      errors.push(`Target track "${raw.targetTrackId}" does not exist in project tracks`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Stage 4: Overlap Safety for destructive proposals (Cuts)
 * Merges safe continuous ranges and detects unresolvable conflicts.
 */
function resolveCutOverlaps(proposals: AiProposal[]): { resolved: AiProposal[]; warnings: string[] } {
  const warnings: string[] = [];
  const nonCuts = proposals.filter(p => p.kind !== 'cut');
  const cuts = proposals.filter(p => p.kind === 'cut').sort((a, b) => a.startTime - b.startTime);

  if (cuts.length <= 1) {
    return { resolved: proposals, warnings };
  }

  const mergedCuts: AiProposal[] = [];
  let currentCut = cuts[0];

  for (let i = 1; i < cuts.length; i++) {
    const nextCut = cuts[i];

    // Check overlap: nextCut starts before currentCut ends
    if (nextCut.startTime <= currentCut.endTime) {
      warnings.push(`Merged overlapping cuts: [${currentCut.startTime.toFixed(2)}s-${currentCut.endTime.toFixed(2)}s] and [${nextCut.startTime.toFixed(2)}s-${nextCut.endTime.toFixed(2)}s]`);
      currentCut = {
        ...currentCut,
        id: `${currentCut.id}_merged_${nextCut.id}`,
        endTime: Math.max(currentCut.endTime, nextCut.endTime),
        title: `${currentCut.title} & ${nextCut.title}`,
        reasoning: `${currentCut.reasoning} | ${nextCut.reasoning}`,
        confidence: Math.round((currentCut.confidence + nextCut.confidence) / 2)
      };
    } else {
      mergedCuts.push(currentCut);
      currentCut = nextCut;
    }
  }
  mergedCuts.push(currentCut);

  return { resolved: [...nonCuts, ...mergedCuts], warnings };
}

/**
 * Master Validation Pipeline: Processes untrusted raw AI output into certified AiProposal[]
 */
export function validateAiProposals(
  rawInput: any,
  context: ValidationContext
): ValidationReport {
  const warnings: string[] = [];
  const rejectedProposals: { proposal: any; reasons: string[] }[] = [];
  const rawList: any[] = Array.isArray(rawInput)
    ? rawInput
    : rawInput?.proposals && Array.isArray(rawInput.proposals)
      ? rawInput.proposals
      : rawInput?.hooks && Array.isArray(rawInput.hooks)
        ? rawInput.hooks
        : [rawInput];

  const candidateProposals: AiProposal[] = [];

  for (const raw of rawList) {
    // Stage 1: Structural check
    const structCheck = validateStructure(raw);
    if (!structCheck.valid) {
      rejectedProposals.push({ proposal: raw, reasons: structCheck.errors });
      continue;
    }

    // Stage 2: Timestamp sanity
    const timeCheck = validateTimestamps(raw.startTime, raw.endTime, context.projectDuration);
    if (!timeCheck.valid) {
      rejectedProposals.push({ proposal: raw, reasons: timeCheck.errors });
      continue;
    }

    // Stage 3: Boundary check
    const boundaryCheck = validateBoundaries(raw, context.availableTrackIds);
    if (!boundaryCheck.valid) {
      rejectedProposals.push({ proposal: raw, reasons: boundaryCheck.errors });
      continue;
    }

    // Stage 5: Confidence & Text Sanitization
    const rawConf = Number(raw.confidence);
    const confidence = isNaN(rawConf) ? 75 : Math.max(0, Math.min(100, Math.round(rawConf)));

    const sanitizedTitle = sanitizeText(raw.title, 80);
    const sanitizedReasoning = sanitizeText(raw.reasoning, 300);
    const sanitizedEvidence = raw.sourceEvidence ? sanitizeText(raw.sourceEvidence, 150) : undefined;

    const validatedProposal: AiProposal = {
      id: String(raw.id),
      kind: raw.kind as AiProposalKind,
      title: sanitizedTitle || 'AI Suggestion',
      startTime: timeCheck.start,
      endTime: timeCheck.end,
      confidence,
      reasoning: sanitizedReasoning || 'AI identified high-value editing candidate.',
      source: VALID_SOURCES.has(raw.source) ? raw.source : 'heuristic',
      status: 'validated' as AiProposalStatus,
      targetTrackId: raw.targetTrackId ? String(raw.targetTrackId) : undefined,
      sourceEvidence: sanitizedEvidence,
      data: raw.data && typeof raw.data === 'object' ? raw.data : undefined
    };

    candidateProposals.push(validatedProposal);
  }

  // Stage 4: Overlap safety
  const { resolved, warnings: overlapWarnings } = resolveCutOverlaps(candidateProposals);
  warnings.push(...overlapWarnings);

  return {
    isValid: candidateProposals.length > 0,
    validatedProposals: resolved,
    rejectedProposals,
    warnings
  };
}
