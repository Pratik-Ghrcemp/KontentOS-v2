import { Point, BoundingBox, CornerQuadrant } from './types';

/**
 * Rotates a 2D point around a center origin by specified degrees.
 */
export function rotatePointAroundCenter(point: Point, center: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos)
  };
}

/**
 * Scales a 2D point relative to old bounding box boundaries into new bounding box boundaries.
 * Used for proportional group scaling.
 */
export function scalePointRelativeToBounds(point: Point, oldBounds: BoundingBox, newBounds: BoundingBox): Point {
  if (oldBounds.width <= 0 || oldBounds.height <= 0) return { ...point };

  const relX = (point.x - oldBounds.minX) / oldBounds.width;
  const relY = (point.y - oldBounds.minY) / oldBounds.height;

  return {
    x: newBounds.minX + relX * newBounds.width,
    y: newBounds.minY + relY * newBounds.height
  };
}

/**
 * Calculates new group bounding box given handle quadrant and canvas displacement.
 */
export function calculateResizedGroupBounds(
  initialBounds: BoundingBox,
  corner: CornerQuadrant,
  canvasDx: number,
  canvasDy: number
): BoundingBox {
  let minX = initialBounds.minX;
  let minY = initialBounds.minY;
  let maxX = initialBounds.maxX;
  let maxY = initialBounds.maxY;

  switch (corner) {
    case 'top-left':
      minX += canvasDx;
      minY += canvasDy;
      break;
    case 'top-right':
      maxX += canvasDx;
      minY += canvasDy;
      break;
    case 'bottom-left':
      minX += canvasDx;
      maxY += canvasDy;
      break;
    case 'bottom-right':
      maxX += canvasDx;
      maxY += canvasDy;
      break;
  }

  const width = Math.max(maxX - minX, 40);
  const height = Math.max(maxY - minY, 40);

  return {
    minX,
    minY,
    maxX: minX + width,
    maxY: minY + height,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2
  };
}

/**
 * Calculates directional corner resize delta vector per handle quadrant.
 */
export function getCornerResizeDelta(corner: CornerQuadrant, dx: number, dy: number): number {
  switch (corner) {
    case 'top-left': return -dx - dy;
    case 'top-right': return dx - dy;
    case 'bottom-left': return -dx + dy;
    case 'bottom-right': default: return dx + dy;
  }
}

/**
 * Normalizes rotation angle into standard [-180, +180] degree range.
 */
export function normalizeAngle(angleDeg: number): number {
  let normalized = Math.round(angleDeg);
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Calculates pointer angle in degrees relative to a center point.
 */
export function calculatePointerAngle(pointer: Point, center: Point): number {
  return Math.atan2(pointer.y - center.y, pointer.x - center.x) * (180 / Math.PI);
}

/**
 * Computes rotation delta across branch-cuts and returns normalized rotation.
 */
export function calculateNormalizedAngleDelta(startAngle: number, currentAngle: number, initialRotation: number): number {
  let deltaAngle = currentAngle - startAngle;
  if (deltaAngle > 180) deltaAngle -= 360;
  if (deltaAngle < -180) deltaAngle += 360;

  return normalizeAngle(initialRotation + deltaAngle);
}
