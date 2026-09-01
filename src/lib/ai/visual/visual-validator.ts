import { VisualAssetProposal, AspectRatio, FitMode } from './types';

/**
 * Strips script tags, evil attributes, and XSS vectors from input strings.
 */
export function sanitizeVisualText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*([^\s>]+|["'][^"']*["'])/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validates SVG content against script injection or malicious external resource vectors.
 */
export function validateSvgSafety(svgString: string): { isValid: boolean; reason?: string } {
  if (!svgString || typeof svgString !== 'string') {
    return { isValid: false, reason: 'Empty or invalid SVG payload' };
  }

  const lower = svgString.toLowerCase();

  // Check forbidden script elements
  if (lower.includes('<script') || lower.includes('</script>')) {
    return { isValid: false, reason: 'Forbidden <script> tag in SVG payload' };
  }

  // Check inline event handlers
  if (/on\w+\s*=/i.test(lower)) {
    return { isValid: false, reason: 'Forbidden inline event handlers in SVG' };
  }

  // Check forbidden foreign objects or external embeds
  if (lower.includes('<foreignobject') || lower.includes('<iframe') || lower.includes('<embed')) {
    return { isValid: false, reason: 'Forbidden external embedding elements in SVG' };
  }

  // Ensure root <svg> tag is present
  if (!lower.includes('<svg') || !lower.includes('</svg>')) {
    return { isValid: false, reason: 'Malformed SVG structure' };
  }

  return { isValid: true };
}

/**
 * Validates complete VisualAssetProposal schema and invariant integrity.
 */
export function validateProposalIntegrity(proposal: VisualAssetProposal): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!proposal.id || typeof proposal.id !== 'string') {
    errors.push('Missing or invalid proposal id');
  }

  if (!proposal.title || typeof proposal.title !== 'string') {
    errors.push('Missing or invalid proposal title');
  }

  if (!proposal.sourcePathOrData || typeof proposal.sourcePathOrData !== 'string') {
    errors.push('Missing sourcePathOrData');
  }

  if (typeof proposal.relevanceScore !== 'number' || proposal.relevanceScore < 0 || proposal.relevanceScore > 1) {
    errors.push(`Invalid relevanceScore (${proposal.relevanceScore}): must be between 0.0 and 1.0`);
  }

  if (typeof proposal.suggestedDuration !== 'number' || proposal.suggestedDuration <= 0) {
    errors.push('Invalid suggestedDuration: must be > 0');
  }

  const validAspectRatios: AspectRatio[] = ['9:16', '16:9', '1:1'];
  if (!validAspectRatios.includes(proposal.aspectRatio)) {
    errors.push(`Invalid aspectRatio: ${proposal.aspectRatio}`);
  }

  const validFitModes: FitMode[] = ['cover', 'contain', 'fill'];
  if (!validFitModes.includes(proposal.fitMode)) {
    errors.push(`Invalid fitMode: ${proposal.fitMode}`);
  }

  if (!proposal.kenBurns || !proposal.kenBurns.motion) {
    errors.push('Missing or invalid kenBurns motion configuration');
  }

  if (!proposal.metadata || typeof proposal.metadata.width !== 'number' || typeof proposal.metadata.height !== 'number') {
    errors.push('Invalid metadata dimensions');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
