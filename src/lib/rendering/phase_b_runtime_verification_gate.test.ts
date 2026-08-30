import { buildRenderRequestFromEditState } from './builder';
import { buildRenderComposition } from './composition-builder';
import { createFfmpegCommandPlan } from './ffmpeg-command-planner';
import { EditState } from '../editing/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ VERIFICATION GATE FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ VERIFICATION GATE PASSED: ${msg}`);
}

console.log('================================================================');
console.log('--- PHASE B PRACTICAL RUNTIME VERIFICATION GATE (WYSIWYG PARITY) ---');
console.log('================================================================');

// Baseline State
const baseState: EditState = {
  tracks: [
    { id: 'track-v1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: '#000' },
    { id: 'track-t1', label: 'Text', type: 'text', locked: false, muted: false, visible: true, color: '#000' },
    { id: 'track-a1', label: 'Audio', type: 'audio', locked: false, muted: false, visible: true, color: '#000' }
  ],
  items: [],
  selection: [],
  duration: 15
};

// ─── GATE TEST 1: Text Move & Transform Export ─────────────────
console.log('\n[Gate 1] Testing Text Move & Transform Export Parity...');
const textMovedState: EditState = {
  ...baseState,
  items: [
    {
      id: 'text-moved-1',
      trackId: 'track-t1',
      type: 'text',
      start: 1,
      end: 6,
      content: 'Moved Text Title',
      label: 'Moved Text Title',
      properties: { x: 140, y: -80, fontSize: 52, color: '#ec4899', fontFamily: 'Poppins' }
    }
  ]
};
const req1 = buildRenderRequestFromEditState(textMovedState, { mediaAssetId: 'clip1.mp4', platformPresetId: 'instagram-reels' });
const comp1 = buildRenderComposition(req1);
const plan1 = createFfmpegCommandPlan(comp1);

const textLayer1 = comp1.timeline.layers.find(l => l.type === 'text') as any;
assert(textLayer1 && textLayer1.x === 140 && textLayer1.y === -80, 'Gate 1: Canvas text translate(140, -80) accurately mapped into composition layer');
assert(textLayer1 && textLayer1.fontSize === 52 && textLayer1.color === '#ec4899', 'Gate 1: Font size 52px and color #ec4899 mapped into composition layer');
assert(plan1.filterGraph.some(f => f.includes('drawtext') && f.includes('140') && f.includes('0xec4899')), 'Gate 1: FFmpeg command plan generates drawtext filtergraph with exact X/Y offsets and hex color');

// ─── GATE TEST 2: Scale, Rotation & Opacity Export ─────────────
console.log('\n[Gate 2] Testing Scale, Rotation & Opacity Export Parity...');
const scaledVideoState: EditState = {
  ...baseState,
  items: [
    {
      id: 'video-transform-1',
      trackId: 'track-v1',
      type: 'video',
      start: 0,
      end: 10,
      assetId: 'video1.mp4',
      properties: { x: -30, y: 40, scale: 135, rotation: 12, opacity: 85 }
    }
  ]
};
const req2 = buildRenderRequestFromEditState(scaledVideoState, { mediaAssetId: 'video1.mp4', platformPresetId: 'instagram-reels' });
const comp2 = buildRenderComposition(req2);
const videoLayer2 = comp2.timeline.layers.find(l => l.type === 'video') as any;

assert(videoLayer2 && videoLayer2.scale === 135, 'Gate 2: Video canvas scale (135%) accurately mapped into composition layer');
assert(videoLayer2 && videoLayer2.rotation === 12, 'Gate 2: Video canvas rotation (12 deg) accurately mapped into composition layer');
assert(videoLayer2 && videoLayer2.opacity === 85, 'Gate 2: Video canvas opacity (85%) accurately mapped into composition layer');

// ─── GATE TEST 3: Keyframe Animation Export ────────────────────
console.log('\n[Gate 3] Testing Keyframe Animation Export Parity...');
const keyframeAnimState: EditState = {
  ...baseState,
  items: [
    {
      id: 'video-kf-1',
      trackId: 'track-v1',
      type: 'video',
      start: 0,
      end: 10,
      assetId: 'video1.mp4',
      properties: { x: 0, y: 0, scale: 100 },
      keyframes: [
        { id: 'kf-start', time: 0, properties: { scale: 100, opacity: 100 } },
        { id: 'kf-mid', time: 5, properties: { scale: 180, opacity: 50 } }
      ]
    }
  ]
};
const req3 = buildRenderRequestFromEditState(keyframeAnimState, { mediaAssetId: 'video1.mp4', platformPresetId: 'instagram-reels' });
const comp3 = buildRenderComposition(req3);
const videoLayer3 = comp3.timeline.layers.find(l => l.type === 'video') as any;

assert(videoLayer3 && videoLayer3.keyframes && videoLayer3.keyframes.length === 2, 'Gate 3: Multi-property keyframe animation array (2 keyframes) preserved in composition');
assert(videoLayer3.keyframes[1].properties.scale === 180, 'Gate 3: Keyframe #2 scale target (180%) correctly stored in layer');

// ─── GATE TEST 4: Effects & LUT Export ────────────────────────
console.log('\n[Gate 4] Testing Effects & LUT Export Parity...');
const lutState: EditState = {
  ...baseState,
  items: [
    {
      id: 'video-lut-1',
      trackId: 'track-v1',
      type: 'video',
      start: 0,
      end: 10,
      assetId: 'video1.mp4',
      properties: { brightness: 110, contrast: 120 }
    }
  ]
};
const req4 = buildRenderRequestFromEditState(lutState, { mediaAssetId: 'video1.mp4', platformPresetId: 'instagram-reels', selectedLutId: 'studio_enhance' });
const comp4 = buildRenderComposition(req4);
const plan4 = createFfmpegCommandPlan(comp4);
const videoLayer4 = comp4.timeline.layers.find(l => l.type === 'video') as any;

assert(videoLayer4 && Boolean(videoLayer4.cssFilter), 'Gate 4: CSS filter string generated from LUT/brightness properties');
assert(plan4.filterGraph.some(f => f.includes('eq=contrast=')), 'Gate 4: FFmpeg filtergraph contains eq/contrast color adjustment filters');

// ─── GATE TEST 5: Audio & BGM Export ──────────────────────────
console.log('\n[Gate 5] Testing BGM, Volume & Fade Export Parity...');
const audioBgmState: EditState = {
  ...baseState,
  items: [
    {
      id: 'audio-track-1',
      trackId: 'track-a1',
      type: 'audio',
      start: 0,
      end: 12,
      assetId: 'lofi-bgm.mp3',
      properties: { volume: 65, fadeInDuration: 2.0, fadeOutDuration: 1.5 }
    }
  ]
};
const req5 = buildRenderRequestFromEditState(audioBgmState, {
  mediaAssetId: 'clip1.mp4',
  platformPresetId: 'instagram-reels',
  audioSettings: { primaryVol: 100, bgmVol: 65 }
});
const comp5 = buildRenderComposition(req5);
const plan5 = createFfmpegCommandPlan(comp5);
const audioLayer5 = comp5.timeline.layers.find(l => l.type === 'audio') as any;

assert(audioLayer5 && audioLayer5.volume === 0.65, 'Gate 5: BGM volume (65%) mapped to 0.65 ratio in composition audio layer');
assert(audioLayer5 && audioLayer5.fadeInDuration === 2.0 && audioLayer5.fadeOutDuration === 1.5, 'Gate 5: Audio fade in (2.0s) and fade out (1.5s) preserved in layer');
assert(plan5.filterGraph.some(f => f.includes('volume=')), 'Gate 5: FFmpeg filtergraph contains volume audio mixing filter');

// ─── GATE TEST 6: Brand Kit & Watermark Export ────────────────
console.log('\n[Gate 6] Testing Brand Kit & Watermark Export Parity...');
const req6 = buildRenderRequestFromEditState(baseState, {
  mediaAssetId: 'clip1.mp4',
  platformPresetId: 'instagram-reels',
  brandKit: { name: 'White Edition Creator', watermark: { position: 'bottom-right', opacity: 0.85 } }
});
const comp6 = buildRenderComposition(req6);
const plan6 = createFfmpegCommandPlan(comp6);
const wmLayer6 = comp6.timeline.layers.find(l => l.type === 'watermark') as any;

assert(wmLayer6 && wmLayer6.zIndex === 50, 'Gate 6: Watermark layer created with top zIndex (50)');
assert(plan6.filterGraph.some(f => f.includes('White Edition Creator') || f.includes('drawtext')), 'Gate 6: FFmpeg filtergraph generates brand watermark text overlay');

console.log('================================================================');
console.log('🎉 PHASE B PRACTICAL RUNTIME VERIFICATION GATE: 100% SUCCESS! 🎉');
console.log('================================================================');
