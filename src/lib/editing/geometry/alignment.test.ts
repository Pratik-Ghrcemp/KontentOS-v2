import { calculateObjectAlignment } from './alignment';

export function runAlignmentSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING PHASE 5L SMART OBJECT ALIGNMENT SANITY TESTS ---');

  const otherElements = [
    { x: 100, y: 150 },
    { x: -200, y: -50 }
  ];

  // 1. Center Canvas Alignment (X = 0, Y = 0)
  const centerSnap = calculateObjectAlignment(5, -6, otherElements, 10);
  assert(centerSnap.snappedX === true, 'Test 1: Snapped X to center canvas 0');
  assert(centerSnap.x === 0, 'Test 1: Snapped x === 0');
  assert(centerSnap.snappedY === true, 'Test 1: Snapped Y to center canvas 0');
  assert(centerSnap.y === 0, 'Test 1: Snapped y === 0');

  // 2. Object-to-Object X Alignment (targetX=95 near other.x=100)
  const objectXSnap = calculateObjectAlignment(95, 30, otherElements, 10);
  assert(objectXSnap.snappedX === true, 'Test 2: Snapped X to other element (100)');
  assert(objectXSnap.x === 100, 'Test 2: x === 100');
  assert(objectXSnap.snappedY === false, 'Test 2: Y not snapped');

  // 3. Object-to-Object Y Alignment (targetY=154 near other.y=150)
  const objectYSnap = calculateObjectAlignment(40, 154, otherElements, 10);
  assert(objectYSnap.snappedY === true, 'Test 3: Snapped Y to other element (150)');
  assert(objectYSnap.y === 150, 'Test 3: y === 150');

  // 4. Outside Threshold (No Snap)
  const noSnap = calculateObjectAlignment(40, 40, otherElements, 10);
  assert(noSnap.snappedX === false, 'Test 4: No X snap outside threshold');
  assert(noSnap.snappedY === false, 'Test 4: No Y snap outside threshold');
  assert(noSnap.x === 40, 'Test 4: x remains 40');
  assert(noSnap.y === 40, 'Test 4: y remains 40');

  return passed;
}

runAlignmentSanityTests();
