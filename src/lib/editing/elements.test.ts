import { historyReducer } from './engine';
import { EditState, HistoryState, TimelineItem } from './types';
import { buildRenderRequestFromEditState } from '../rendering/builder';
import { mockGraphicElements } from '@/components/tabs/raw-studio/mock-data';

export function runElementsSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING GRAPHIC ELEMENTS & OVERLAY TRACK SANITY TESTS ---');

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

  // 1. Add Trending Fire Graphic Element
  const firePreset = mockGraphicElements[0];
  const overlayItem: TimelineItem = {
    id: 'overlay-fire-1',
    trackId: 'track-text-1',
    type: 'overlay',
    start: 1.0,
    end: 4.0,
    label: `${firePreset.symbol} ${firePreset.name}`,
    content: firePreset.symbol,
    properties: { x: 0, y: 0, scale: 120, opacity: 100, rotation: 0, color: firePreset.color, fontSize: 48, zIndex: 15 }
  };

  history = historyReducer(history, {
    type: 'ADD_ITEM',
    payload: overlayItem
  });

  assert(history.present.items.length === 1, 'Test 1: Overlay item added to editState.items');
  assert(history.present.items[0].type === 'overlay', 'Test 1: Item type is overlay');
  assert(history.present.items[0].properties.zIndex === 15, 'Test 1: Initial zIndex === 15');

  // 2. Layer Reordering on Graphic Element
  history = historyReducer(history, {
    type: 'REORDER_ITEM_LAYER',
    payload: { itemId: 'overlay-fire-1', direction: 'bring_to_front' }
  });

  const reorderedOverlay = history.present.items.find(i => i.id === 'overlay-fire-1');
  assert(reorderedOverlay!.properties.zIndex! >= 15, 'Test 2: Layer reorder updated zIndex');

  // 3. UNDO
  history = historyReducer(history, { type: 'UNDO' });
  const undoneOverlay = history.present.items.find(i => i.id === 'overlay-fire-1');
  assert(undoneOverlay!.properties.zIndex === 15, 'Test 3: UNDO restored previous zIndex');

  // 4. Render Serialization Order
  const renderReq = buildRenderRequestFromEditState(history.present, { mediaAssetId: 'asset-1', platformPresetId: 'reels' });
  assert(renderReq.textOverlays.length === 1, 'Test 4: Graphic overlay serialized in renderReq.textOverlays');
  assert(renderReq.textOverlays[0].text === firePreset.symbol, 'Test 4: Correct overlay symbol text serialized');

  return passed;
}

runElementsSanityTests();
