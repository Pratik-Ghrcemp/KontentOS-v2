export interface ColorGradingProperties {
  brightness?: number; // 0 to 200 (100 = default)
  contrast?: number;   // 0 to 200 (100 = default)
  saturation?: number; // 0 to 200 (100 = default)
  exposure?: number;   // -100 to 100 (0 = default)
  hue?: number;        // 0 to 360 deg
  blur?: number;       // 0 to 20 px
  sepia?: number;      // 0 to 100 %
  grayscale?: number;  // 0 to 100 %
  lutId?: string;      // Preset LUT identifier
}

export interface LutPreset {
  id: string;
  name: string;
  category: string;
  color: string;
  cssFilter: string;
}
