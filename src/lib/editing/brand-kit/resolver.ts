import { BrandKit, EffectiveStyle, WatermarkPosition } from './types';

/**
 * Pure style resolver following deterministic precedence order:
 * Brand Kit defaults -> Preset defaults -> Item explicit property overrides.
 */
export function resolveEffectiveItemStyle(
  itemProperties: Record<string, any> = {},
  brandKit?: BrandKit,
  presetDefaults: Partial<EffectiveStyle> = {}
): EffectiveStyle {
  const brandFont = brandKit?.primaryFont?.family || 'Inter';
  const brandColor = brandKit?.colors?.text || '#ffffff';

  return {
    fontFamily: itemProperties.fontFamily || presetDefaults.fontFamily || brandFont,
    color: itemProperties.color || presetDefaults.color || brandColor,
    fontSize: itemProperties.fontSize ?? presetDefaults.fontSize ?? 42,
    fontWeight: itemProperties.fontWeight ?? presetDefaults.fontWeight ?? 700,
    backgroundColor: itemProperties.backgroundColor || presetDefaults.backgroundColor
  };
}

/**
 * Calculates top-left pixel coordinates for watermark overlay on preview canvas.
 */
export function resolveWatermarkPosition(
  position: WatermarkPosition,
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
  margin = 16
): { x: number; y: number } {
  switch (position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: canvasWidth - logoWidth - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - logoHeight - margin };
    case 'bottom-right':
      return { x: canvasWidth - logoWidth - margin, y: canvasHeight - logoHeight - margin };
    case 'center':
      return { x: (canvasWidth - logoWidth) / 2, y: (canvasHeight - logoHeight) / 2 };
    default:
      return { x: canvasWidth - logoWidth - margin, y: margin };
  }
}
