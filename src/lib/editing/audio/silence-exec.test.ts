import { historyReducer } from '../engine';
import { generateSilenceCutPlan } from './plan';
import { SilenceInterval } from './silence';
import { EditState, HistoryState, TimelineItem } from '../types';

export function runSilenceExecutionSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING ATOMIC SILENCE CUT PLAN REDUCER & HISTORY EXECUTION SANITY TESTS ---');

  const videoClip: TimelineItem = {
    id: 'v1', trackId: 'track-video-1', type: 'video', start: 0, end: 12, sourceIn: 0, sourceOut: 12, properties: {}
  };
  const voiceClip: TimelineItem = {
    id: 'a1', trackId: 'track-audio-1', type: 'audio', start: 0, end: 12, sourceIn: 0, sourceOut: 12, properties: {}
  };
  const bgmClip: TimelineItem = {
    id: 'bgm1', trackId: 'track-bgm-1', type: 'audio', start: 0, end: 12, sourceIn: 0, sourceOut: 12, properties: {}
  };
  const capInside: TimelineItem = {
    id: 'cap1', trackId: 'track-caption-1', type: 'caption', start: 3.2, end: 4.2, label: 'Inside Silence', properties: {}
  };
  const capAfter: TimelineItem = {
    id: 'cap2', trackId: 'track-caption-1', type: 'caption', start: 10.0, end: 11.5, label: 'After Silence', properties: {}
  };

  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-audio-1', label: 'Voice Audio', type: 'audio', locked: false, muted: false, visible: true, color: 'green' },
      { id: 'track-bgm-1', label: 'BGM Track', type: 'audio', locked: false, muted: false, visible: true, color: 'purple' },
      { id: 'track-caption-1', label: 'Captions', type: 'caption', locked: false, muted: false, visible: true, color: 'amber' }
    ],
    items: [videoClip, voiceClip, bgmClip, capInside, capAfter],
    selection: ['cap1', 'cap2'],
    duration: 12
  };

  let history: HistoryState = { past: [], present: initialEditState, future: [] };
  const initialSnapshotJSON = JSON.stringify(history.present);

  // SECTION A: Execution Correctness & Multi-Track Sync
  const silenceIntervals: SilenceInterval[] = [
    { id: 's1', start: 3.0, end: 5.0, duration: 2.0, confidence: 1.0 }, // 2s cut
    { id: 's2', start: 7.0, end: 9.0, duration: 2.0, confidence: 1.0 }  // 2s cut
  ];

  const plan = generateSilenceCutPlan(silenceIntervals, initialEditState);

  // Dispatch single atomic action to historyReducer
  history = historyReducer(history, {
    type: 'APPLY_SILENCE_CUT_PLAN',
    payload: plan
  });

  const editedState = history.present;
  const editedSnapshotJSON = JSON.stringify(editedState);

  assert(history.past.length === 1, 'Section D: Exactly 1 history entry created in past stack');
  assert(history.future.length === 0, 'Section D: Future stack cleared');

  // Check state mutations
  assert(editedState.duration === 8.0, 'Section C: Recalculated state.duration === 8.0s');
  assert(editedState.items.some(i => i.id === 'v1'), 'Section A: Video clip v1 present');
  assert(editedState.items.some(i => i.id === 'a1'), 'Section A: Voice clip a1 present');
  assert(!editedState.items.some(i => i.id === 'cap1'), 'Section B: Deleted caption cap1 removed from items');
  assert(!editedState.selection.includes('cap1'), 'Section C: Deleted caption cap1 purged from selection');
  assert(editedState.selection.includes('cap2'), 'Section C: Remaining caption cap2 preserved in selection');

  const cap2Edited = editedState.items.find(i => i.id === 'cap2')!;
  assert(cap2Edited.start === 6.0 && cap2Edited.end === 7.5, 'Section B: Caption cap2 shifted left to 6.0-7.5s');

  const bgmEdited = editedState.items.find(i => i.id === 'bgm1')!;
  assert(bgmEdited.end === 8.0, 'Section B: BGM continuous music end shrunk to 8.0s');

  // SECTION D: Mandatory Atomic History Verification with DEEP EQUALITY
  // 1. UNDO
  history = historyReducer(history, { type: 'UNDO' });
  const restoredSnapshotJSON = JSON.stringify(history.present);
  assert(restoredSnapshotJSON === initialSnapshotJSON, 'Section D: UNDO present state deep-equals exact Initial EditState');
  assert(history.past.length === 0, 'Section D: Past stack empty after Undo');
  assert(history.future.length === 1, 'Section D: Future stack contains 1 entry after Undo');

  // 2. REDO
  history = historyReducer(history, { type: 'REDO' });
  const redoSnapshotJSON = JSON.stringify(history.present);
  assert(redoSnapshotJSON === editedSnapshotJSON, 'Section D: REDO present state deep-equals exact Edited EditState');
  assert(history.past.length === 1, 'Section D: Past stack has 1 entry after Redo');
  assert(history.future.length === 0, 'Section D: Future stack empty after Redo');

  // SECTION E: Determinism
  let history2: HistoryState = { past: [], present: initialEditState, future: [] };
  history2 = historyReducer(history2, { type: 'APPLY_SILENCE_CUT_PLAN', payload: plan });
  assert(JSON.stringify(history2.present) === editedSnapshotJSON, 'Section E: Determinism verified (Run A === Run B)');

  return passed;
}

runSilenceExecutionSanityTests();
