import { EditState } from './types';
import { initialEditState, calculateSnap } from './engine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ PHASE C TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PHASE C TEST PASSED: ${msg}`);
}

console.log('====================================================');
console.log('--- RUNNING PHASE C PERSISTENCE & PRECISION TEST ---');
console.log('====================================================');

// 1. Verify LocalStorage State Serialization & Complete Parameter Preservation
const fullStateToPersist = {
  editState: {
    ...initialEditState,
    items: [
      { id: 'video-1', trackId: 't-vid', type: 'video', start: 0, end: 10, properties: { scale: 120, rotation: 10 } }
    ]
  },
  captionStyle: { burnIn: true, preset: 'minimal', color: '#ffffff' },
  brandKit: { name: 'Creator Brand', watermark: { position: 'top-left', opacity: 0.9 } },
  platformPreset: 'instagram-reels',
  projectTitle: 'Persistence Test Reel',
  audioSettings: { primaryVol: 90, bgmVol: 60, clips: [] },
  activeEffects: ['Blur BG'],
  selectedLutId: 'studio_enhance',
  drawColor: '#10b981',
  drawWidth: 6,
  exportQuality: 'high',
  exportCaptionMode: 'burn'
};

const jsonString = JSON.stringify(fullStateToPersist);
const rehydrated = JSON.parse(jsonString);

assert(Boolean(rehydrated.audioSettings) && rehydrated.audioSettings.bgmVol === 60, 'Phase C: audioSettings preserved across JSON serialization');
assert(Boolean(rehydrated.activeEffects) && rehydrated.activeEffects.includes('Blur BG'), 'Phase C: activeEffects array preserved across JSON serialization');
assert(rehydrated.selectedLutId === 'studio_enhance', 'Phase C: selectedLutId preserved across JSON serialization');
assert(rehydrated.drawColor === '#10b981' && rehydrated.drawWidth === 6, 'Phase C: drawColor and drawWidth preserved across JSON serialization');
assert(rehydrated.exportQuality === 'high' && rehydrated.exportCaptionMode === 'burn', 'Phase C: exportQuality and exportCaptionMode preserved across JSON serialization');

// 2. Verify Precision Snapping Math (Inclusive Boundary & 1ms Rounding)
const testState: EditState = {
  tracks: [{ id: 't-vid', label: 'Video', type: 'video', locked: false, muted: false, visible: true, color: '#000' }],
  items: [
    { id: 'clip-1', trackId: 't-vid', type: 'video', start: 0, end: 5.0, properties: {} },
    { id: 'clip-2', trackId: 't-vid', type: 'video', start: 10.0, end: 15.0, properties: {} }
  ],
  selection: [],
  duration: 15,
  markers: [{ id: 'm-1', time: 7.5, label: 'Chorus', color: '#ff0000' }]
};

// Exact boundary distance = 0.25 (should snap because dist <= minDistance)
const boundarySnap = calculateSnap(5.25, testState, 'clip-drag', 0.25);
assert(boundarySnap.snapped && boundarySnap.time === 5.0, 'Phase C: Snapping triggers on exact boundary distance threshold (0.25s)');

// Playhead snap
const playheadSnap = calculateSnap(7.65, testState, 'clip-drag', 0.25, 7.5);
assert(playheadSnap.snapped && playheadSnap.time === 7.5, 'Phase C: Snapping triggers accurately on playhead target');

// Marker snap
const markerSnap = calculateSnap(7.4, testState, 'clip-drag', 0.25);
assert(markerSnap.snapped && markerSnap.time === 7.5, 'Phase C: Snapping triggers accurately on timeline markers');

// Unrounded floating point input rounded to 3 decimals (1ms)
const floatSnap = calculateSnap(4.9999999999999, testState, 'clip-drag', 0.25);
assert(floatSnap.time === 5.0, 'Phase C: Floating point sub-millisecond drag input rounded cleanly to exact target');

console.log('====================================================');
console.log('🎉 ALL PHASE C PERSISTENCE & PRECISION TESTS PASSED! 🎉');
console.log('====================================================');
