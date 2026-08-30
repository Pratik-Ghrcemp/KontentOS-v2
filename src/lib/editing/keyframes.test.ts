import { historyReducer } from './engine';
import { evaluateInterpolatedProperties } from './keyframes';
import { EditState, HistoryState, TimelineItem } from './types';
import { buildRenderRequestFromEditState } from '../rendering/builder';

export function runKeyframeSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING KEYFRAME ANIMATION ENGINE SANITY TESTS ---');

  const testClip: TimelineItem = {
    id: 'clip-1',
    trackId: 'track-video-1',
    type: 'video',
    start: 2.0, // Clip starts at t=2.0s
    end: 10.0,
    properties: { x: 0, y: 0, scale: 100, opacity: 100, rotation: 0 },
    keyframes: [
      { id: 'kf-1', time: 0.0, properties: { x: 0, scale: 100, opacity: 0 } },   // At item.start + 0.0s (t=2.0s)
      { id: 'kf-2', time: 2.0, properties: { x: 100, scale: 200, opacity: 100 } } // At item.start + 2.0s (t=4.0s)
    ]
  };

  // 1. Before First Keyframe Hold Behavior (t=1.0s, before item.start)
  const beforeProps = evaluateInterpolatedProperties(testClip, 1.0);
  assert(beforeProps.x === 0, 'Test 1: Before first keyframe holds x=0');
  assert(beforeProps.scale === 100, 'Test 1: Before first keyframe holds scale=100');
  assert(beforeProps.opacity === 0, 'Test 1: Before first keyframe holds opacity=0');

  // 2. Midpoint Linear Interpolation (t=3.0s, offset=1.0s, half-way between kf-1 and kf-2)
  const midProps = evaluateInterpolatedProperties(testClip, 3.0);
  assert(midProps.x === 50, 'Test 2: Midpoint linear lerp x === 50');
  assert(midProps.scale === 150, 'Test 2: Midpoint linear lerp scale === 150');
  assert(midProps.opacity === 50, 'Test 2: Midpoint linear lerp opacity === 50');

  // 3. After Last Keyframe Hold Behavior (t=6.0s, offset=4.0s > 2.0s)
  const afterProps = evaluateInterpolatedProperties(testClip, 6.0);
  assert(afterProps.x === 100, 'Test 3: After last keyframe holds x=100');
  assert(afterProps.scale === 200, 'Test 3: After last keyframe holds scale=200');
  assert(afterProps.opacity === 100, 'Test 3: After last keyframe holds opacity=100');

  // 4. Reducer ADD_KEYFRAME & History Integration
  const initialEditState: EditState = {
    tracks: [{ id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' }],
    items: [testClip],
    selection: ['clip-1'],
    duration: 10
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };

  // ADD_KEYFRAME at t=4.0s (offset 4.0s)
  history = historyReducer(history, {
    type: 'ADD_KEYFRAME',
    payload: {
      itemId: 'clip-1',
      keyframe: { id: 'kf-3', time: 4.0, properties: { x: 200, scale: 250, opacity: 50 } }
    }
  });

  const updatedItem = history.present.items.find(i => i.id === 'clip-1');
  assert((updatedItem?.keyframes || []).length === 3, 'Test 4: ADD_KEYFRAME added kf-3 (total 3 keyframes)');
  assert(history.past.length === 1, 'Test 4: Exactly 1 history step recorded in past stack');

  // 5. UNDO Keyframe addition
  history = historyReducer(history, { type: 'UNDO' });
  const undoneItem = history.present.items.find(i => i.id === 'clip-1');
  assert((undoneItem?.keyframes || []).length === 2, 'Test 5: UNDO removes newly added keyframe kf-3');

  // 6. REDO Keyframe addition
  history = historyReducer(history, { type: 'REDO' });
  const redoneItem = history.present.items.find(i => i.id === 'clip-1');
  assert((redoneItem?.keyframes || []).length === 3, 'Test 6: REDO restores keyframe kf-3');

  // 7. DELETE_KEYFRAME
  history = historyReducer(history, {
    type: 'DELETE_KEYFRAME',
    payload: { itemId: 'clip-1', keyframeId: 'kf-1' }
  });
  const deletedItem = history.present.items.find(i => i.id === 'clip-1');
  assert((deletedItem?.keyframes || []).length === 2, 'Test 7: DELETE_KEYFRAME removes kf-1');

  // 8. Render Serialization Payload Verification
  const renderReq = buildRenderRequestFromEditState(history.present, { mediaAssetId: 'asset-1', platformPresetId: 'reels' });
  assert(Array.isArray(renderReq.timelineClips[0].keyframes), 'Test 8: renderReq.timelineClips[0].keyframes is array');
  assert(renderReq.timelineClips[0].keyframes?.length === 2, 'Test 8: 2 keyframes serialized in RenderRequest');

  return passed;
}

runKeyframeSanityTests();
