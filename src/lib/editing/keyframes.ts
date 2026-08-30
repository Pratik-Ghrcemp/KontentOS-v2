import { TimelineItem, TimelineItemProperties, Keyframe } from './types';

/**
 * Default fallback values for transform and appearance properties.
 */
export const DEFAULT_PROPERTY_VALUES: Record<string, number> = {
  x: 0,
  y: 0,
  scale: 100,
  opacity: 1.0,
  rotation: 0,
};

/**
 * Pure Linear Interpolation Helper (lerp)
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Pure evaluation function for calculating interpolated properties of a timeline clip at currentTime.
 * Supports linear interpolation for position (x, y), scale, opacity, and rotation.
 */
export function evaluateInterpolatedProperties(
  item: TimelineItem,
  currentTime: number
): TimelineItemProperties {
  const baseProperties = { ...item.properties };

  if (!item.keyframes || item.keyframes.length === 0) {
    return baseProperties;
  }

  // Convert timeline currentTime to clip-relative time offset
  const clipTime = Math.max(0, currentTime - item.start);

  // Sort keyframes chronologically
  const sortedKeyframes = [...item.keyframes].sort((a, b) => a.time - b.time);
  const firstKeyframe = sortedKeyframes[0];
  const lastKeyframe = sortedKeyframes[sortedKeyframes.length - 1];

  // Before first keyframe -> hold first keyframe values
  if (clipTime <= firstKeyframe.time) {
    return {
      ...baseProperties,
      ...firstKeyframe.properties
    };
  }

  // After last keyframe -> hold last keyframe values
  if (clipTime >= lastKeyframe.time) {
    return {
      ...baseProperties,
      ...lastKeyframe.properties
    };
  }

  // Find surrounding keyframe interval [k1, k2]
  let k1 = firstKeyframe;
  let k2 = lastKeyframe;

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (clipTime >= sortedKeyframes[i].time && clipTime <= sortedKeyframes[i + 1].time) {
      k1 = sortedKeyframes[i];
      k2 = sortedKeyframes[i + 1];
      break;
    }
  }

  const duration = k2.time - k1.time;
  const t = duration > 0 ? (clipTime - k1.time) / duration : 0;

  const interpolatedProps: Record<string, any> = { ...baseProperties };

  // Keys present in either keyframe
  const keysToInterpolate = new Set([
    ...Object.keys(k1.properties),
    ...Object.keys(k2.properties)
  ]);

  keysToInterpolate.forEach(key => {
    const val1 = k1.properties[key] ?? baseProperties[key] ?? DEFAULT_PROPERTY_VALUES[key] ?? 0;
    const val2 = k2.properties[key] ?? baseProperties[key] ?? DEFAULT_PROPERTY_VALUES[key] ?? 0;

    if (typeof val1 === 'number' && typeof val2 === 'number') {
      const interpolatedVal = lerp(val1, val2, t);
      // Round position and scale to 2 decimals for precision, keep smooth float for opacity
      interpolatedProps[key] = key === 'opacity' ? Number(interpolatedVal.toFixed(3)) : Number(interpolatedVal.toFixed(2));
    } else {
      interpolatedProps[key] = t >= 0.5 ? k2.properties[key] : k1.properties[key];
    }
  });

  return interpolatedProps;
}
