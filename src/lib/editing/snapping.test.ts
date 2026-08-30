import { calculateSnap, historyReducer } from './engine';
import { EditState, HistoryState, TimelineItem } from './types';

export function runSnappingSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING PHASE 5K MAGNETIC TIMELINE SNAPPING SANITY TESTS ---');

  const clip1: TimelineItem = {
    id: 'clip-1',
    trackId: 'track-video-1',
    type: 'video',
    start: 0.0,
    end: 4.0,
    properties: {}
  };

  const clip2: TimelineItem = {
    id: 'clip-2',
    trackId: 'track-video-1',
    type: 'video',
    start: 4.15, // Currently slightly un-aligned with clip1.end (4.0s)
    end: 8.15,
    properties: {}
  };

  const editState: EditState = {
    tracks: [{ id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' }],
    items: [clip1, clip2],
    selection: ['clip-2'],
    markers: [
      { id: 'm1', time: 6.0, label: 'Scene Change', color: 'amber' }
    ],
    duration: 10
  };

  // 1. Snap to 0s Timeline Start
  const snapToZero = calculateSnap(0.1, editState, 'clip-2', 0.25);
  assert(snapToZero.snapped === true, 'Test 1: Snapped near 0s start threshold');
  assert(snapToZero.time === 0.0, 'Test 1: Snapped time === 0.0s');

  // 2. Snap to Playhead Time
  const snapToPlayhead = calculateSnap(3.45, editState, 'clip-2', 0.25, 3.5);
  assert(snapToPlayhead.snapped === true, 'Test 2: Snapped near playhead threshold (3.5s)');
  assert(snapToPlayhead.time === 3.5, 'Test 2: Snapped time === 3.5s');

  // 3. Snap to Neighboring Clip End (clip1.end = 4.0s)
  const snapToClipEnd = calculateSnap(4.15, editState, 'clip-2', 0.25);
  assert(snapToClipEnd.snapped === true, 'Test 3: Snapped clip-2.start (4.15s) to clip-1.end (4.0s)');
  assert(snapToClipEnd.time === 4.0, 'Test 3: Snapped time === 4.0s');

  // 4. Snap to Timeline Marker (m1.time = 6.0s)
  const snapToMarker = calculateSnap(5.9, editState, 'clip-2', 0.25);
  assert(snapToMarker.snapped === true, 'Test 4: Snapped clip-2 drag near marker (6.0s)');
  assert(snapToMarker.time === 6.0, 'Test 4: Snapped time === 6.0s');

  // 5. Far Drag Time (No Snap Triggered)
  const noSnap = calculateSnap(7.5, editState, 'clip-2', 0.25);
  assert(noSnap.snapped === false, 'Test 5: No snap triggered for far drag time (7.5s)');
  assert(noSnap.time === 7.5, 'Test 5: Time remains 7.5s');

  // 6. Snapped MOVE_ITEM Reducer Execution
  let history: HistoryState = { past: [], present: editState, future: [] };
  const snappedStart = snapToClipEnd.time; // 4.0s
  const duration = clip2.end - clip2.start; // 4.0s

  history = historyReducer(history, {
    type: 'MOVE_ITEM',
    payload: { id: 'clip-2', newStart: snappedStart, newEnd: snappedStart + duration }
  });

  const movedClip = history.present.items.find(i => i.id === 'clip-2');
  assert(movedClip?.start === 4.0, 'Test 6: clip-2.start cleanly snapped to 4.0s in editState');
  assert(movedClip?.end === 8.0, 'Test 6: clip-2.end moved to 8.0s preserving 4.0s duration');

  return passed;
}

runSnappingSanityTests();
