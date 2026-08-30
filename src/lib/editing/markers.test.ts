import { historyReducer } from './engine';
import { EditState, HistoryState } from './types';

export function runTimelineMarkerSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING TIMELINE MARKERS & UNDO/REDO SANITY TESTS ---');

  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' }
    ],
    items: [],
    selection: [],
    duration: 10,
    markers: []
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };

  // 1. ADD_MARKER at t=3.5s
  history = historyReducer(history, {
    type: 'ADD_MARKER',
    payload: { id: 'm1', time: 3.5, label: 'Marker 1', color: 'amber' }
  });

  assert((history.present.markers || []).length === 1, 'Test 1: Marker m1 added to state.markers');
  assert(history.present.markers![0].time === 3.5, 'Test 1: Marker time === 3.5s');
  assert(history.past.length === 1, 'Test 1: Exactly 1 history entry created in past stack');

  // 2. Duplicate marker rejection at t=3.55s (within 0.1s threshold)
  history = historyReducer(history, {
    type: 'ADD_MARKER',
    payload: { id: 'm2', time: 3.55, label: 'Marker 2', color: 'amber' }
  });

  assert((history.present.markers || []).length === 1, 'Test 2: Duplicate marker within 0.1s threshold rejected');

  // 3. ADD_MARKER at t=7.0s
  history = historyReducer(history, {
    type: 'ADD_MARKER',
    payload: { id: 'm3', time: 7.0, label: 'Marker 2', color: 'amber' }
  });

  assert((history.present.markers || []).length === 2, 'Test 3: Second marker m3 added (total 2 markers)');
  assert(history.past.length === 2, 'Test 3: History past stack length === 2');

  // 4. UNDO
  history = historyReducer(history, { type: 'UNDO' });
  assert((history.present.markers || []).length === 1, 'Test 4: UNDO removes second marker m3');
  assert(history.present.markers![0].id === 'm1', 'Test 4: Present marker is m1');

  // 5. REDO
  history = historyReducer(history, { type: 'REDO' });
  assert((history.present.markers || []).length === 2, 'Test 5: REDO restores second marker m3');

  // 6. DELETE_MARKER m1
  history = historyReducer(history, { type: 'DELETE_MARKER', payload: { id: 'm1' } });
  assert((history.present.markers || []).length === 1, 'Test 6: DELETE_MARKER removes m1');
  assert(history.present.markers![0].id === 'm3', 'Test 6: Remaining marker is m3');

  // 7. UNDO DELETE
  history = historyReducer(history, { type: 'UNDO' });
  assert((history.present.markers || []).length === 2, 'Test 7: UNDO restores deleted marker m1');

  return passed;
}

runTimelineMarkerSanityTests();
