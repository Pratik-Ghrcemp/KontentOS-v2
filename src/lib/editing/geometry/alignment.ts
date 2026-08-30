export interface AlignmentResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  alignedXValue?: number;
  alignedYValue?: number;
}

/**
 * Pure calculation helper to compute center canvas snapping & object-to-object alignment.
 */
export function calculateObjectAlignment(
  targetX: number,
  targetY: number,
  otherElements: Array<{ x: number; y: number }>,
  threshold: number = 10
): AlignmentResult {
  let snappedX = false;
  let snappedY = false;
  let finalX = targetX;
  let finalY = targetY;
  let alignedXValue: number | undefined = undefined;
  let alignedYValue: number | undefined = undefined;

  // 1. Canvas Center Axis Alignment (X = 0, Y = 0)
  if (Math.abs(targetX) < threshold) {
    finalX = 0;
    snappedX = true;
    alignedXValue = 0;
  }
  if (Math.abs(targetY) < threshold) {
    finalY = 0;
    snappedY = true;
    alignedYValue = 0;
  }

  // 2. Object-to-Object Alignment (Centers & Edges)
  for (const other of otherElements) {
    if (!snappedX && Math.abs(targetX - other.x) < threshold) {
      finalX = other.x;
      snappedX = true;
      alignedXValue = other.x;
    }
    if (!snappedY && Math.abs(targetY - other.y) < threshold) {
      finalY = other.y;
      snappedY = true;
      alignedYValue = other.y;
    }
  }

  return {
    x: finalX,
    y: finalY,
    snappedX,
    snappedY,
    alignedXValue,
    alignedYValue
  };
}
