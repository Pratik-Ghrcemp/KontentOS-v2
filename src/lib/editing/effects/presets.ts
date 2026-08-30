import { LutPreset } from './types';

export const CINEMATIC_LUTS: Record<string, LutPreset> = {
  studio_enhance: {
    id: 'studio_enhance',
    name: '⚡ 4K Studio Clarity',
    category: 'Auto-Enhance',
    color: '#0ea5e9',
    cssFilter: 'contrast(1.06) brightness(1.03) saturate(1.08)'
  },
  kodak_portra: {
    id: 'kodak_portra',
    name: 'Kodak Portra 400',
    category: 'Warm Skin Tones',
    color: '#f59e0b',
    cssFilter: 'contrast(1.06) brightness(1.04) saturate(1.10) sepia(0.05)'
  },
  teal_orange: {
    id: 'teal_orange',
    name: 'Hollywood Teal & Orange',
    category: 'Blockbuster',
    color: '#0284c7',
    cssFilter: 'contrast(1.08) brightness(1.02) saturate(1.12)'
  },
  cinematic_moody: {
    id: 'cinematic_moody',
    name: 'Netflix Moody Drama',
    category: 'Cinematic',
    color: '#475569',
    cssFilter: 'contrast(1.10) brightness(0.98) saturate(1.04)'
  },
  studio_commercial: {
    id: 'studio_commercial',
    name: 'Apple Commercial',
    category: 'High-Key',
    color: '#ffffff',
    cssFilter: 'contrast(1.04) brightness(1.05) saturate(1.05)'
  },
  sunset_golden: {
    id: 'sunset_golden',
    name: 'Golden Hour Magic',
    category: 'Warm Glow',
    color: '#fbbf24',
    cssFilter: 'contrast(1.06) brightness(1.05) saturate(1.14) sepia(0.06)'
  },
  fuji_velvia: {
    id: 'fuji_velvia',
    name: 'Vibrant Pop',
    category: 'Color Vivid',
    color: '#ef4444',
    cssFilter: 'contrast(1.08) brightness(1.02) saturate(1.18)'
  },
  vintage_90s: {
    id: 'vintage_90s',
    name: 'Vintage 35mm Clean',
    category: 'Retro Film',
    color: '#d97706',
    cssFilter: 'contrast(1.04) brightness(1.02) saturate(0.96) sepia(0.08)'
  },
  warm_earth: {
    id: 'warm_earth',
    name: 'Sahara Sun-Baked',
    category: 'Warm Linen',
    color: '#c2652a',
    cssFilter: 'contrast(1.05) brightness(1.03) saturate(1.08) sepia(0.05)'
  },
  noir_classic: {
    id: 'noir_classic',
    name: 'Dramatic Noir B&W',
    category: 'Monochrome',
    color: '#000000',
    cssFilter: 'grayscale(1) contrast(1.16) brightness(1.02)'
  },
  none: {
    id: 'none',
    name: 'Raw / Natural Unfiltered',
    category: 'Original',
    color: '#64748b',
    cssFilter: ''
  }
};
