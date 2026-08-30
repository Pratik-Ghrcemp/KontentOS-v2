import { historyReducer } from './engine';
import { TimelineItem, EditState, HistoryState } from './types';
import { buildRenderRequestFromEditState } from '@/lib/rendering/builder';

export function runSpeedTargetedRealityCheck(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING TARGETED REALITY VERIFICATION FOR SPEED CONTROLS ---');

  const initialClip: TimelineItem = {
    id: 'v1',
    trackId: 'track-video-1',
    type: 'video',
    start: 0,
    end: 10,
    sourceIn: 0,
    sourceOut: 10,
    assetId: 'asset-1',
    label: 'Main Video',
    properties: { speed: 1.0, reversed: false }
  };

  const initialState: EditState = {
    tracks: [{ id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' }],
    items: [initialClip],
    selection: ['v1'],
    duration: 10
  };

  let history: HistoryState = { past: [], present: initialState, future: [] };

  // 1. Change 10s clip from 1x to 2x: duration becomes 5s & item.end updates to 5
  history = historyReducer(history, {
    type: 'UPDATE_PROPERTIES',
    payload: { id: 'v1', properties: { speed: 2.0 } }
  });
  const clip2x = history.present.items.find((i: TimelineItem) => i.id === 'v1')!;
  assert(clip2x.end === 5.0, 'Scenario 1: Speed 2.0x updates item.end to 5.0s');
  assert(history.present.duration === 5.0, 'Scenario 1: State duration updates to 5.0s');

  // 2. Change 10s clip from 1x to 0.5x: duration becomes 20s
  history = historyReducer(history, {
    type: 'UPDATE_PROPERTIES',
    payload: { id: 'v1', properties: { speed: 0.5 } }
  });
  const clipHalfX = history.present.items.find((i: TimelineItem) => i.id === 'v1')!;
  assert(clipHalfX.end === 20.0, 'Scenario 2: Speed 0.5x updates item.end to 20.0s');

  // 3. Verify speed changes preserve sourceIn/sourceOut semantics
  assert(clipHalfX.sourceIn === 0 && clipHalfX.sourceOut === 10, 'Scenario 3: sourceIn (0) and sourceOut (10) remain unchanged');

  // 4. Verify trimming a speed-adjusted clip
  history = historyReducer(history, {
    type: 'TRIM_ITEM',
    payload: { id: 'v1', newStart: 0, newEnd: 3, newSourceIn: 0, newSourceOut: 6 }
  });
  const trimmedClip = history.present.items.find((i: TimelineItem) => i.id === 'v1')!;
  assert(trimmedClip.end === 3.0 && trimmedClip.sourceOut === 6, 'Scenario 4: Trimming speed-adjusted clip updates boundaries correctly');

  // 5. Verify splitting a speed-adjusted clip preserves speed & reversed state
  history = historyReducer(history, {
    type: 'SPLIT_ITEM',
    payload: { id: 'v1', time: 1.5 }
  });
  assert(history.present.items.length === 2, 'Scenario 5: Split produces 2 clips');
  assert(history.present.items[0].properties.speed === 0.5, 'Scenario 5: Left split clip inherits speed 0.5x');
  assert(history.present.items[1].properties.speed === 0.5, 'Scenario 5: Right split clip inherits speed 0.5x');

  // 6. Verify Undo restores previous state
  history = historyReducer(history, { type: 'UNDO' });
  assert(history.present.items.length === 1, 'Scenario 6: Undo restores single clip');

  // 7. Verify RenderRequest contains correct speed/reverse metadata
  const payload = buildRenderRequestFromEditState(history.present, {
    mediaAssetId: 'asset-1',
    platformPresetId: 'instagram-reels'
  });
  assert(payload.timelineClips[0].speed === 0.5, 'Scenario 7: RenderRequest payload contains speed === 0.5');

  return passed;
}

runSpeedTargetedRealityCheck();
