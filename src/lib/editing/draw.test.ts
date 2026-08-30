import { historyReducer } from './engine';
import { EditState, HistoryState, TimelineItem } from './types';
import { buildRenderRequestFromEditState } from '../rendering/builder';

export function runDrawSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING DRAW TOOL & VECTOR STROKE OVERLAY SANITY TESTS ---');

  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'rose' }
    ],
    items: [],
    selection: [],
    duration: 10
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };

  // 1. Add Freehand Vector Stroke Overlay
  const drawOverlayItem: TimelineItem = {
    id: 'draw-stroke-1',
    trackId: 'track-text-1',
    type: 'overlay',
    start: 2.0,
    end: 6.0,
    label: '✏️ Freehand Drawing',
    content: 'drawing',
    properties: {
      x: 10,
      y: 20,
      scale: 100,
      opacity: 100,
      rotation: 0,
      strokePoints: [{ x: -30, y: -10 }, { x: 0, y: 20 }, { x: 30, y: -10 }],
      strokeColor: '#ef4444',
      strokeWidth: 8,
      zIndex: 15
    }
  };

  history = historyReducer(history, {
    type: 'ADD_ITEM',
    payload: drawOverlayItem
  });

  assert(history.present.items.length === 1, 'Test 1: Vector stroke item added to editState.items');
  assert(history.present.items[0].properties.strokeColor === '#ef4444', 'Test 1: strokeColor === #ef4444');
  assert(history.present.items[0].properties.strokeWidth === 8, 'Test 1: strokeWidth === 8');
  assert(Array.isArray(history.present.items[0].properties.strokePoints), 'Test 1: strokePoints is array');

  // 2. Transform Update on Drawing Overlay
  history = historyReducer(history, {
    type: 'UPDATE_PROPERTIES',
    payload: {
      id: 'draw-stroke-1',
      properties: { rotation: 45, scale: 150 }
    }
  });

  const updatedDraw = history.present.items.find(i => i.id === 'draw-stroke-1');
  assert(updatedDraw!.properties.rotation === 45, 'Test 2: Rotation transform updated to 45 deg');
  assert(updatedDraw!.properties.scale === 150, 'Test 2: Scale transform updated to 150');

  // 3. UNDO
  history = historyReducer(history, { type: 'UNDO' });
  const undoneDraw = history.present.items.find(i => i.id === 'draw-stroke-1');
  assert(undoneDraw!.properties.rotation === 0, 'Test 3: UNDO restored rotation to 0');

  // 4. REDO
  history = historyReducer(history, { type: 'REDO' });
  const redoneDraw = history.present.items.find(i => i.id === 'draw-stroke-1');
  assert(redoneDraw!.properties.rotation === 45, 'Test 4: REDO restored rotation to 45 deg');

  // 5. Render Serialization
  const renderReq = buildRenderRequestFromEditState(history.present, { mediaAssetId: 'asset-1', platformPresetId: 'reels' });
  assert(renderReq.textOverlays.length === 1, 'Test 5: Draw overlay serialized in renderReq.textOverlays');
  assert(Array.isArray(renderReq.textOverlays[0].properties.strokePoints), 'Test 5: strokePoints serialized in RenderRequest payload');

  return passed;
}

runDrawSanityTests();
