import { BrandKit } from './types';
import { DEFAULT_BRAND_KITS } from './presets';

/**
 * Pure factory function to instantiate a BrandKit object with optional custom overrides.
 */
export function createCustomBrandKit(overrides: Partial<BrandKit> = {}): BrandKit {
  const base = DEFAULT_BRAND_KITS.minimal_neo;
  return {
    ...base,
    ...overrides,
    colors: {
      ...base.colors,
      ...(overrides.colors || {})
    },
    primaryFont: {
      ...base.primaryFont,
      ...(overrides.primaryFont || {})
    },
    secondaryFont: {
      ...base.secondaryFont,
      ...(overrides.secondaryFont || {})
    },
    watermark: {
      ...base.watermark,
      ...(overrides.watermark || {})
    }
  };
}
