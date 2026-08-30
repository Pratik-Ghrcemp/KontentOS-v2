export interface BrandColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandFont {
  family: string;
  label: string;
  category: 'serif' | 'sans' | 'display' | 'handwriting';
}

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface BrandWatermark {
  logoUrl?: string;
  position: WatermarkPosition;
  opacity: number; // 0.0 to 1.0
  scale: number;   // 10 to 100 percentage
  margin: number;  // pixel offset from edges
}

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandColorPalette;
  primaryFont: BrandFont;
  secondaryFont: BrandFont;
  watermark: BrandWatermark;
}

export interface EffectiveStyle {
  fontFamily: string;
  color: string;
  fontSize: number;
  fontWeight: number | string;
  backgroundColor?: string;
}
