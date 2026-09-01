import { PublishingPlatform } from './types';

export interface ThumbnailOptions {
  title: string;
  platform: PublishingPlatform;
  aspectRatio: '9:16' | '16:9' | '1:1';
  themeColor?: string;
  badgeText?: string;
}

/**
 * Procedural SVG Thumbnail Card Generator.
 * Creates crisp, high-contrast, offline-rendered thumbnail cards for previewing video publishing packages.
 */
export function generateProceduralThumbnailSvg(options: ThumbnailOptions): string {
  const { title, platform, aspectRatio, themeColor = '#6366f1', badgeText } = options;

  let width = 1080;
  let height = 1920;

  if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  } else if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  }

  const platformBadge = getPlatformBadgeLabel(platform);
  const cleanTitle = escapeXml(title.slice(0, 50));
  const cleanBadge = escapeXml(badgeText || platformBadge);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#111827" />
      <stop offset="100%" stop-color="${themeColor}" stop-opacity="0.8" />
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Abstract Motion Curves -->
  <circle cx="${width * 0.85}" cy="${height * 0.2}" r="${width * 0.3}" fill="${themeColor}" opacity="0.15" filter="url(#dropShadow)" />
  <circle cx="${width * 0.15}" cy="${height * 0.8}" r="${width * 0.25}" fill="#ec4899" opacity="0.12" filter="url(#dropShadow)" />

  <!-- Center Card Frame -->
  <rect x="${width * 0.08}" y="${height * 0.3}" width="${width * 0.84}" height="${height * 0.4}" rx="24" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="3" filter="url(#dropShadow)" />

  <!-- Platform Badge Pill -->
  <g transform="translate(${width * 0.12}, ${height * 0.36})">
    <rect width="${cleanBadge.length * 16 + 48}" height="48" rx="24" fill="${themeColor}" />
    <text x="${cleanBadge.length * 8 + 24}" y="31" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${cleanBadge}
    </text>
  </g>

  <!-- High-Impact Title Typography -->
  <text x="${width * 0.12}" y="${height * 0.49}" font-family="system-ui, -apple-system, sans-serif" font-size="${aspectRatio === '9:16' ? 56 : 64}" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
    ${cleanTitle.slice(0, 24)}
  </text>
  <text x="${width * 0.12}" y="${height * 0.56}" font-family="system-ui, -apple-system, sans-serif" font-size="${aspectRatio === '9:16' ? 48 : 56}" font-weight="800" fill="#38bdf8">
    ${cleanTitle.slice(24, 50)}
  </text>

  <!-- Play Badge Indicator -->
  <g transform="translate(${width * 0.5}, ${height * 0.64})">
    <circle cx="0" cy="0" r="36" fill="#ffffff" fill-opacity="0.2" />
    <circle cx="0" cy="0" r="28" fill="#ffffff" />
    <polygon points="-8,-12 14,0 -8,12" fill="#0f172a" />
  </g>
</svg>
`.trim();
}

function getPlatformBadgeLabel(platform: PublishingPlatform): string {
  switch (platform) {
    case 'youtube_shorts':
      return 'YOUTUBE SHORTS';
    case 'instagram_reels':
      return 'INSTAGRAM REELS';
    case 'tiktok':
      return 'TIKTOK';
    case 'linkedin':
      return 'LINKEDIN VIDEO';
    case 'twitter_x':
      return 'X / TWITTER';
    default:
      return 'SOCIAL VIDEO';
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
