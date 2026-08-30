import { RenderComposition, FfmpegCommandPlan, RenderVideoLayer, RenderTextLayer, RenderOverlayLayer, RenderAudioLayer, RenderCaptionLayer } from './types';

export function createFfmpegCommandPlan(composition: RenderComposition): FfmpegCommandPlan {
  const inputs: string[] = [];
  const filterGraph: string[] = [];
  const outputs: string[] = [];
  
  // 1. Process inputs
  const videoLayers = composition.timeline.layers.filter(l => l.type === 'video') as RenderVideoLayer[];
  const textLayers = composition.timeline.layers.filter(l => l.type === 'text') as RenderTextLayer[];
  const overlayLayers = composition.timeline.layers.filter(l => l.type === 'overlay') as RenderOverlayLayer[];
  const captionLayers = composition.timeline.layers.filter(l => l.type === 'caption') as RenderCaptionLayer[];
  const audioLayers = composition.timeline.layers.filter(l => l.type === 'audio') as RenderAudioLayer[];
  const watermarkLayers = composition.timeline.layers.filter(l => l.type === 'watermark');

  videoLayers.forEach((layer) => {
    inputs.push('-i');
    inputs.push(layer.sourcePath);
  });

  const width = composition.outputSpec.width;
  const height = composition.outputSpec.height;
  const fps = composition.outputSpec.fps;
  
  let currentVideoPad = '0:v';
  
  // 2. Main Video Scale, Crop, and Filter Graph
  filterGraph.push(`[${currentVideoPad}]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[scaled]`);
  currentVideoPad = 'scaled';

  // Apply cssFilter / LUT if present
  if (videoLayers.length > 0 && videoLayers[0].cssFilter) {
    filterGraph.push(`[${currentVideoPad}]eq=contrast=1.05:brightness=0.02[filtered]`);
    currentVideoPad = 'filtered';
  }

  // 3. Text Overlays Filter Graph (Drawtext with Position X/Y, Color, Font Size)
  textLayers.forEach((txt, idx) => {
    const textPad = `txt_${idx}`;
    const escapedText = (txt.text || '').replace(/'/g, "\\'").replace(/:/g, '\\:');
    const posX = `(w-tw)/2+${txt.x || 0}`;
    const posY = `(h-th)/2+${txt.y || 0}`;
    const fontSize = txt.fontSize || 36;
    const fontColor = (txt.color || '#ffffff').replace('#', '0x');
    
    filterGraph.push(`[${currentVideoPad}]drawtext=text='${escapedText}':x=${posX}:y=${posY}:fontsize=${fontSize}:fontcolor=${fontColor}:enable='between(t,${txt.startTime},${txt.endTime})'[${textPad}]`);
    currentVideoPad = textPad;
  });

  // 4. Subtitle / Burn-in Captions Filter Graph (Direct Drawtext for Timed Segments)
  if (composition.captionMode === 'burn' && captionLayers.length > 0) {
    captionLayers.forEach((cap, idx) => {
      const capPad = `cap_${idx}`;
      const escapedText = (cap.text || '').replace(/'/g, "\\'").replace(/:/g, '\\:');
      const fontSize = 32;
      const fontColor = '0xffffff';
      filterGraph.push(`[${currentVideoPad}]drawtext=text='${escapedText}':x=(w-tw)/2:y=h-th-140:fontsize=${fontSize}:fontcolor=${fontColor}:enable='between(t,${cap.startTime},${cap.endTime})'[${capPad}]`);
      currentVideoPad = capPad;
    });
  }

  // 5. Watermark Overlay Filter Graph
  if (watermarkLayers.length > 0) {
    const wmPad = 'wm_out';
    const wmText = (composition.brandKit?.name || 'Made with KontentOS').replace(/'/g, "\\'");
    filterGraph.push(`[${currentVideoPad}]drawtext=text='${wmText}':x=w-tw-24:y=h-th-24:fontsize=20:fontcolor=0xffffff@0.8[${wmPad}]`);
    currentVideoPad = wmPad;
  }

  // 6. Ensure standard yuv420p pixel format for universal player compatibility
  filterGraph.push(`[${currentVideoPad}]format=yuv420p[v_out]`);
  currentVideoPad = 'v_out';

  // 7. Define Output Arguments
  outputs.push('-map');
  outputs.push(`[${currentVideoPad}]`);
  
  outputs.push('-c:v');
  outputs.push(composition.outputSpec.videoCodec || 'libx264');
  outputs.push('-pix_fmt');
  outputs.push('yuv420p');
  outputs.push('-b:v');
  outputs.push(composition.outputSpec.videoBitrate || '4M');
  outputs.push('-r');
  outputs.push(fps.toString());

  const outputFilename = `output-${composition.id}.${composition.outputSpec.format || 'mp4'}`;
  
  return {
    inputs,
    filterGraph,
    outputs,
    outputFilename,
    summary: `FFmpeg Plan: ${videoLayers.length} video inputs, ${textLayers.length} text overlays, ${captionLayers.length} captions, ${width}x${height}@${fps}fps`
  };
}
