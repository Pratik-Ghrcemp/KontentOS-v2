import { PublishingProvider } from './types';
import { PlatformPackage, PublishResult, ValidationResult } from '../types';
import { validatePlatformPackage } from '../platform-constraints';
import * as fs from 'fs';

/**
 * Deterministic Mock Sandbox Publishing Provider.
 * Allows safe, offline, and zero-cost publishing simulation and test validation.
 */
export class MockPublishingProvider implements PublishingProvider {
  name = 'Mock Sandbox Provider';
  isMock = true;

  async validate(pkg: PlatformPackage, mediaPath: string): Promise<ValidationResult> {
    const baseValidation = validatePlatformPackage(pkg);
    const errors = [...baseValidation.errors];
    const warnings = [...baseValidation.warnings];

    if (!mediaPath || !fs.existsSync(mediaPath)) {
      errors.push(`Media file not found at path: ${mediaPath}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async publish(pkg: PlatformPackage, mediaPath: string): Promise<PublishResult> {
    const validation = await this.validate(pkg, mediaPath);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join('; ')}`,
      };
    }

    const randomId = Math.floor(100000 + Math.random() * 900000);
    const postUrls: Record<string, string> = {
      youtube_shorts: `https://youtube.com/shorts/mock_${randomId}`,
      instagram_reels: `https://instagram.com/reel/mock_${randomId}`,
      tiktok: `https://tiktok.com/@creator/video/mock_${randomId}`,
      linkedin: `https://linkedin.com/feed/update/urn:li:activity:mock_${randomId}`,
      twitter_x: `https://x.com/creator/status/mock_${randomId}`,
    };

    return {
      success: true,
      postId: `post_${pkg.platform}_${randomId}`,
      postUrl: postUrls[pkg.platform] || `https://mock.platform.com/post/${randomId}`,
      publishedAt: new Date().toISOString(),
      rawResponse: {
        provider: 'MockSandbox',
        platform: pkg.platform,
        characterCount: pkg.metadata.characterCount,
        hashtagCount: pkg.metadata.hashtagCount,
      },
    };
  }

  async checkStatus(postId: string): Promise<{ status: string; url?: string }> {
    return {
      status: 'published',
      url: `https://mock.platform.com/post/${postId}`,
    };
  }
}
