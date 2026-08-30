import { timeToPixels, pixelsToTime, getPixelsPerSecond } from './coords';
import { calculateTrimLeft, calculateTrimRight } from './trim';
import { calculateSplitClips } from './split';
import { calculateRippleShift } from './ripple';
import { TimelineItem } from '../types';

export function runTimelineSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING TIMELINE ENGINE SANITY TESTS ---');

  // 1. Coordinate math tests
  assert(timeToPixels(5, 10, 1000) === 500, 'timeToPixels(5, 10, 1000) === 500px');
  assert(pixelsToTime(500, 1000, 10) === 5, 'pixelsToTime(500px, 1000px, 10s) === 5s');
  assert(getPixelsPerSecond(10, 1000) === 100, 'getPixelsPerSecond(10s, 1000px) === 100px/s');

  // 2. Trim Left tests (sourceIn offset accuracy)
  const mockItem: TimelineItem = {
    id: 'clip-1',
    trackId: 'track-video-1',
    type: 'video',
    start: 2,
    end: 10,
    sourceIn: 0,
    sourceOut: 8,
    properties: { opacity: 100 }
  };

  const trimLeftResult = calculateTrimLeft(mockItem, 4); // Trim 2 seconds off left
  assert(trimLeftResult.start === 4, 'calculateTrimLeft start === 4');
  assert(trimLeftResult.end === 10, 'calculateTrimLeft end === 10');
  assert(trimLeftResult.sourceIn === 2, 'calculateTrimLeft sourceIn === 2');

  // 3. Trim Right tests (sourceOut offset accuracy)
  const trimRightResult = calculateTrimRight(mockItem, 7); // Trim right to 7s
  assert(trimRightResult.start === 2, 'calculateTrimRight start === 2');
  assert(trimRightResult.end === 7, 'calculateTrimRight end === 7');
  assert(trimRightResult.sourceOut === 5, 'calculateTrimRight sourceOut === 5');

  // 4. Split Clip tests (Dual clip generation & sourceIn offset continuity)
  const splitResult = calculateSplitClips(mockItem, 5); // Split at 5s
  assert(splitResult !== null, 'calculateSplitClips returns non-null dual clips');
  if (splitResult) {
    const [left, right] = splitResult;
    assert(left.start === 2 && left.end === 5, 'Left split clip start: 2, end: 5');
    assert(left.sourceOut === 3, 'Left split clip sourceOut === 3');
    assert(right.start === 5 && right.end === 10, 'Right split clip start: 5, end: 10');
    assert(right.sourceIn === 3, 'Right split clip sourceIn === 3');
  }

  // 5. Ripple Delete tests (Gap closure shift math)
  const itemA: TimelineItem = { id: 'a', trackId: 'track-1', type: 'video', start: 0, end: 4, properties: {} };
  const itemB: TimelineItem = { id: 'b', trackId: 'track-1', type: 'video', start: 4, end: 8, properties: {} };
  const itemC: TimelineItem = { id: 'c', trackId: 'track-1', type: 'video', start: 8, end: 12, properties: {} };

  const rippledItems = calculateRippleShift([itemA, itemB, itemC], itemB);
  assert(rippledItems.length === 2, 'Ripple delete itemB yields 2 items');
  assert(rippledItems[0].id === 'a' && rippledItems[0].start === 0 && rippledItems[0].end === 4, 'Item A unchanged (start: 0, end: 4)');
  assert(rippledItems[1].id === 'c' && rippledItems[1].start === 4 && rippledItems[1].end === 8, 'Item C shifted left by 4s (start: 4, end: 8)');

  return passed;
}

runTimelineSanityTests();
