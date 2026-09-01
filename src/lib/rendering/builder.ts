import { EditState } from '@/lib/editing/types';
import { RenderRequest, RenderQuality, RenderCaptionMode } from './types';
import { generateCssFilter } from '@/lib/editing/effects';

import { resolveTextContent, resolveOverlayProperties, resolveCaptionStyle } from '@/lib/editing/canonical';

export interface RenderRequestBuilderOptions {
  projectId?: string;
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
    .map(item => {
      const isTrackMuted = editState.tracks?.some(t => t.id === item.trackId && t.muted);
      const isMuted = Boolean(item.properties?.muted || isTrackMuted);

      return {
        id: item.id,
        trackId: item.trackId,
        assetId: item.assetId,
        start: item.start,
        end: item.end,
        duration: item.end - item.start,
        sourceIn: item.sourceIn ?? 0,
        sourceOut: item.sourceOut ?? (item.end - item.start),
        muted: isMuted,
        properties: {
          ...item.properties,
          muted: isMuted,
          speed: item.properties.speed ?? 1.0,
          reversed: item.properties.reversed ?? false
        },
        speed: item.properties.speed ?? 1.0,
        reversed: item.properties.reversed ?? false,
        transitionIn: item.properties.transitionIn,
        transitionOut: item.properties.transitionOut,
        cssFilter: generateCssFilter(item.properties, options.selectedLutId || 'none'),
        keyframes: item.keyframes
      };
    });

  const resolvedGlobalCaptionStyle = resolveCaptionStyle(undefined, options.captionStyle);

  const captionItems = editState.items
    .filter(i => i.type === 'caption')
    .map(item => ({
      id: item.id,
      text: resolveTextContent(item),
      start_time: item.start,
      end_time: item.end,
      style: resolveCaptionStyle(item.properties, options.captionStyle),
      properties: item.properties
    }));

  const textOverlays = editState.items
    .filter(i => i.type === 'text' || i.type === 'overlay')
    .map(item => {
      const canonical = resolveOverlayProperties(item);
      return {
        id: item.id,
        type: item.type,
        overlayType: canonical.type,
        label: item.label || canonical.label,
        text: canonical.text,
        imageUrl: canonical.imageUrl,
        strokePoints: canonical.strokePoints,
        strokeColor: canonical.strokeColor,
        strokeWidth: canonical.strokeWidth,
        start_time: item.start,
        end_time: item.end,
        x: canonical.x,
        y: canonical.y,
        scale: canonical.scale,
        rotation: canonical.rotation,
        fontSize: item.properties?.fontSize || 36,
        color: item.properties?.color || '#ffffff',
        fontFamily: item.properties?.fontFamily || 'Inter',
        preset: item.properties?.preset || 'standard',
        zIndex: item.properties?.zIndex ?? 20,
        properties: item.properties,
        keyframes: item.keyframes
      };
    });

  const audioClips = editState.items
    .filter(i => i.type === 'audio')
    .map(item => {
      const isAudioTrackMuted = editState.tracks?.some(t => t.id === item.trackId && t.muted);
      const isAudioMuted = Boolean(item.properties?.muted || isAudioTrackMuted);

      return {
        id: item.id,
        trackId: item.trackId,
        assetId: item.assetId,
        start: item.start,
        end: item.end,
        duration: item.end - item.start,
        sourceIn: item.sourceIn ?? 0,
        sourceOut: item.sourceOut ?? (item.end - item.start),
        muted: isAudioMuted,
        fadeInDuration: item.properties.fadeInDuration ?? 0,
        fadeOutDuration: item.properties.fadeOutDuration ?? 0,
        properties: {
          ...item.properties,
          muted: isAudioMuted
        }
      };
    });

  return {
    projectId: options.projectId,
    mediaAssetId: options.mediaAssetId,
    platformPresetId: options.platformPresetId,
    quality: options.quality || 'high',
    captionMode: options.captionMode || 'burn',
    timelineClips: videoClips,
    captions: captionItems,
    captionStyle: resolvedGlobalCaptionStyle,
    textOverlays,
    audioSettings: {
      ...(options.audioSettings || {}),
      clips: audioClips
    },
    brandKit: options.brandKit || {},
    projectTitle: options.projectTitle || 'Untitled Reel'
  };
}
