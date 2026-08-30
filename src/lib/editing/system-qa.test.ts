import { historyReducer, calculateSnap } from './engine';
import { evaluateInterpolatedProperties } from './keyframes';
import { calculateObjectAlignment } from './geometry/alignment';
import { buildRenderRequestFromEditState } from '../rendering/builder';
import { createRenderJob, subscribeToRenderJob } from '../rendering/render-service';
import { EditState, HistoryState, TimelineItem } from './types';
import { mockGraphicElements } from '@/components/tabs/raw-studio/mock-data';

export async function runFullSystemQASanityTests(): Promise<boolean> {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ QA TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ QA TEST PASSED: ${description}`);
    }
  };

  console.log('====================================================');
  console.log('--- RUNNING PHASE 6 FULL STUDIO HUB SYSTEM QA AUDIT ---');
  console.log('====================================================');

  // --- AREA 1: INITIAL STATE & TRACK DEFINITIONS ---
  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-audio-1', label: 'Primary Audio', type: 'audio', locked: false, muted: false, visible: true, color: 'purple' },
      { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'rose' }
    ],
    items: [],
    selection: [],
    markers: [],
    duration: 15
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };

  // --- AREA 2: TIMELINE CREATION & ADDING ITEMS ---
  const videoItem: TimelineItem = {
    id: 'clip-video-1',
    trackId: 'track-video-1',
    type: 'video',
    start: 0.0,
    end: 10.0,
    properties: { x: 0, y: 0, scale: 100, opacity: 100, rotation: 0, volume: 100, fadeInDuration: 1.0, fadeOutDuration: 1.0, zIndex: 10 }
  };

  const textItem: TimelineItem = {
    id: 'clip-text-1',
    trackId: 'track-text-1',
    type: 'text',
    start: 1.0,
    end: 6.0,
    content: 'Hero Headline Text',
    properties: { x: 0, y: -50, fontSize: 40, color: '#ffffff', zIndex: 20 }
  };

  history = historyReducer(history, { type: 'ADD_ITEM', payload: videoItem });
  history = historyReducer(history, { type: 'ADD_ITEM', payload: textItem });
  assert(history.present.items.length === 2, 'Area 2: Added Video clip and Text Overlay clips to timeline');

  // --- AREA 3: ELEMENTS & VECTOR DRAWING OVERLAYS ---
  const firePreset = mockGraphicElements[0];
  const elementItem: TimelineItem = {
    id: 'clip-overlay-fire',
    trackId: 'track-text-1',
    type: 'overlay',
    start: 2.0,
    end: 8.0,
    label: `${firePreset.symbol} ${firePreset.name}`,
    content: firePreset.symbol,
    properties: { x: 100, y: 50, scale: 120, opacity: 100, zIndex: 15 }
  };

  const drawItem: TimelineItem = {
    id: 'clip-draw-stroke',
    trackId: 'track-text-1',
    type: 'overlay',
    start: 3.0,
    end: 7.0,
    label: '✏️ Vector Freehand Drawing',
    content: 'drawing',
    properties: {
      x: -100, y: 50, scale: 100, opacity: 100,
      strokePoints: [{ x: -20, y: 0 }, { x: 0, y: 20 }, { x: 20, y: 0 }],
      strokeColor: '#ef4444', strokeWidth: 8, zIndex: 15
    }
  };

  history = historyReducer(history, { type: 'ADD_ITEM', payload: elementItem });
  history = historyReducer(history, { type: 'ADD_ITEM', payload: drawItem });
  assert(history.present.items.length === 4, 'Area 3: Graphic sticker and Vector freehand drawing added');

  // --- AREA 4: TIMELINE MARKERS & PLAYHEAD SNAPPING ---
  history = historyReducer(history, {
    type: 'ADD_MARKER',
    payload: { id: 'marker-1', time: 5.0, label: 'Scene Cut Marker', color: 'amber' }
  });
  assert((history.present.markers || []).length === 1, 'Area 4: Marker added at 5.0s');

  const snapToMarker = calculateSnap(4.9, history.present, 'clip-text-1', 0.25);
  assert(snapToMarker.snapped === true && snapToMarker.time === 5.0, 'Area 4: Magnetic snap to marker at 5.0s verified');

  // --- AREA 5: KEYFRAME ANIMATION & INTERPOLATION ---
  history = historyReducer(history, {
    type: 'ADD_KEYFRAME',
    payload: {
      itemId: 'clip-text-1',
      keyframe: { id: 'kf-t0', time: 0.0, properties: { opacity: 0, scale: 50 } }
    }
  });
  history = historyReducer(history, {
    type: 'ADD_KEYFRAME',
    payload: {
      itemId: 'clip-text-1',
      keyframe: { id: 'kf-t2', time: 2.0, properties: { opacity: 100, scale: 100 } }
    }
  });

  const animatedText = history.present.items.find(i => i.id === 'clip-text-1')!;
  const midPlaybackProps = evaluateInterpolatedProperties(animatedText, 2.0); // t=2.0s is clip start + 1.0s (offset 1.0s)
  assert(midPlaybackProps.opacity === 50, 'Area 5: Keyframe opacity lerp at offset 1.0s === 50%');
  assert(midPlaybackProps.scale === 75, 'Area 5: Keyframe scale lerp at offset 1.0s === 75');

  // --- AREA 6: LAYERING & Z-INDEX REORDERING ---
  history = historyReducer(history, {
    type: 'REORDER_ITEM_LAYER',
    payload: { itemId: 'clip-video-1', direction: 'bring_to_front' }
  });
  const topVideo = history.present.items.find(i => i.id === 'clip-video-1')!;
  assert(topVideo.properties.zIndex! > 20, 'Area 6: Video bring_to_front updated zIndex > 20');

  // --- AREA 7: SMART CANVAS ALIGNMENT ---
  const alignRes = calculateObjectAlignment(4, -5, [{ x: 0, y: 0 }], 10);
  assert(alignRes.snappedX && alignRes.x === 0, 'Area 7: Canvas center smart alignment verified');

  // --- AREA 8: UNDO / REDO INTEGRATION STRESS ---
  history = historyReducer(history, { type: 'UNDO' }); // Undoes layer reorder
  const undoneVideo = history.present.items.find(i => i.id === 'clip-video-1')!;
  assert(undoneVideo.properties.zIndex === 10, 'Area 8: UNDO restored video zIndex to 10');

  history = historyReducer(history, { type: 'REDO' }); // Redoes layer reorder
  const redoneVideo = history.present.items.find(i => i.id === 'clip-video-1')!;
  assert(redoneVideo.properties.zIndex! > 20, 'Area 8: REDO restored video bring_to_front zIndex');

  // --- AREA 9: RENDER REQUEST SERIALIZATION ---
  const renderReq = buildRenderRequestFromEditState(history.present, {
    mediaAssetId: 'asset-test-main',
    platformPresetId: 'instagram-reels',
    quality: 'high',
    captionMode: 'burn'
  });

  assert(renderReq.timelineClips.length === 1, 'Area 9: timelineClips serialized');
  assert(renderReq.textOverlays.length === 3, 'Area 9: textOverlays (text + sticker + draw) serialized');
  assert(renderReq.textOverlays[0].keyframes?.length === 2, 'Area 9: keyframes preserved in export payload');

  // --- AREA 10: RENDER JOB EXECUTION LIFECYCLE ---
  const job = await createRenderJob(renderReq);
  assert(job.status === 'queued', 'Area 10: Render job queued');

  const finalJob = await new Promise<any>((resolve) => {
    subscribeToRenderJob(job.id, (updated) => {
      if (updated.status === 'completed') resolve(updated);
    });
  });

  assert(finalJob?.status === 'completed', 'Area 10: Render job reached completed status');
  assert(typeof finalJob?.result_json?.fileUrl === 'string', 'Area 10: Download output fileUrl generated');

  return passed;
}

runFullSystemQASanityTests();
