import { EditState } from '@/lib/editing/types';
import { RenderRequest, RenderQuality, RenderCaptionMode } from './types';
import { generateCssFilter } from '@/lib/editing/effects';

export interface RenderRequestBuilderOptions {
  mediaAssetId: string;
  platformPresetId: string;
  quality?: RenderQuality;
  captionMode?: RenderCaptionMode;
  projectTitle?: string;
  captionStyle?: any;
  audioSettings?: any;
  brandKit?: any;
  selectedLutId?: string;
}

/**
 * Pure factory function to construct a deterministic RenderRequest payload from canonical editState.
 */
export function buildRenderRequestFromEditState(
  editState: EditState,
  options: RenderRequestBuilderOptions
): RenderRequest {
  const videoClips = editState.items
    .filter(i => i.type === 'video')
    .map(item => ({
      id: item.id,
      trackId: item.trackId,
      assetId: item.assetId,
      start: item.start,
      end: item.end,
      duration: item.end - item.start,
      sourceIn: item.sourceIn ?? 0,
      sourceOut: item.sourceOut ?? (item.end - item.start),
      properties: {
        ...item.properties,
        speed: item.properties.speed ?? 1.0,
        reversed: item.properties.reversed ?? false
      },
      speed: item.properties.speed ?? 1.0,
      reversed: item.properties.reversed ?? false,
      transitionIn: item.properties.transitionIn,
      transitionOut: item.properties.transitionOut,
      cssFilter: generateCssFilter(item.properties, options.selectedLutId || 'none'),
      keyframes: item.keyframes
    }));

  const captionItems = editState.items
    .filter(i => i.type === 'caption')
    .map(item => ({
      id: item.id,
      text: item.content || item.label,
      start_time: item.start,
      end_time: item.end,
      properties: item.properties
    }));

  const textOverlays = editState.items
    .filter(i => i.type === 'text' || i.type === 'overlay')
    .map(item => ({
      id: item.id,
      text: item.content || item.label,
      start_time: item.start,
      end_time: item.end,
      properties: item.properties,
      keyframes: item.keyframes
    }));

  const audioClips = editState.items
    .filter(i => i.type === 'audio')
    .map(item => ({
      id: item.id,
      trackId: item.trackId,
      assetId: item.assetId,
      start: item.start,
      end: item.end,
      duration: item.end - item.start,
      sourceIn: item.sourceIn ?? 0,
      sourceOut: item.sourceOut ?? (item.end - item.start),
      fadeInDuration: item.properties.fadeInDuration ?? 0,
      fadeOutDuration: item.properties.fadeOutDuration ?? 0,
      properties: item.properties
    }));

  return {
    mediaAssetId: options.mediaAssetId,
    platformPresetId: options.platformPresetId,
    quality: options.quality || 'high',
    captionMode: options.captionMode || 'burn',
    timelineClips: videoClips,
    captions: captionItems,
    captionStyle: options.captionStyle || {},
    textOverlays,
    audioSettings: {
      ...(options.audioSettings || {}),
      clips: audioClips
    },
    brandKit: options.brandKit || {},
    projectTitle: options.projectTitle || 'Untitled Reel'
  };
}
