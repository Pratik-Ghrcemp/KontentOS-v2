import { RenderRequest, RenderComposition, RenderLayer, RenderVideoLayer, RenderAudioLayer, RenderCaptionLayer, RenderTextLayer, RenderOverlayLayer } from './types';
import { platformPresets } from './presets';

export function buildRenderComposition(request: RenderRequest): RenderComposition {
  const preset = platformPresets[request.platformPresetId] || platformPresets['custom'];
  
  const layers: RenderLayer[] = [];

  // 1. Build Video Layers (with full transform, cssFilter, and keyframes)
  request.timelineClips.forEach((clip, index) => {
    const props = clip.properties || {};
    layers.push({
      id: clip.id || `video-${index}`,
      type: 'video',
      startTime: clip.start || 0,
      endTime: clip.end || 0,
      sourcePath: clip.assetId || request.mediaAssetId,
      sourceStart: clip.sourceIn ?? clip.start ?? 0,
      sourceEnd: clip.sourceOut ?? clip.end ?? 0,
      volume: 1.0,
      muted: false,
      effects: [],
      x: props.x ?? 0,
      y: props.y ?? 0,
      scale: props.scale ?? 100,
      rotation: props.rotation ?? 0,
      opacity: props.opacity ?? 100,
      zIndex: props.zIndex ?? 10,
      cssFilter: clip.cssFilter,
      speed: clip.speed ?? 1.0,
      reversed: clip.reversed ?? false,
      transitionIn: clip.transitionIn,
      transitionOut: clip.transitionOut,
      keyframes: clip.keyframes || []
    } as RenderVideoLayer);
  });

  // 2. Build Caption Layers
  if (request.captionMode === 'burn') {
    request.captions.forEach((cap, index) => {
      layers.push({
        id: cap.id || `caption-${index}`,
        type: 'caption',
        startTime: cap.start_time,
        endTime: cap.end_time,
        text: cap.text,
        style: request.captionStyle,
        x: cap.properties?.x ?? 0,
        y: cap.properties?.y ?? 150,
        scale: cap.properties?.scale ?? 100,
        opacity: cap.properties?.opacity ?? 100,
        zIndex: cap.properties?.zIndex ?? 25
      } as RenderCaptionLayer);
    });
  }

  // 3. Build Text & Graphic Overlays (Stickers, Freehand Drawings, Dynamic Text)
  request.textOverlays.forEach((txt, index) => {
    const props = txt.properties || {};
    const overlayType = props.type || (props.svgPath ? 'draw' : props.imageUrl ? 'sticker' : 'text');

    if (overlayType === 'draw' || overlayType === 'sticker') {
      layers.push({
        id: txt.id || `overlay-${index}`,
        type: 'overlay',
        overlayType,
        startTime: txt.start_time,
        endTime: txt.end_time,
        label: txt.text,
        x: props.x ?? 0,
        y: props.y ?? 0,
        scale: props.scale ?? 100,
        rotation: props.rotation ?? 0,
        opacity: props.opacity ?? 100,
        zIndex: props.zIndex ?? 20,
        svgPath: props.svgPath,
        imageUrl: props.imageUrl,
        color: props.color || '#ffffff',
        strokeWidth: props.strokeWidth || 4,
        keyframes: txt.keyframes || []
      } as RenderOverlayLayer);
    } else {
      layers.push({
        id: txt.id || `text-${index}`,
        type: 'text',
        startTime: txt.start_time,
        endTime: txt.end_time,
        text: txt.text,
        x: props.x ?? 0,
        y: props.y ?? 0,
        scale: props.scale ?? 100,
        rotation: props.rotation ?? 0,
        opacity: props.opacity ?? 100,
        fontSize: props.fontSize || 36,
        color: props.color || '#ffffff',
        fontFamily: props.fontFamily || request.brandKit?.primaryFont?.family || 'Inter',
        preset: props.preset || 'standard',
        zIndex: props.zIndex ?? 20,
        keyframes: txt.keyframes || []
      } as RenderTextLayer);
    }
  });

  // 4. Build Audio Layers (Primary Audio + BGM Tracks)
  if (request.audioSettings?.clips && Array.isArray(request.audioSettings.clips)) {
    request.audioSettings.clips.forEach((audioClip: any, index: number) => {
      layers.push({
        id: audioClip.id || `audio-${index}`,
        type: 'audio',
        startTime: audioClip.start || 0,
        endTime: audioClip.end || 0,
        sourcePath: audioClip.assetId || 'audio-source',
        sourceStart: audioClip.sourceIn || 0,
        sourceEnd: audioClip.sourceOut || (audioClip.end - audioClip.start),
        volume: (audioClip.properties?.volume ?? 100) / 100,
        ducking: false,
        fadeInDuration: audioClip.fadeInDuration || 0,
        fadeOutDuration: audioClip.fadeOutDuration || 0
      } as RenderAudioLayer);
    });
  }

  // 5. Build Watermark Layer
  if (request.brandKit?.watermark) {
    const wm = typeof request.brandKit.watermark === 'object' ? request.brandKit.watermark : {};
    layers.push({
      id: 'brand-watermark',
      type: 'watermark',
      startTime: 0,
      endTime: 9999,
      x: wm.position === 'top-left' || wm.position === 'bottom-left' ? -300 : 300,
      y: wm.position === 'top-left' || wm.position === 'top-right' ? -400 : 400,
      opacity: (wm.opacity ?? 0.8) * 100,
      zIndex: 50
    });
  }

  const mediaLayers = layers.filter(l => l.type !== 'watermark');
  const duration = mediaLayers.reduce((max, layer) => Math.max(max, layer.endTime || 0), 0);

  return {
    id: `comp-${Date.now()}`,
    projectId: request.projectTitle,
    timeline: {
      duration,
      layers
    },
    outputSpec: {
      width: preset.width,
      height: preset.height,
      fps: preset.fps,
      videoCodec: preset.recommendedCodec,
      audioCodec: preset.audioCodec,
      videoBitrate: `${parseInt(preset.bitrateRange || '4', 10) || 4}M`,
      format: 'mp4'
    },
    captionMode: request.captionMode,
    audioSettings: request.audioSettings,
    brandKit: request.brandKit
  };
}

export function validateRenderComposition(composition: RenderComposition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (composition.timeline.duration <= 0) {
    errors.push('Timeline duration must be greater than 0');
  }

  if (composition.outputSpec.width <= 0 || composition.outputSpec.height <= 0) {
    errors.push('Invalid output dimensions');
  }

  const videoLayers = composition.timeline.layers.filter(l => l.type === 'video');
  if (videoLayers.length === 0) {
    errors.push('Composition must have at least one video layer');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
