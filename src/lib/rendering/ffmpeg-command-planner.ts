import { RenderComposition, FfmpegCommandPlan, RenderVideoLayer, RenderTextLayer, RenderOverlayLayer, RenderAudioLayer, RenderCaptionLayer } from './types';
import { getWatermarkFfmpegCoordinates, buildFfmpegCaptionDrawtextParams, buildFfmpegIntraClipFades, buildFfmpegKeyframeCoordinateExpressions, buildFfmpegAudioMixFilterGraph } from '../editing/canonical';
import { getFfmpegExecutablePath } from './workers/local-ffmpeg-worker';
import { spawnSync } from 'child_process';
import * as fs from 'fs';

const audioStreamPresenceCache = new Map<string, boolean>();

function sourceHasAudioStream(sourcePath: string): boolean {
  if (audioStreamPresenceCache.has(sourcePath)) {
    return audioStreamPresenceCache.get(sourcePath)!;
  }
  if (!fs.existsSync(sourcePath)) {
    audioStreamPresenceCache.set(sourcePath, false);
    return false;
  }
  try {
    const ffmpegBin = getFfmpegExecutablePath();
    const res = spawnSync(ffmpegBin, ['-i', sourcePath], { encoding: 'utf8', timeout: 4000 });
    const hasAudio = /Stream #.*: Audio:/.test(res.stderr || '');
    audioStreamPresenceCache.set(sourcePath, hasAudio);
    return hasAudio;
  } catch (e) {
    audioStreamPresenceCache.set(sourcePath, false);
    return false;
  }
}

function convertCssFilterToFfmpeg(cssFilter?: string): string[] {
  if (!cssFilter || !cssFilter.trim()) return [];
  const filters: string[] = [];

  // Grayscale / Monochrome
  if (cssFilter.includes('grayscale(')) {
    const m = cssFilter.match(/grayscale\(([\d.]+)\)/);
    if (m && parseFloat(m[1]) > 0) {
      filters.push('hue=s=0');
    }
  }

  // Box blur
  if (cssFilter.includes('blur(')) {
    const m = cssFilter.match(/blur\((\d+)px\)/);
    if (m && parseInt(m[1], 10) > 0) {
      const radius = Math.min(20, Math.max(1, parseInt(m[1], 10)));
      filters.push(`boxblur=lr=${radius}:lp=1`);
    }
  }

  // Brightness, Contrast & Saturation
  let contrast = 1.0;
  let brightness = 0.0;
  let saturation = 1.0;
  let hasEq = false;

  const cMatch = cssFilter.match(/contrast\(([\d.]+)\)/);
  if (cMatch) {
    contrast = parseFloat(cMatch[1]);
    hasEq = true;
  }

  const bMatch = cssFilter.match(/brightness\(([\d.]+)\)/);
  if (bMatch) {
    const b = parseFloat(bMatch[1]);
    brightness = (b - 1.0) * 0.4;
    hasEq = true;
  }

  const sMatch = cssFilter.match(/saturate\(([\d.]+)\)/);
  if (sMatch) {
    saturation = parseFloat(sMatch[1]);
    hasEq = true;
  }

  if (hasEq) {
    filters.push(`eq=contrast=${contrast.toFixed(2)}:brightness=${brightness.toFixed(2)}:saturation=${saturation.toFixed(2)}`);
  }

  // Hue rotate
  const hMatch = cssFilter.match(/hue-rotate\((-?[\d.]+)deg\)/);
  if (hMatch && !cssFilter.includes('grayscale')) {
    const h = parseFloat(hMatch[1]);
    filters.push(`hue=h=${h}`);
  }

  // Sepia
  const sepMatch = cssFilter.match(/sepia\(([\d.]+)\)/);
  if (sepMatch && parseFloat(sepMatch[1]) > 0.1 && !cssFilter.includes('grayscale')) {
    filters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131');
  }

  return filters;
}

function normalizeHexColor(color?: string): string {
  const raw = (color || '#ffffff').trim();
  const hex = raw.startsWith('#') ? raw.slice(1) : raw.replace(/^0x/i, '');
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `0x${hex.split('').map(ch => ch + ch).join('')}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `0x${hex}`;
  }
  return '0xffffff';
}

function buildDrawStrokeFilter(
  inputPad: string,
  outputPad: string,
  ov: RenderOverlayLayer,
  width: number,
  height: number
): string | null {
  const points = (ov.strokePoints || []).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (points.length === 0) return null;

  const strokeWidth = Math.max(2, Math.min(64, Math.round(ov.strokeWidth || 5)));
  const opacity = Math.max(0, Math.min(1, (ov.opacity ?? 100) / 100));
  const color = `${normalizeHexColor(ov.strokeColor || ov.color)}@${opacity.toFixed(2)}`;
  const enable = `between(t\\,${ov.startTime}\\,${ov.endTime})`;
  const offsetX = Math.round(ov.x || 0);
  const offsetY = Math.round(ov.y || 0);
  const scale = Math.max(0.1, (ov.scale || 100) / 100);
  const rotation = ((ov.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const toPixel = (point: { x: number; y: number }) => {
    const isNormalized = point.x >= 0 && point.x <= 1000 && point.y >= 0 && point.y <= 1000;
    const x = isNormalized ? (point.x / 1000) * width : point.x;
    const y = isNormalized ? (point.y / 1000) * height : point.y;
    const centeredX = (x - width / 2) * scale;
    const centeredY = (y - height / 2) * scale;
    const transformedX = centeredX * cos - centeredY * sin + width / 2 + offsetX;
    const transformedY = centeredX * sin + centeredY * cos + height / 2 + offsetY;
    return {
      x: Math.round(transformedX - strokeWidth / 2),
      y: Math.round(transformedY - strokeWidth / 2)
    };
  };

  const marks: Array<{ x: number; y: number }> = [];
  const maxMarks = 450;
  const step = Math.max(2, Math.round(strokeWidth * 0.65));

  for (let i = 0; i < points.length && marks.length < maxMarks; i++) {
    const current = toPixel(points[i]);
    const previous = i > 0 ? toPixel(points[i - 1]) : current;
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const distance = Math.hypot(dx, dy);
    const count = Math.max(1, Math.ceil(distance / step));

    for (let j = 0; j <= count && marks.length < maxMarks; j++) {
      const t = count === 0 ? 1 : j / count;
      marks.push({
        x: Math.round(previous.x + dx * t),
        y: Math.round(previous.y + dy * t)
      });
    }
  }

  if (marks.length === 0) return null;

  const chain = marks
    .map(mark => `drawbox=x=${mark.x}:y=${mark.y}:w=${strokeWidth}:h=${strokeWidth}:color=${color}:t=fill:enable='${enable}'`)
    .join(',');

  return `[${inputPad}]${chain}[${outputPad}]`;
}

export function createFfmpegCommandPlan(composition: RenderComposition): FfmpegCommandPlan {
  const inputs: string[] = [];
  const filterGraph: string[] = [];
  const outputs: string[] = [];
  
  // 1. Process layers
  const videoLayers = composition.timeline.layers.filter(l => l.type === 'video') as RenderVideoLayer[];
  const textLayers = composition.timeline.layers.filter(l => l.type === 'text') as RenderTextLayer[];
  const overlayLayers = composition.timeline.layers.filter(l => l.type === 'overlay') as RenderOverlayLayer[];
  const captionLayers = composition.timeline.layers.filter(l => l.type === 'caption') as RenderCaptionLayer[];
  const audioLayers = composition.timeline.layers.filter(l => l.type === 'audio') as RenderAudioLayer[];
  const watermarkLayers = composition.timeline.layers.filter(l => l.type === 'watermark');

  // Sort video layers sequentially by startTime
  videoLayers.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  // Deduplicate unique input file paths
  const uniqueInputPaths: string[] = [];
  const inputIndexMap = new Map<string, number>();

  videoLayers.forEach((layer) => {
    if (!inputIndexMap.has(layer.sourcePath)) {
      inputIndexMap.set(layer.sourcePath, uniqueInputPaths.length);
      uniqueInputPaths.push(layer.sourcePath);
    }
  });

  audioLayers.forEach((layer) => {
    if (layer.sourcePath && !inputIndexMap.has(layer.sourcePath)) {
      inputIndexMap.set(layer.sourcePath, uniqueInputPaths.length);
      uniqueInputPaths.push(layer.sourcePath);
    }
  });

  overlayLayers.forEach((ov) => {
    if (ov.imageUrl && fs.existsSync(ov.imageUrl) && !inputIndexMap.has(ov.imageUrl)) {
      inputIndexMap.set(ov.imageUrl, uniqueInputPaths.length);
      uniqueInputPaths.push(ov.imageUrl);
    }
  });

  uniqueInputPaths.forEach((pathStr) => {
    inputs.push('-i', pathStr);
  });

  const width = composition.outputSpec.width || 1080;
  const height = composition.outputSpec.height || 1920;
  const fps = composition.outputSpec.fps || 30;

  // 2. Process each video clip (Trim, Speed, Scale, Crop, SAR normalization, Effects & Audio)
  videoLayers.forEach((layer, idx) => {
    const inIdx = inputIndexMap.get(layer.sourcePath) ?? 0;
    const start = Math.max(0, layer.sourceStart ?? 0);
    const end = Math.max(start + 0.1, layer.sourceEnd ?? (start + (layer.endTime - layer.startTime)));
    const duration = Math.max(0.1, end - start);

    // Video filter chain for this clip
    let vFilter = `[${inIdx}:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS`;
    if (layer.speed && layer.speed !== 1.0) {
      vFilter += `,setpts=(1/${layer.speed})*PTS`;
    }
    vFilter += `,scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,fps=${fps}`;

    const appliedEffects = convertCssFilterToFfmpeg(layer.cssFilter);
    if (appliedEffects.length > 0) {
      vFilter += `,${appliedEffects.join(',')}`;
    }

    const { videoFades, audioFades } = buildFfmpegIntraClipFades(
      duration,
      layer.transitionIn,
      layer.transitionOut
    );
    if (videoFades.length > 0) {
      vFilter += `,${videoFades.join(',')}`;
    }

    vFilter += `[v_${idx}]`;
    filterGraph.push(vFilter);

    // Audio stream for this clip (extract if exists and not muted, else synthesize silence)
    const hasAudio = sourceHasAudioStream(layer.sourcePath);
    if (hasAudio && !layer.muted) {
      const vol = layer.volume ?? 1.0;
      let aFilter = `[${inIdx}:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,volume=${vol}`;
      if (audioFades.length > 0) {
        aFilter += `,${audioFades.join(',')}`;
      }
      aFilter += `,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a_${idx}]`;
      filterGraph.push(aFilter);
    } else {
      filterGraph.push(`aevalsrc=0:d=${duration}:s=48000:c=stereo[a_${idx}]`);
    }
  });

  // 3. Concatenate all video + audio clips
  let currentVideoPad = 'v_0';
  let currentAudioPad = 'a_0';

  if (videoLayers.length > 1) {
    const concatArgs = videoLayers.map((_, i) => `[v_${i}][a_${i}]`).join('');
    filterGraph.push(`${concatArgs}concat=n=${videoLayers.length}:v=1:a=1[v_concat][a_concat]`);
    currentVideoPad = 'v_concat';
    currentAudioPad = 'a_concat';
  } else if (videoLayers.length === 1) {
    currentVideoPad = 'v_0';
    currentAudioPad = 'a_0';
  }

  // 4. Text Overlays (Title, Lower Third, Kinetic Text with Keyframe Motion)
  textLayers.forEach((txt, idx) => {
    const textPad = `txt_${idx}`;
    const escapedText = (txt.text || '').replace(/'/g, "\\'").replace(/:/g, '\\:');
    const { posX, posY } = buildFfmpegKeyframeCoordinateExpressions(txt.x || 0, txt.y || 0, txt.keyframes);
    const fontSize = txt.fontSize || 42;
    const fontColor = (txt.color || '#ffffff').replace('#', '0x');
    
    filterGraph.push(`[${currentVideoPad}]drawtext=text='${escapedText}':x=${posX}:y=${posY}:fontsize=${fontSize}:fontcolor=${fontColor}:box=1:boxcolor=0x000000@0.6:boxborderw=10:enable='between(t,${txt.startTime},${txt.endTime})'[${textPad}]`);
    currentVideoPad = textPad;
  });

  // 5. Captions Burn-In (Dynamic Subtitles with Preset & Style Parity)
  if (composition.captionMode === 'burn' && captionLayers.length > 0) {
    captionLayers.forEach((cap, idx) => {
      const capPad = `cap_${idx}`;
      const capStyle = cap.style || {};
      const drawtextExpr = buildFfmpegCaptionDrawtextParams(
        capStyle,
        cap.text,
        cap.startTime,
        cap.endTime
      );
      filterGraph.push(`[${currentVideoPad}]${drawtextExpr}[${capPad}]`);
      currentVideoPad = capPad;
    });
  }

  // 6. Graphic / Sticker / Badge / Draw Overlays
  overlayLayers.forEach((ov, idx) => {
    const ovPad = `ov_${idx}`;
    const escaped = (ov.text || ov.label || 'STICKER').replace(/'/g, "\\'").replace(/:/g, '\\:');
    const posX = `(w-tw)/2+${ov.x || 0}`;
    const posY = `(h-th)/2+${ov.y || 0}`;

    if (ov.overlayType === 'draw' && ov.strokePoints?.length) {
      const drawFilter = buildDrawStrokeFilter(currentVideoPad, ovPad, ov, width, height);
      if (drawFilter) {
        filterGraph.push(drawFilter);
      } else {
        filterGraph.push(`[${currentVideoPad}]drawtext=text='${escaped}':x=${posX}:y=${posY}:fontsize=48:fontcolor=${normalizeHexColor(ov.color)}:box=0:enable='between(t,${ov.startTime},${ov.endTime})'[${ovPad}]`);
      }
    } else if (ov.imageUrl && inputIndexMap.has(ov.imageUrl)) {
      const imgInIdx = inputIndexMap.get(ov.imageUrl);
      const scaleW = Math.round((ov.scale || 100) * 2);
      filterGraph.push(`[${imgInIdx}:v]scale=${scaleW}:-1,format=rgba[ov_img_${idx}]`);
      filterGraph.push(`[${currentVideoPad}][ov_img_${idx}]overlay=x=(W-w)/2+${ov.x || 0}:y=(H-h)/2+${ov.y || 0}:enable='between(t,${ov.startTime},${ov.endTime})'[${ovPad}]`);
    } else {
      // Clean sticker/draw text (Transparent, no purple background box!)
      filterGraph.push(`[${currentVideoPad}]drawtext=text='${escaped}':x=${posX}:y=${posY}:fontsize=48:fontcolor=0xffffff:box=0:enable='between(t,${ov.startTime},${ov.endTime})'[${ovPad}]`);
    }
    currentVideoPad = ovPad;
  });

  // 7. Watermark Overlay (Dynamic Corner Coordinates)
  if (watermarkLayers.length > 0) {
    const wmPad = 'wm_out';
    const wmText = (composition.brandKit?.name || 'Made with KontentOS').replace(/'/g, "\\'").replace(/:/g, '\\:');
    const coords = getWatermarkFfmpegCoordinates(composition.brandKit?.position);
    filterGraph.push(`[${currentVideoPad}]drawtext=text='${wmText}':x=${coords.x}:y=${coords.y}:fontsize=20:fontcolor=0xffffff@0.8[${wmPad}]`);
    currentVideoPad = wmPad;
  }

  // 7. Background Music / Audio Mixing (with Speech-Reactive Auto Ducking & Volume Parity)
  const bgmPads: string[] = [];
  if (audioLayers.length > 0) {
    audioLayers.forEach((bgm, idx) => {
      const bgmInIdx = inputIndexMap.get(bgm.sourcePath);
      if (bgmInIdx !== undefined && sourceHasAudioStream(bgm.sourcePath) && !bgm.muted) {
        const bgmPad = `a_bgm_${idx}`;
        const delayMs = Math.round((bgm.startTime || 0) * 1000);
        filterGraph.push(`[${bgmInIdx}:a]atrim=start=${bgm.sourceStart || 0}:end=${bgm.sourceEnd || 999},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${bgm.volume ?? 0.5}[${bgmPad}]`);
        bgmPads.push(`[${bgmPad}]`);
      }
    });
  }

  const mixResult = buildFfmpegAudioMixFilterGraph(
    currentAudioPad,
    bgmPads,
    {
      autoDuck: composition.audioSettings?.autoDuck,
      voiceCleanup: composition.audioSettings?.voiceCleanup,
      noiseReduction: composition.audioSettings?.noiseReduction,
      primaryVol: composition.audioSettings?.primaryVol,
      bgmVol: composition.audioSettings?.bgmVol,
      hasPrimaryAudio: videoLayers.some(v => sourceHasAudioStream(v.sourcePath) && !v.muted),
      hasBgmAudio: bgmPads.length > 0
    }
  );

  mixResult.filterGraphLines.forEach(line => filterGraph.push(line));
  currentAudioPad = mixResult.finalAudioPad;

  // 8. Normalize final video and audio output streams
  filterGraph.push(`[${currentVideoPad}]format=yuv420p[v_out]`);
  filterGraph.push(`[${currentAudioPad}]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a_out]`);

  // 9. Output arguments
  outputs.push('-map', '[v_out]');
  outputs.push('-map', '[a_out]');
  outputs.push('-c:v', composition.outputSpec.videoCodec || 'libx264');
  outputs.push('-pix_fmt', 'yuv420p');
  outputs.push('-b:v', composition.outputSpec.videoBitrate || '4M');
  outputs.push('-r', fps.toString());
  outputs.push('-c:a', 'aac');
  outputs.push('-b:a', '192k');
  outputs.push('-ar', '48000');
  outputs.push('-movflags', '+faststart');

  const outputFilename = `output-${composition.id}.${composition.outputSpec.format || 'mp4'}`;
  
  return {
    inputs,
    filterGraph,
    outputs,
    outputFilename,
    summary: `FFmpeg Plan: ${uniqueInputPaths.length} inputs (${videoLayers.length} clips), ${textLayers.length} text overlays, ${overlayLayers.filter(ov => ov.overlayType === 'draw').length} draw overlays, ${captionLayers.length} captions, ${width}x${height}@${fps}fps`
  };
}
