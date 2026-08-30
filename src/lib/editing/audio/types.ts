export interface AudioClipProperties {
  volume: number; // 0 to 100
  fadeIn?: number; // duration in seconds
  fadeOut?: number; // duration in seconds
  muted?: boolean;
  pan?: number; // -1 (left) to +1 (right)
}

export interface WaveformData {
  peaks: number[]; // Normalized 0.0 to 1.0 values
  sampleRate: number;
  duration: number;
}

export interface DuckingConfig {
  duckingDb: number; // Attenuation in dB (e.g. -12dB)
  threshold: number; // Volume threshold percentage
  attackMs: number;  // Fade down duration
  releaseMs: number; // Fade up duration
}

export interface DuckingGainPoint {
  time: number;
  gain: number; // Multiplier 0.0 to 1.0
}
