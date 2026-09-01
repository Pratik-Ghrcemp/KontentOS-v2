import { PublishingPlatform, PlatformConstraints, PlatformPackage, ValidationResult } from './types';

export const PLATFORM_CONSTRAINTS: Record<PublishingPlatform, PlatformConstraints> = {
  youtube_shorts: {
    platform: 'youtube_shorts',
    displayName: 'YouTube Shorts',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxHashtags: 15,
    optimalHashtags: 3,
    supportedAspectRatios: ['9:16'],
    maxDurationSeconds: 60,
    recommendedDurationSeconds: { min: 15, max: 59 },
    requiresTitle: true,
    requiresDescription: false,
  },
  instagram_reels: {
    platform: 'instagram_reels',
    displayName: 'Instagram Reels',
    maxTitleLength: 0, // Reels uses caption only
    maxDescriptionLength: 2200,
    maxHashtags: 30,
    optimalHashtags: 5,
    supportedAspectRatios: ['9:16'],
    maxDurationSeconds: 90,
    recommendedDurationSeconds: { min: 15, max: 60 },
    requiresTitle: false,
    requiresDescription: true,
  },
  tiktok: {
    platform: 'tiktok',
    displayName: 'TikTok',
    maxTitleLength: 0, // TikTok uses caption only
    maxDescriptionLength: 2200,
    maxHashtags: 15,
    optimalHashtags: 5,
    supportedAspectRatios: ['9:16'],
    maxDurationSeconds: 180,
    recommendedDurationSeconds: { min: 15, max: 45 },
    requiresTitle: false,
    requiresDescription: true,
  },
  linkedin: {
    platform: 'linkedin',
    displayName: 'LinkedIn Video',
    maxTitleLength: 150,
    maxDescriptionLength: 3000,
    maxHashtags: 5,
    optimalHashtags: 3,
    supportedAspectRatios: ['9:16', '16:9', '1:1'],
    maxDurationSeconds: 600,
    recommendedDurationSeconds: { min: 30, max: 120 },
    requiresTitle: false,
    requiresDescription: true,
  },
  twitter_x: {
    platform: 'twitter_x',
    displayName: 'X (Twitter)',
    maxTitleLength: 0,
    maxDescriptionLength: 280, // Standard tweet limit
    maxHashtags: 3,
    optimalHashtags: 2,
    supportedAspectRatios: ['9:16', '16:9', '1:1'],
    maxDurationSeconds: 140,
    recommendedDurationSeconds: { min: 15, max: 45 },
    requiresTitle: false,
    requiresDescription: true,
  },
};

/**
 * Validates a platform package against strict platform rules and constraints.
 */
export function validatePlatformPackage(pkg: PlatformPackage, durationSeconds?: number): ValidationResult {
  const constraints = PLATFORM_CONSTRAINTS[pkg.platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!constraints) {
    return { valid: false, errors: [`Unsupported platform: ${pkg.platform}`], warnings: [] };
  }

  // 1. Title Validation
  if (constraints.requiresTitle && (!pkg.title || pkg.title.trim().length === 0)) {
    errors.push(`${constraints.displayName} requires a non-empty title.`);
  }
  if (constraints.maxTitleLength > 0 && pkg.title.length > constraints.maxTitleLength) {
    errors.push(`Title exceeds ${constraints.displayName} limit of ${constraints.maxTitleLength} chars (current: ${pkg.title.length}).`);
  }

  // 2. Description / Caption Validation
  if (constraints.requiresDescription && (!pkg.description || pkg.description.trim().length === 0)) {
    errors.push(`${constraints.displayName} requires a non-empty caption/description.`);
  }
  if (pkg.description.length > constraints.maxDescriptionLength) {
    errors.push(`Description exceeds ${constraints.displayName} limit of ${constraints.maxDescriptionLength} chars (current: ${pkg.description.length}).`);
  }

  // 3. Hashtag Validation
  if (pkg.hashtags.length > constraints.maxHashtags) {
    errors.push(`Hashtags count (${pkg.hashtags.length}) exceeds ${constraints.displayName} maximum of ${constraints.maxHashtags}.`);
  }
  if (pkg.hashtags.length > constraints.optimalHashtags + 5) {
    warnings.push(`Recommended hashtag count for ${constraints.displayName} is ~${constraints.optimalHashtags}.`);
  }

  // 4. Aspect Ratio Validation
  if (!constraints.supportedAspectRatios.includes(pkg.aspectRatio)) {
    errors.push(`Aspect ratio ${pkg.aspectRatio} is not supported by ${constraints.displayName}. Supported: ${constraints.supportedAspectRatios.join(', ')}`);
  }

  // 5. Duration Validation (if provided)
  if (durationSeconds !== undefined) {
    if (durationSeconds > constraints.maxDurationSeconds) {
      errors.push(`Video duration (${durationSeconds.toFixed(1)}s) exceeds ${constraints.displayName} maximum limit of ${constraints.maxDurationSeconds}s.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
