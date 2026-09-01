import { VisualAssetProposal, AspectRatio, FitMode, KenBurnsConfig } from './types';
import { getKenBurnsConfig } from './asset-matcher';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

export const THEME_PALETTES: Record<string, ThemeColors> = {
  neon_cyber: {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e1b4b',
    accent: '#06b6d4',
    accentGlow: '#ec4899',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    border: '#06b6d4'
  },
  minimal_dark: {
    bgPrimary: '#09090b',
    bgSecondary: '#18181b',
    accent: '#38bdf8',
    accentGlow: '#60a5fa',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    border: '#27272a'
  },
  vibrant_creator: {
    bgPrimary: '#1e1035',
    bgSecondary: '#2e1065',
    accent: '#a855f7',
    accentGlow: '#f43f5e',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    border: '#a855f7'
  },
  corporate_clean: {
    bgPrimary: '#0c4a6e',
    bgSecondary: '#075985',
    accent: '#10b981',
    accentGlow: '#38bdf8',
    textPrimary: '#ffffff',
    textSecondary: '#bae6fd',
    border: '#10b981'
  },
  warm_editorial: {
    bgPrimary: '#451a03',
    bgSecondary: '#78350f',
    accent: '#f59e0b',
    accentGlow: '#f97316',
    textPrimary: '#fffbeb',
    textSecondary: '#fde68a',
    border: '#f59e0b'
  }
};

export function getResolutionForAspectRatio(aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16': return { width: 1080, height: 1920 };
    case '16:9': return { width: 1920, height: 1080 };
    case '1:1': return { width: 1080, height: 1080 };
    default: return { width: 1080, height: 1920 };
  }
}

/**
 * Pure SVG generator for kinetic title cards.
 */
export function generateKineticTitleSvg(
  headline: string,
  subtitle: string = '',
  theme: string = 'vibrant_creator',
  aspectRatio: AspectRatio = '9:16'
): string {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.vibrant_creator;
  const { width, height } = getResolutionForAspectRatio(aspectRatio);

  const safeHeadline = headline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSubtitle = subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const centerY = height / 2;
  const fontSize = aspectRatio === '16:9' ? 68 : 56;
  const subFontSize = aspectRatio === '16:9' ? 34 : 28;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgPrimary}" />
      <stop offset="100%" stop-color="${palette.bgSecondary}" />
    </linearGradient>
    <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.accent}" />
      <stop offset="100%" stop-color="${palette.accentGlow}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bg-grad)" />

  <!-- Ambient Light Orbs -->
  <circle cx="${width * 0.2}" cy="${height * 0.25}" r="${width * 0.25}" fill="${palette.accent}" opacity="0.15" filter="url(#glow)" />
  <circle cx="${width * 0.8}" cy="${height * 0.75}" r="${width * 0.3}" fill="${palette.accentGlow}" opacity="0.12" filter="url(#glow)" />

  <!-- Center Content Frame -->
  <g transform="translate(${width / 2}, ${centerY})">
    <!-- Accent Pill -->
    <rect x="-140" y="-120" width="280" height="36" rx="18" fill="${palette.accent}" opacity="0.2" stroke="${palette.accent}" stroke-width="2" />
    <text x="0" y="-96" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="${palette.accent}" text-anchor="middle" letter-spacing="3">KONTENTOS VISUAL</text>

    <!-- Main Headline -->
    <text x="0" y="-10" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="900" fill="${palette.textPrimary}" text-anchor="middle" letter-spacing="-1">
      ${safeHeadline}
    </text>

    <!-- Decorative Accent Line -->
    <line x1="-100" y1="30" x2="100" y2="30" stroke="url(#accent-grad)" stroke-width="4" stroke-linecap="round" />

    <!-- Subtitle -->
    ${safeSubtitle ? `<text x="0" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="${subFontSize}" font-weight="500" fill="${palette.textSecondary}" text-anchor="middle" opacity="0.9">${safeSubtitle}</text>` : ''}
  </g>
</svg>`;
}

/**
 * Pure SVG generator for aesthetic gradient backdrops.
 */
export function generateGradientBackdropSvg(
  theme: string = 'neon_cyber',
  aspectRatio: AspectRatio = '9:16'
): string {
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.neon_cyber;
  const { width, height } = getResolutionForAspectRatio(aspectRatio);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="mesh-1" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${palette.bgPrimary}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="mesh-2" cx="80%" cy="70%" r="60%">
      <stop offset="0%" stop-color="${palette.accentGlow}" stop-opacity="0.30" />
      <stop offset="100%" stop-color="${palette.bgSecondary}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="${palette.bgPrimary}" />
  <rect width="${width}" height="${height}" fill="url(#mesh-1)" />
  <rect width="${width}" height="${height}" fill="url(#mesh-2)" />
</svg>`;
}

/**
 * Encodes SVG string to standard Data URI.
 */
export function encodeSvgToDataUri(svgString: string): string {
  const base64 = Buffer.from(svgString, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Procedural visual proposal factory.
 */
export function createProceduralVisualProposal(
  type: 'kinetic_title' | 'graphic_card' | 'gradient_backdrop',
  headline: string,
  subtitle: string = '',
  theme: string = 'vibrant_creator',
  aspectRatio: AspectRatio = '9:16',
  targetDuration: number = 4.0,
  targetBeatId?: string,
  startTime: number = 0
): VisualAssetProposal {
  const { width, height } = getResolutionForAspectRatio(aspectRatio);
  let svgContent: string;

  if (type === 'gradient_backdrop') {
    svgContent = generateGradientBackdropSvg(theme, aspectRatio);
  } else {
    svgContent = generateKineticTitleSvg(headline, subtitle, theme, aspectRatio);
  }

  const dataUri = encodeSvgToDataUri(svgContent);

  return {
    id: `prop-proc-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: type as any,
    title: `${headline || 'Procedural Visual'} (${theme.replace('_', ' ')})`,
    description: `Procedural ${type.replace('_', ' ')} visual card in ${aspectRatio} format`,
    previewUrl: dataUri,
    sourcePathOrData: dataUri,
    relevanceScore: 0.95,
    targetBeatId,
    suggestedStartTime: startTime,
    suggestedDuration: targetDuration,
    aspectRatio,
    fitMode: 'cover',
    kenBurns: getKenBurnsConfig('subtle_drift'),
    metadata: {
      format: 'svg',
      width,
      height,
      tags: ['procedural', theme, type, aspectRatio],
      promptUsed: headline
    },
    createdAt: new Date().toISOString()
  };
}
