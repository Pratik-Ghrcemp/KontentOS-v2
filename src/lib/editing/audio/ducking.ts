import { TimelineItem } from '../types';
import { DuckingConfig, DuckingGainPoint } from './types';
import { dbToGain } from './volume';

export const defaultConfiging: DuckingConfig = {
  duckingDb: -10, // Attenuate by 10dB during speech
  threshold: 0,
  attackMs: 200,
  releaseMs: 300
};

/**
 * Pure calculation to compute background music (BGM) ducking gain factor at a specific timeline timestamp.
 * Lowers BGM volume when voice clips on primary audio tracks are active.
 */
export function calculateDuckingGain(
  time: number,
  primaryAudioClips: TimelineItem[],
  config: DuckingConfig = defaultConfiging
): number {
  if (primaryAudioClips.length === 0) return 1.0;

  const isVoiceActive = primaryAudioClips.some(
    clip => time >= clip.start && time <= clip.end
  );

  if (!isVoiceActive) return 1.0;

  const duckedGain = dbToGain(config.duckingDb);
  return Math.max(0.1, Math.min(1.0, duckedGain));
}

/**
 * Computes deterministic BGM ducking curve points across sequence duration.
 */
export function calculateDuckingGainCurve(
  duration: number,
  primaryAudioClips: TimelineItem[],
  config: DuckingConfig = defaultConfiging,
  stepSeconds = 0.5
): DuckingGainPoint[] {
  const points: DuckingGainPoint[] = [];
  if (duration <= 0) return points;

  for (let t = 0; t <= duration; t += stepSeconds) {
    const gain = calculateDuckingGain(t, primaryAudioClips, config);
    points.push({ time: Number(t.toFixed(2)), gain: Number(gain.toFixed(3)) });
  }

  return points;
}
