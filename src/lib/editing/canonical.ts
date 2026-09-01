import { TimelineItem } from './types';

/**
 * Canonical text resolver with deterministic fallback order:
 * properties.text -> content -> label -> ''
 */
export function resolveTextContent(item: Partial<TimelineItem> | any): string {
  if (!item) return '';
  if (item.properties?.text !== undefined && item.properties?.text !== null && item.properties.text !== '') {
    return String(item.properties.text);
  }
  if (item.content !== undefined && item.content !== null && item.content !== '') {
    return String(item.content);
  }
  if (item.label !== undefined && item.label !== null && item.label !== '') {
    return String(item.label);
  }
  return '';
}

/**
 * Canonical overlay descriptor for Preview, Builder, and FFmpeg compiler.
 */
export interface CanonicalOverlay {
  id: string;
  type: 'text' | 'sticker' | 'draw' | 'watermark';
  label: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  svgPath?: string;
  strokePoints?: Array<{ x: number; y: number }>;
  strokeColor?: string;
  strokeWidth?: number;
  imageUrl?: string;
}

export function resolveOverlayProperties(item: Partial<TimelineItem> | any): CanonicalOverlay {
  const props = item.properties || {};
  const isDraw = Boolean(props.svgPath || (props.strokePoints && props.strokePoints.length > 0));
  const isSticker = Boolean(props.imageUrl || (!isDraw && item.type === 'overlay' && !props.text));
  
  let type: 'text' | 'sticker' | 'draw' | 'watermark' = 'text';
  if (isDraw) type = 'draw';
  else if (isSticker) type = 'sticker';
  else if (item.type === 'watermark') type = 'watermark';

  return {
    id: item.id || `ov-${crypto.randomUUID()}`,
    type,
    label: item.label || 'Overlay',
    text: resolveTextContent(item),
    x: props.x ?? 0,
    y: props.y ?? 0,
    scale: props.scale ?? 100,
    rotation: props.rotation ?? 0,
    opacity: props.opacity ?? 100,
    zIndex: props.zIndex ?? 20,
    svgPath: props.svgPath,
    strokePoints: props.strokePoints,
    strokeColor: props.strokeColor || '#ef4444',
    strokeWidth: props.strokeWidth || 6,
    imageUrl: props.imageUrl
  };
}

/**
 * Canonical Watermark position to FFmpeg drawtext coordinates mapper.
 */
export function getWatermarkFfmpegCoordinates(position?: string, padding: number = 24): { x: string; y: string } {
  switch (position) {
    case 'top-left':
      return { x: `${padding}`, y: `${padding}` };
    case 'top-right':
      return { x: `w-tw-${padding}`, y: `${padding}` };
    case 'bottom-left':
      return { x: `${padding}`, y: `h-th-${padding}` };
    case 'center':
      return { x: `(w-tw)/2`, y: `(h-th)/2` };
    case 'bottom-right':
    default:
      return { x: `w-tw-${padding}`, y: `h-th-${padding}` };
  }
}

export interface CanonicalCaptionStyle {
  fontFamily?: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  preset?: 'classic' | 'hormozi' | 'minimal' | 'neon' | 'karaoke' | string;
  position?: 'top' | 'center' | 'bottom' | string;
  alignment?: 'left' | 'center' | 'right' | string;
  borderWidth?: number;
  borderColor?: string;
}

export function resolveCaptionStyle(
  itemStyle?: any,
  globalStyle?: any
): CanonicalCaptionStyle {
  const merged = { ...(globalStyle || {}), ...(itemStyle || {}) };

  let fontSize = 48;
  if (typeof merged.fontSize === 'number') {
    fontSize = merged.fontSize;
  } else if (typeof merged.size === 'number') {
    fontSize = Math.round(merged.size * 32);
  } else if (typeof merged.size === 'string') {
    const parsed = parseFloat(merged.size);
    if (!isNaN(parsed)) fontSize = Math.round(parsed * 32);
  }

  const fontColor = merged.color || merged.fontColor || '#ffffff';
  const preset = merged.preset || 'classic';
  const position = merged.position || 'bottom';
  const alignment = merged.alignment || 'center';

  return {
    fontFamily: merged.fontFamily || 'Inter',
    fontSize: Math.max(16, Math.min(120, fontSize)),
    fontColor,
    backgroundColor: merged.backgroundColor || '#000000',
    backgroundOpacity: merged.backgroundOpacity ?? 0.7,
    preset,
    position,
    alignment,
    borderWidth: merged.borderWidth,
    borderColor: merged.borderColor
  };
}

export function buildFfmpegCaptionDrawtextParams(
  style: Partial<CanonicalCaptionStyle>,
  text: string,
  startTime: number,
  endTime: number
): string {
  const escapedText = (text || '').replace(/'/g, "\\'").replace(/:/g, '\\:');
  const fontSize = style.fontSize || 48;
  const rawColor = style.fontColor || '#ffffff';
  const fontColor = rawColor.startsWith('#') ? rawColor.replace('#', '0x') : rawColor;

  // Position mapping
  let posY = 'h-th-180';
  if (style.position === 'top') posY = '180';
  else if (style.position === 'center') posY = '(h-th)/2';

  let posX = '(w-tw)/2';
  if (style.alignment === 'left') posX = '48';
  else if (style.alignment === 'right') posX = 'w-tw-48';

  // Preset mapping
  const preset = style.preset || 'classic';
  let boxParams = 'box=1:boxcolor=0x000000@0.7:boxborderw=10';
  let borderParams = '';

  if (preset === 'minimal') {
    boxParams = 'box=0';
  } else if (preset === 'hormozi') {
    boxParams = 'box=1:boxcolor=0x000000@0.85:boxborderw=12';
    borderParams = ':borderw=3:bordercolor=black';
  } else if (preset === 'neon') {
    boxParams = 'box=1:boxcolor=0x06b6d4@0.3:boxborderw=14';
    borderParams = ':borderw=2:bordercolor=0x06b6d4';
  }

  return `drawtext=text='${escapedText}':x=${posX}:y=${posY}:fontsize=${fontSize}:fontcolor=${fontColor}:${boxParams}${borderParams}:enable='between(t,${startTime},${endTime})'`;
}

/**
 * Generates video and audio intra-clip transition fade filters.
 */
export function buildFfmpegIntraClipFades(
  duration: number,
  transitionIn?: { type?: string; duration?: number },
  transitionOut?: { type?: string; duration?: number }
): { videoFades: string[]; audioFades: string[] } {
  const videoFades: string[] = [];
  const audioFades: string[] = [];

  const inDur = transitionIn?.duration ? Math.min(transitionIn.duration, duration / 2) : 0;
  const outDur = transitionOut?.duration ? Math.min(transitionOut.duration, duration / 2) : 0;

  if (inDur > 0) {
    videoFades.push(`fade=t=in:st=0:d=${inDur.toFixed(2)}`);
    audioFades.push(`afade=t=in:st=0:d=${inDur.toFixed(2)}`);
  }

  if (outDur > 0) {
    const outStart = Math.max(0, duration - outDur);
    videoFades.push(`fade=t=out:st=${outStart.toFixed(2)}:d=${outDur.toFixed(2)}`);
    audioFades.push(`afade=t=out:st=${outStart.toFixed(2)}:d=${outDur.toFixed(2)}`);
  }

  return { videoFades, audioFades };
}

/**
 * Generates linear interpolation expressions for keyframe position motion.
 */
export function buildFfmpegKeyframeCoordinateExpressions(
  baseX: number = 0,
  baseY: number = 0,
  keyframes?: Array<{ time: number; properties?: { x?: number; y?: number } }>
): { posX: string; posY: string } {
  if (!keyframes || keyframes.length < 2) {
    return {
      posX: `(w-tw)/2+${baseX}`,
      posY: `(h-th)/2+${baseY}`
    };
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const k1 = sorted[0];
  const k2 = sorted[sorted.length - 1];

  const t1 = k1.time;
  const t2 = Math.max(t1 + 0.01, k2.time);
  const x1 = k1.properties?.x ?? baseX;
  const x2 = k2.properties?.x ?? baseX;
  const y1 = k1.properties?.y ?? baseY;
  const y2 = k2.properties?.y ?? baseY;

  if (x1 === x2 && y1 === y2) {
    return {
      posX: `(w-tw)/2+${x1}`,
      posY: `(h-th)/2+${y1}`
    };
  }

  const exprX = `(w-tw)/2+if(lte(t,${t1.toFixed(2)}),${x1},if(gte(t,${t2.toFixed(2)}),${x2},${x1}+(${x2}-${x1})*(t-${t1.toFixed(2)})/(${t2.toFixed(2)}-${t1.toFixed(2)})))`;
  const exprY = `(h-th)/2+if(lte(t,${t1.toFixed(2)}),${y1},if(gte(t,${t2.toFixed(2)}),${y2},${y1}+(${y2}-${y1})*(t-${t1.toFixed(2)})/(${t2.toFixed(2)}-${t1.toFixed(2)})))`;

  return { posX: exprX, posY: exprY };
}

export interface CanonicalAudioMixOptions {
  autoDuck?: boolean;
  voiceCleanup?: boolean;
  noiseReduction?: boolean;
  primaryVol?: number; // 0 - 100
  bgmVol?: number;     // 0 - 100
  hasPrimaryAudio: boolean;
  hasBgmAudio: boolean;
}

/**
 * Compiles audio mixing filter graph supporting speech-reactive sidechain ducking,
 * voice cleanup DSP (highpass + peaking EQ + compressor + afftdn), master volume scaling,
 * and safe fallback routing.
 */
export function buildFfmpegAudioMixFilterGraph(
  primaryAudioPad: string,
  bgmPads: string[],
  options: CanonicalAudioMixOptions
): { filterGraphLines: string[]; finalAudioPad: string } {
  const filterGraphLines: string[] = [];
  const primaryScale = Math.max(0, Math.min(2.0, (options.primaryVol ?? 100) / 100));
  const bgmScale = Math.max(0, Math.min(2.0, (options.bgmVol ?? 50) / 100));

  let currentPrimaryPad = primaryAudioPad;

  // Step 1: Voice Cleanup DSP Chain (Applied to Primary/Dialogue BEFORE sidechain split and mixing)
  if (options.hasPrimaryAudio && (options.voiceCleanup || options.noiseReduction)) {
    const dspFilters: string[] = [];
    if (options.voiceCleanup) {
      dspFilters.push('highpass=f=80', 'equalizer=f=3000:width_type=h:width=1000:g=3', 'acompressor=threshold=0.125:ratio=3:attack=15:release=120');
    }
    if (options.noiseReduction) {
      dspFilters.push('afftdn=nf=-25');
    }
    filterGraphLines.push(`[${currentPrimaryPad}]${dspFilters.join(',')}[a_pri_cleaned]`);
    currentPrimaryPad = 'a_pri_cleaned';
  }

  // If no BGM audio exists, just scale primary audio (if needed) and return
  if (bgmPads.length === 0) {
    if (primaryScale !== 1.0) {
      filterGraphLines.push(`[${currentPrimaryPad}]volume=${primaryScale.toFixed(2)}[a_pri_scaled]`);
      return { filterGraphLines, finalAudioPad: 'a_pri_scaled' };
    }
    return { filterGraphLines, finalAudioPad: currentPrimaryPad };
  }

  // Combine multiple BGM pads if more than 1
  let bgmCombinedPad = bgmPads[0].replace(/^\[|\]$/g, '');
  if (bgmPads.length > 1) {
    filterGraphLines.push(`${bgmPads.join('')}amix=inputs=${bgmPads.length}:duration=longest[a_bgm_raw]`);
    bgmCombinedPad = 'a_bgm_raw';
  }

  // Apply BGM master volume scale
  filterGraphLines.push(`[${bgmCombinedPad}]volume=${bgmScale.toFixed(2)}[a_bgm_scaled]`);
  bgmCombinedPad = 'a_bgm_scaled';

  // If no primary audio exists, return scaled BGM
  if (!options.hasPrimaryAudio) {
    return { filterGraphLines, finalAudioPad: bgmCombinedPad };
  }

  // Scale primary audio
  let scaledPrimaryPad = currentPrimaryPad;
  if (primaryScale !== 1.0) {
    filterGraphLines.push(`[${currentPrimaryPad}]volume=${primaryScale.toFixed(2)}[a_pri_scaled]`);
    scaledPrimaryPad = 'a_pri_scaled';
  }

  // Case 1: Speech-Reactive Auto Ducking Enabled
  if (options.autoDuck) {
    filterGraphLines.push(`[${scaledPrimaryPad}]asplit=2[a_main][a_sidechain]`);
    filterGraphLines.push(`[${bgmCombinedPad}][a_sidechain]sidechaincompress=threshold=0.125:ratio=4:attack=50:release=300[a_bgm_ducked]`);
    filterGraphLines.push(`[a_main][a_bgm_ducked]amix=inputs=2:duration=first:dropout_transition=2[a_mixed]`);
    return { filterGraphLines, finalAudioPad: 'a_mixed' };
  }

  // Case 2: Standard Linear Mix
  filterGraphLines.push(`[${scaledPrimaryPad}][${bgmCombinedPad}]amix=inputs=2:duration=first:dropout_transition=2[a_mixed]`);
  return { filterGraphLines, finalAudioPad: 'a_mixed' };
}



