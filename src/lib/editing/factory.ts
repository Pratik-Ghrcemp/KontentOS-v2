import { TimelineItem } from './types';
import { StudioAsset } from '@/components/tabs/raw-studio/types';

export interface TimelineItemFactoryOptions {
  targetTrackId?: string;
  startTime?: number;
  customDuration?: number;
}

/**
 * Centralized Factory for instantiating TimelineItem instances from media assets.
 * Standardizes default properties, duration resolution, and track mapping.
 */
export function createTimelineItemFromAsset(
  asset: StudioAsset,
  options: TimelineItemFactoryOptions = {}
): TimelineItem {
  const clipId = `clip-${crypto.randomUUID()}`;
  const rawType = (asset.asset_type || 'video').toLowerCase();

  let itemType: 'video' | 'audio' = 'video';
  let defaultTrackId = 'track-video-1';
  let fallbackDuration = 5.0;

  if (rawType.includes('audio')) {
    itemType = 'audio';
    defaultTrackId = 'track-audio-1';
    fallbackDuration = 10.0;
  } else if (rawType.includes('image')) {
    itemType = 'video';
    defaultTrackId = 'track-video-1';
    fallbackDuration = 5.0;
  }

  const trackId = options.targetTrackId || defaultTrackId;
  const start = Math.max(0, options.startTime ?? 0);

  const duration = options.customDuration ?? (
    Number.isFinite(asset.duration_seconds) && (asset.duration_seconds ?? 0) > 0
      ? (asset.duration_seconds as number)
      : fallbackDuration
  );

  const end = start + duration;
  const label = asset.fileName || asset.projects?.title || `${itemType.toUpperCase()} Clip`;

  const defaultProperties: Record<string, any> = itemType === 'video'
    ? { x: 0, y: 0, scale: 100, opacity: 100, rotation: 0, volume: 100 }
    : { volume: 100 };

  return {
    id: clipId,
    trackId,
    type: itemType,
    start,
    end,
    sourceIn: 0,
    sourceOut: duration,
    assetId: asset.id,
    label,
    properties: defaultProperties
  };
}
