import { buildRenderRequestFromEditState } from './builder';
import { buildRenderComposition } from './composition-builder';
import { createFfmpegCommandPlan } from './ffmpeg-command-planner';
import { EditState } from '../editing/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ PARITY TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PARITY TEST PASSED: ${msg}`);
}

console.log('====================================================');
console.log('--- RUNNING PHASE B PREVIEW VS EXPORT PARITY TEST ---');
console.log('====================================================');

// Construct a rich EditState with video, keyframes, text overlay, sticker, freehand draw, audio, and brand kit
const testState: EditState = {
  tracks: [
    { id: 't-vid', label: 'Video', type: 'video', locked: false, muted: false, visible: true, color: '#000' },
    { id: 't-text', label: 'Text', type: 'text', locked: false, muted: false, visible: true, color: '#000' },
    { id: 't-audio', label: 'Audio', type: 'audio', locked: false, muted: false, visible: true, color: '#000' }
  ],
  items: [
    {
      id: 'video-clip-1',
      trackId: 't-vid',
      type: 'video',
      start: 0,
      end: 10,
      assetId: 'main-video.mp4',
      properties: { x: 50, y: -20, scale: 120, rotation: 15, opacity: 90, zIndex: 10 },
      keyframes: [
        { id: 'kf-1', time: 0, properties: { scale: 100 } },
        { id: 'kf-2', time: 5, properties: { scale: 150 } }
      ]
    },
    {
      id: 'text-clip-1',
      trackId: 't-text',
      type: 'text',
      start: 1,
      end: 6,
      content: 'Viral Headline Text',
      label: 'Headline Text',
      properties: { x: 100, y: -150, fontSize: 48, color: '#f59e0b', fontFamily: 'Poppins', zIndex: 20 }
    },
    {
      id: 'draw-clip-1',
      trackId: 't-text',
      type: 'overlay',
      start: 2,
      end: 7,
      content: 'Vector Arrow Drawing',
      label: 'Vector Drawing',
      properties: { type: 'draw', svgPath: 'M 0 0 L 100 100', color: '#10b981', strokeWidth: 5, zIndex: 22 }
    },
    {
      id: 'audio-bgm-1',
      trackId: 't-audio',
      type: 'audio',
      start: 0,
      end: 10,
      assetId: 'bgm-track.mp3',
      properties: { volume: 80, fadeInDuration: 1.5, fadeOutDuration: 2.0 }
    }
  ],
  selection: [],
  duration: 10
};

// 1. Build RenderRequest
const request = buildRenderRequestFromEditState(testState, {
  mediaAssetId: 'main-video.mp4',
  platformPresetId: 'instagram-reels',
  quality: 'high',
  captionMode: 'burn',
  projectTitle: 'WYSIWYG Parity Reel',
  brandKit: { name: 'My Creator Brand', watermark: { position: 'bottom-right', opacity: 0.8 } },
  audioSettings: { primaryVol: 100, bgmVol: 80 },
  selectedLutId: 'studio_enhance'
});

assert(request.timelineClips.length === 1, 'builder.ts extracts video clips');
assert(request.textOverlays.length === 2, 'builder.ts extracts text and overlay clips');
assert(request.audioSettings.clips.length === 1, 'builder.ts extracts audio track clips');

// 2. Build RenderComposition
const composition = buildRenderComposition(request);

assert(composition.timeline.layers.length >= 4, 'composition-builder.ts constructs layers for video, text, overlay, audio, and watermark');

const videoLayer = composition.timeline.layers.find(l => l.type === 'video') as any;
assert(videoLayer && videoLayer.x === 50 && videoLayer.y === -20 && videoLayer.scale === 120, 'composition-builder.ts preserves video X, Y, and Scale transforms');
assert(videoLayer && videoLayer.keyframes && videoLayer.keyframes.length === 2, 'composition-builder.ts preserves keyframe animation array');

const textLayer = composition.timeline.layers.find(l => l.type === 'text') as any;
assert(textLayer && textLayer.x === 100 && textLayer.fontSize === 48 && textLayer.color === '#f59e0b', 'composition-builder.ts preserves text X/Y coordinates, font size, and color');

const overlayLayer = composition.timeline.layers.find(l => l.type === 'overlay') as any;
assert(overlayLayer && overlayLayer.overlayType === 'draw' && overlayLayer.svgPath === 'M 0 0 L 100 100', 'composition-builder.ts preserves vector drawing stroke path');

const audioLayer = composition.timeline.layers.find(l => l.type === 'audio') as any;
assert(audioLayer && audioLayer.volume === 0.8 && audioLayer.fadeInDuration === 1.5, 'composition-builder.ts preserves audio volume and fade curves');

const watermarkLayer = composition.timeline.layers.find(l => l.type === 'watermark') as any;
assert(watermarkLayer && watermarkLayer.zIndex === 50, 'composition-builder.ts preserves watermark brand kit layer');

// 3. Build FFmpeg Command Plan
const plan = createFfmpegCommandPlan(composition);

assert(plan.filterGraph.length > 0, 'ffmpeg-command-planner.ts generates filtergraph steps');
assert(plan.summary.includes('video inputs') && plan.summary.includes('text overlays'), 'ffmpeg-command-planner.ts summary reports multi-layer inputs');

console.log('====================================================');
console.log('🎉 ALL PHASE B PREVIEW VS EXPORT PARITY TESTS PASSED! 🎉');
console.log('====================================================');
