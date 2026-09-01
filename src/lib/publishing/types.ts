export type PublishingPlatform =
  | 'youtube_shorts'
  | 'instagram_reels'
  | 'tiktok'
  | 'linkedin'
  | 'twitter_x';

export type PublishingStatus =
  | 'draft'
  | 'ready'
  | 'scheduled'
  | 'dispatching'
  | 'published'
  | 'failed';

export interface PlatformConstraints {
  platform: PublishingPlatform;
  displayName: string;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxHashtags: number;
  optimalHashtags: number;
  supportedAspectRatios: ('9:16' | '16:9' | '1:1')[];
  maxDurationSeconds: number;
  recommendedDurationSeconds: { min: number; max: number };
  requiresTitle: boolean;
  requiresDescription: boolean;
}

export interface PlatformPackage {
  id: string;
  platform: PublishingPlatform;
  title: string;
  description: string;
  hashtags: string[];
  thumbnailUrl?: string;
  thumbnailTimestamp?: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  scheduledAt?: string; // ISO 8601 string
  status: PublishingStatus;
  publishResult?: {
    postId?: string;
    postUrl?: string;
    publishedAt?: string;
    error?: string;
  };
  metadata: {
    characterCount: number;
    hashtagCount: number;
    platformSpecific?: Record<string, any>;
    generatedByAi: boolean;
  };
}

export interface PackagingInput {
  renderResult: {
    outputPath: string;
    durationSeconds: number;
    aspectRatio: '9:16' | '16:9' | '1:1';
  };
  storyboard?: {
    title: string;
    beats: Array<{
      title: string;
      voiceoverLine?: string;
      visualDirective?: string;
    }>;
  };
  transcript?: string;
  targetPlatforms?: PublishingPlatform[];
  customPrompt?: string;
  creatorProfile?: {
    brandTone?: 'energetic' | 'educational' | 'professional' | 'entertaining';
    creatorName?: string;
    handle?: string;
    niche?: string;
  };
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  publishedAt?: string;
  error?: string;
  rawResponse?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
