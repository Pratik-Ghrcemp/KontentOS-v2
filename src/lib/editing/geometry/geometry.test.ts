import { rotatePointAroundCenter, scalePointRelativeToBounds, normalizeAngle } from './transforms';
import { getGroupBounds, getItemBounds } from './bounds';
import { intersectsBox, getSelectionIntersection } from './selection';
import { TimelineItem } from '../types';

/**
 * Pure Geometry Unit Sanity Verification Suite
 * Executes runtime mathematical validation of transformation, bounding box, and intersection pure functions.
 */
export function runGeometrySanityChecks(): { passed: boolean; testCount: number; failures: string[] } {
  const failures: string[] = [];
  let testCount = 0;

  function assert(condition: boolean, testName: string) {
    testCount++;
    if (!condition) {
      failures.push(testName);
    }
  }

  function assertNear(actual: number, expected: number, tolerance = 0.001, testName: string) {
    testCount++;
    if (Math.abs(actual - expected) > tolerance) {
      failures.push(`${testName}: expected ${expected}, got ${actual}`);
    }
  }

  // 1. Point Rotation Math
  const pt = { x: 10, y: 0 };
  const center = { x: 0, y: 0 };
  const rot90 = rotatePointAroundCenter(pt, center, 90);
  assertNear(rot90.x, 0, 0.001, 'Rotation 90 deg X');
  assertNear(rot90.y, 10, 0.001, 'Rotation 90 deg Y');

  const rot180 = rotatePointAroundCenter(pt, center, 180);
  assertNear(rot180.x, -10, 0.001, 'Rotation 180 deg X');
  assertNear(rot180.y, 0, 0.001, 'Rotation 180 deg Y');

  // 2. Angle Normalization
  assert(normalizeAngle(270) === -90, 'Normalize 270 deg -> -90 deg');
  assert(normalizeAngle(-200) === 160, 'Normalize -200 deg -> 160 deg');
  assert(normalizeAngle(180) === 180, 'Normalize 180 deg');

  // 3. Proportional Spatial Scaling Relative to Bounds
  const oldBox = { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100, centerX: 50, centerY: 50 };
  const newBox = { minX: 0, minY: 0, maxX: 200, maxY: 300, width: 200, height: 300, centerX: 100, centerY: 150 };
  const scaledPt = scalePointRelativeToBounds({ x: 50, y: 50 }, oldBox, newBox);
  assertNear(scaledPt.x, 100, 0.001, 'Scale Relative X');
  assertNear(scaledPt.y, 150, 0.001, 'Scale Relative Y');

  // 4. Combined Group Bounds Calculation
  const itemA: TimelineItem = {
    id: 'item-a',
    trackId: 't1',
    type: 'video',
    start: 0,
    end: 10,
    properties: { x: -100, y: -50, scale: 100, rotation: 0 }
  };
  const itemB: TimelineItem = {
    id: 'item-b',
    trackId: 't2',
    type: 'text',
    start: 0,
    end: 10,
    content: 'Sample Title Text Overlay',
    properties: { x: 150, y: 100, fontSize: 32, rotation: 0 }
  };

  const groupBounds = getGroupBounds([itemA, itemB]);
  assert(groupBounds !== null, 'Group bounds non-null');
  if (groupBounds) {
    assert(groupBounds.minX < (itemA.properties.x ?? 0), 'Group minX encloses item A');
    assert(groupBounds.maxX > (itemB.properties.x ?? 0), 'Group maxX encloses item B');
  }

  // 5. Marquee Box Intersection Math
  const boxA = { minX: 10, minY: 10, maxX: 50, maxY: 50, width: 40, height: 40, centerX: 30, centerY: 30 };
  const boxB = { minX: 40, minY: 40, maxX: 80, maxY: 80, width: 40, height: 40, centerX: 60, centerY: 60 };
  const boxC = { minX: 100, minY: 100, maxX: 150, maxY: 150, width: 50, height: 50, centerX: 125, centerY: 125 };

  assert(intersectsBox(boxA, boxB) === true, 'Overlapping boxes intersect');
  assert(intersectsBox(boxA, boxC) === false, 'Disjoint boxes do not intersect');

  const marqueeHits = getSelectionIntersection(boxA, [itemA, itemB]);
  assert(Array.isArray(marqueeHits), 'Marquee intersection returns string array');

  // 6. Canvas Center Snap Calculation Math (Threshold: 12px)
  const SNAP_THRESHOLD = 12;
  const calculateCenterSnap = (x: number, y: number) => ({
    x: Math.abs(x) < SNAP_THRESHOLD ? 0 : Math.round(x),
    y: Math.abs(y) < SNAP_THRESHOLD ? 0 : Math.round(y),
    snapX: Math.abs(x) < SNAP_THRESHOLD,
    snapY: Math.abs(y) < SNAP_THRESHOLD
  });

  const snap1 = calculateCenterSnap(8, -5);
  assert(snap1.x === 0 && snap1.snapX === true, 'Center snap X: 8px -> 0px');
  assert(snap1.y === 0 && snap1.snapY === true, 'Center snap Y: -5px -> 0px');

  const snap2 = calculateCenterSnap(45, -80);
  assert(snap2.x === 45 && snap2.snapX === false, 'No snap X: 45px preserved');
  assert(snap2.y === -80 && snap2.snapY === false, 'No snap Y: -80px preserved');

  const passed = failures.length === 0;
  return { passed, testCount, failures };
}
