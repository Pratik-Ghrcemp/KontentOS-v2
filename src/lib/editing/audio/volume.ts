/**
 * Converts a percentage volume (0-100) to a linear gain multiplier (0.0 - 1.0).
 */
export function volumeToGain(volume: number): number {
  const clamped = Math.max(0, Math.min(100, volume));
  return clamped / 100;
}

/**
 * Converts linear gain multiplier (0.0 - 1.0) to decibels (dB).
 */
export function gainToDb(gain: number): number {
  if (gain <= 0) return -60;
  return 20 * Math.log10(gain);
}

/**
 * Converts decibels (dB) to linear gain multiplier.
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Calculates audio fade-in and fade-out gain multiplier at a specific timestamp.
 */
export function calculateFadeGain(
  currentTime: number,
  itemStart: number,
  itemEnd: number,
  fadeInDuration = 0.0,
  fadeOutDuration = 0.0
): number {
  const clipDuration = Math.max(0, itemEnd - itemStart);
  if (clipDuration <= 0) return 1.0;

  // Clamp fade durations to clip duration
  const safeFadeIn = Math.min(Math.max(0, fadeInDuration), clipDuration);
  const safeFadeOut = Math.min(Math.max(0, fadeOutDuration), clipDuration - safeFadeIn);

  if (safeFadeIn > 0 && currentTime < itemStart + safeFadeIn) {
    const elapsed = Math.max(0, currentTime - itemStart);
    return Math.min(1.0, elapsed / safeFadeIn);
  }

  if (safeFadeOut > 0 && currentTime > itemEnd - safeFadeOut) {
    const remaining = Math.max(0, itemEnd - currentTime);
    return Math.min(1.0, remaining / safeFadeOut);
  }

  return 1.0;
}

/**
 * Calculates effective combined gain considering clip volume, track mute, track volume, fade gain, and ducking attenuation.
 */
export function calculateEffectiveVolume(
  clipVolume: number = 100,
  trackVolume: number = 100,
  trackMuted: boolean = false,
  duckingGain: number = 1.0,
  fadeGain: number = 1.0
): number {
  if (trackMuted) return 0;
  const clipGain = volumeToGain(clipVolume);
  const trackGain = volumeToGain(trackVolume);
  return clipGain * trackGain * duckingGain * Math.max(0, Math.min(1, fadeGain));
}
