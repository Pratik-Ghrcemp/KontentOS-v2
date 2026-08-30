import { historyReducer } from './engine';
import { EditState, HistoryState, TimelineItem } from './types';
import { buildRenderRequestFromEditState } from '../rendering/builder';

export function runLayeringSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING MULTI-TRACK LAYERING & Z-INDEX SANITY TESTS ---');

  const videoItem: TimelineItem = {
    id: 'item-video',
    trackId: 'track-video-1',
    type: 'video',
    start: 0,
    end: 10,
    properties: { x: 0, y: 0, zIndex: 10 }
  };

  const imageOverlayItem: TimelineItem = {
    id: 'item-image',
    trackId: 'track-video-1',
    type: 'video',
    start: 0,
    end: 10,
    properties: { x: 50, y: 50, zIndex: 15 }
  };

  const textOverlayItem: TimelineItem = {
    id: 'item-text',
    trackId: 'track-text-1',
    type: 'text',
    start: 0,
    end: 10,
    content: 'Title Text',
    properties: { x: 0, y: 0, zIndex: 20 }
  };

  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'rose' }
    ],
    items: [videoItem, imageOverlayItem, textOverlayItem],
    selection: ['item-video'],
    duration: 10
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };

  // 1. Initial Layer Order Check
  assert(history.present.items.find(i => i.id === 'item-video')?.properties.zIndex === 10, 'Test 1: Video zIndex === 10');
  assert(history.present.items.find(i => i.id === 'item-image')?.properties.zIndex === 15, 'Test 1: Image zIndex === 15');
  assert(history.present.items.find(i => i.id === 'item-text')?.properties.zIndex === 20, 'Test 1: Text zIndex === 20');

  // 2. Bring Video to Front (BRING_TO_FRONT)
  history = historyReducer(history, {
    type: 'REORDER_ITEM_LAYER',
    payload: { itemId: 'item-video', direction: 'bring_to_front' }
  });

  const videoAfterBringFront = history.present.items.find(i => i.id === 'item-video');
  assert(videoAfterBringFront!.properties.zIndex! > 20, 'Test 2: Video BRING_TO_FRONT zIndex > 20');
  assert(history.past.length === 1, 'Test 2: Exactly 1 history step recorded');

  // 3. Send Video Backward (SEND_BACKWARD)
  history = historyReducer(history, {
    type: 'REORDER_ITEM_LAYER',
    payload: { itemId: 'item-video', direction: 'send_backward' }
  });

  const videoAfterSendBack = history.present.items.find(i => i.id === 'item-video');
  assert(videoAfterSendBack!.properties.zIndex! <= 20, 'Test 3: Video SEND_BACKWARD decreased zIndex');

  // 4. Send Video to Back (SEND_TO_BACK)
  history = historyReducer(history, {
    type: 'REORDER_ITEM_LAYER',
    payload: { itemId: 'item-video', direction: 'send_to_back' }
  });

  const videoBottommost = history.present.items.find(i => i.id === 'item-video');
  const minOtherZ = Math.min(
    history.present.items.find(i => i.id === 'item-image')!.properties.zIndex!,
    history.present.items.find(i => i.id === 'item-text')!.properties.zIndex!
  );
  assert(videoBottommost!.properties.zIndex! < minOtherZ, 'Test 4: Video SEND_TO_BACK is strictly below all other layers');

  // 5. UNDO
  history = historyReducer(history, { type: 'UNDO' });
  const undoneVideo = history.present.items.find(i => i.id === 'item-video');
  assert(undoneVideo!.properties.zIndex! === videoAfterSendBack!.properties.zIndex!, 'Test 5: UNDO restored previous zIndex state');

  // 6. REDO
  history = historyReducer(history, { type: 'REDO' });
  const redoneVideo = history.present.items.find(i => i.id === 'item-video');
  assert(redoneVideo!.properties.zIndex! === videoBottommost!.properties.zIndex!, 'Test 6: REDO restored updated zIndex state');

  // 7. Render Serialization Verification
  const renderReq = buildRenderRequestFromEditState(history.present, { mediaAssetId: 'asset-1', platformPresetId: 'reels' });
  assert(typeof renderReq.timelineClips[0].properties.zIndex === 'number', 'Test 7: zIndex serialized in renderReq.timelineClips[0].properties');
  assert(typeof renderReq.textOverlays[0].properties.zIndex === 'number', 'Test 7: zIndex serialized in renderReq.textOverlays[0].properties');

  return passed;
}

runLayeringSanityTests();
