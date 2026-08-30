import { generateSilenceCutPlan, calculateCumulativeShiftAtTime } from './plan';
import { SilenceInterval } from './silence';
import { EditState, TimelineItem } from '../types';

export function runSilencePlanSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING SILENCE REMOVAL EDIT PLAN GENERATOR SANITY TESTS ---');

  const mockVideo: TimelineItem = {
    id: 'v1', trackId: 'track-video-1', type: 'video', start: 0, end: 10, sourceIn: 0, sourceOut: 10, properties: {}
  };
  const mockBgm: TimelineItem = {
    id: 'bgm1', trackId: 'track-bgm-1', type: 'audio', start: 0, end: 10, sourceIn: 0, sourceOut: 10, properties: {}
  };
  const mockCapInside: TimelineItem = {
    id: 'cap1', trackId: 'track-caption-1', type: 'caption', start: 3.2, end: 4.2, label: 'Inside silence', properties: {}
  };
  const mockCapAfter: TimelineItem = {
    id: 'cap2', trackId: 'track-caption-1', type: 'caption', start: 10.0, end: 11.5, label: 'After silence', properties: {}
  };

  const initialEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-bgm-1', label: 'BGM Track', type: 'audio', locked: false, muted: false, visible: true, color: 'purple' },
      { id: 'track-caption-1', label: 'Captions', type: 'caption', locked: false, muted: false, visible: true, color: 'amber' }
    ],
    items: [mockVideo, mockBgm, mockCapInside, mockCapAfter],
    selection: [],
    duration: 12
  };

  // Group A: Basic Plan Generation
  const emptyPlan = generateSilenceCutPlan([], initialEditState);
  assert(emptyPlan.totalTimeSaved === 0 && emptyPlan.newDuration === 12, 'Group A1: No silence returns plan with 0 time saved and 12s duration');

  const silenceIntervals: SilenceInterval[] = [
    { id: 's1', start: 3.0, end: 5.0, duration: 2.0, confidence: 1.0 }, // Cut 1: 2s
    { id: 's2', start: 7.0, end: 9.0, duration: 2.0, confidence: 1.0 }  // Cut 2: 2s
  ];

  const plan = generateSilenceCutPlan(silenceIntervals, initialEditState);
  assert(plan.totalTimeSaved === 4.0, 'Group A2: Total time saved === 4.0s');
  assert(plan.newDuration === 8.0, 'Group A3: New composition duration === 8.0s');

  // Group B & C: Timeline Shift Mapping & Multiple Cut Accumulation
  const shiftAt2 = calculateCumulativeShiftAtTime(2.0, plan.shiftMap.cutIntervals);
  const shiftAt6 = calculateCumulativeShiftAtTime(6.0, plan.shiftMap.cutIntervals);
  const shiftAt10 = calculateCumulativeShiftAtTime(10.0, plan.shiftMap.cutIntervals);

  assert(shiftAt2 === 0.0, 'Group B: Shift before first cut (t=2s) === 0.0s');
  assert(shiftAt6 === 2.0, 'Group B: Shift after first cut (t=6s) === 2.0s');
  assert(shiftAt10 === 4.0, 'Group C: Accumulated shift after both cuts (t=10s) === 4.0s');

  // Group D: Item Classification & Multi-Track Synchronization
  const capInsideAction = plan.itemActions.find(a => a.itemId === 'cap1')!;
  assert(capInsideAction.action === 'delete', 'Group D1: Caption inside silence interval is marked for deletion');

  const capAfterAction = plan.itemActions.find(a => a.itemId === 'cap2')!;
  assert(capAfterAction.action === 'shift' && capAfterAction.newStart === 6.0 && capAfterAction.newEnd === 7.5, 'Group D2: Caption after silence is shifted left from 10.0-11.5s to 6.0-7.5s');

  const bgmAction = plan.itemActions.find(a => a.itemId === 'bgm1')!;
  assert(bgmAction.action === 'shrink_duration' && bgmAction.newEnd === 6.0, 'Group D3: BGM continuous music shrinks end to 6.0s');

  // Group E: Immutability Guarantee
  assert(initialEditState.duration === 12, 'Group E: Original editState duration remains untouched (12s)');
  assert(initialEditState.items[0].end === 10, 'Group E: Original video item end remains untouched (10s)');

  // Group F: Determinism
  const planRunA = generateSilenceCutPlan(silenceIntervals, initialEditState);
  const planRunB = generateSilenceCutPlan(silenceIntervals, initialEditState);
  assert(JSON.stringify(planRunA) === JSON.stringify(planRunB), 'Group F: Repeated execution is 100% deterministic (Run A === Run B)');

  return passed;
}

runSilencePlanSanityTests();
