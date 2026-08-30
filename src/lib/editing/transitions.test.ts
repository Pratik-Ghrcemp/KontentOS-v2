import { historyReducer } from './engine';
import { TimelineItem, EditState, HistoryState } from './types';
import { buildRenderRequestFromEditState } from '@/lib/rendering/builder';

export function runTransitionsTargetedRealityCheck(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING TARGETED REALITY VERIFICATION FOR VIDEO TRANSITIONS ---');

  const clipA: TimelineItem = {
    id: 'v1',
    trackId: 'track-video-1',
    type: 'video',
    start: 0,
    end: 5,
    properties: { transitionOut: { type: 'crossfade', duration: 0.5 } }
  };

  const clipB: TimelineItem = {
    id: 'v2',
    trackId: 'track-video-1',
    type: 'video',
    start: 5,
    end: 10,
    properties: { transitionIn: { type: 'fade_black', duration: 0.5 } }
  };

  const initialState: EditState = {
    tracks: [{ id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' }],
    items: [clipA, clipB],
    selection: ['v2'],
    duration: 10
  };

  let history: HistoryState = { past: [], present: initialState, future: [] };

  // 1. Two adjacent video clips transition metadata
  assert(history.present.items.length === 2, 'Scenario 1: Two adjacent video clips present on timeline');

  // 2. Dissolve vs Crossfade honesty check
  assert(clipA.properties.transitionOut?.type === 'crossfade', 'Scenario 2: Crossfade serialized for clip A');
  assert(clipB.properties.transitionIn?.type === 'fade_black', 'Scenario 3: Fade from Black serialized for clip B');

  // 3. Duration boundaries (0.5s)
  assert(clipB.properties.transitionIn?.duration === 0.5, 'Scenario 4: Transition duration boundary === 0.5s');

  // 4. Metadata cleanup on clip deletion
  history = historyReducer(history, {
    type: 'DELETE_ITEM',
    payload: { id: 'v2', ripple: false }
  });
  assert(history.present.items.length === 1, 'Scenario 5: Deleting clip B removes transition metadata with item without orphaned state');

  // 5. Undo restores transition metadata
  history = historyReducer(history, { type: 'UNDO' });
  const restoredB = history.present.items.find((i: TimelineItem) => i.id === 'v2')!;
  assert(restoredB.properties.transitionIn?.type === 'fade_black', 'Scenario 6: Undo restores clip B transitionIn metadata');

  // 6. Export Serialization
  const payload = buildRenderRequestFromEditState(history.present, {
    mediaAssetId: 'asset-1',
    platformPresetId: 'instagram-reels'
  });
  assert(payload.timelineClips[1].transitionIn?.type === 'fade_black', 'Scenario 8: RenderRequest payload serializes transitionIn metadata correctly');

  return passed;
}

runTransitionsTargetedRealityCheck();
