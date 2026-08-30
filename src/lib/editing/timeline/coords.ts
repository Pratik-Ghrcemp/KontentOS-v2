/**
 * Converts a time in seconds into pixel displacement along a timeline track.
 */
export function timeToPixels(time: number, duration: number, containerWidth: number): number {
  if (duration <= 0 || containerWidth <= 0) return 0;
  const ratio = Math.min(Math.max(time / duration, 0), 1);
  return ratio * containerWidth;
}

/**
 * Converts a pixel displacement along a timeline track into a timestamp in seconds.
 */
export function pixelsToTime(px: number, containerWidth: number, duration: number): number {
  if (containerWidth <= 0 || duration <= 0) return 0;
  const ratio = Math.min(Math.max(px / containerWidth, 0), 1);
  return ratio * duration;
}

/**
 * Calculates pixels per second resolution for timeline tracks.
 */
export function getPixelsPerSecond(duration: number, containerWidth: number): number {
  if (duration <= 0) return 0;
  return containerWidth / duration;
}
