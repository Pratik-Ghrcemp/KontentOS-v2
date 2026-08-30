import { BoundingBox } from './types';
import { TimelineItem } from '../types';
import { getItemBounds } from './bounds';

/**
 * Checks if two axis-aligned bounding boxes overlap/intersect.
 */
export function intersectsBox(boxA: BoundingBox, boxB: BoundingBox): boolean {
  return !(
    boxA.maxX < boxB.minX ||
    boxA.minX > boxB.maxX ||
    boxA.maxY < boxB.minY ||
    boxA.minY > boxB.maxY
  );
}

/**
 * Filters items whose bounding boxes intersect with a marquee selection box.
 * Used for marquee rubberband drag-to-select.
 */
export function getSelectionIntersection(
  marqueeBox: BoundingBox,
  items: TimelineItem[],
  defaultCanvasWidth = 320,
  defaultCanvasHeight = 180
): string[] {
  return items
    .filter(item => {
      const itemBox = getItemBounds(item, defaultCanvasWidth, defaultCanvasHeight);
      return intersectsBox(marqueeBox, itemBox);
    })
    .map(item => item.id);
}
