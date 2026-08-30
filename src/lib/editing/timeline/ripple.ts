import { TimelineItem } from '../types';

/**
 * Pure calculation for ripple deletion gap closure.
 * Shifts subsequent clips on the same track to fill deleted clip's temporal gap.
 */
export function calculateRippleShift(items: TimelineItem[], deletedItem: TimelineItem): TimelineItem[] {
  const gap = deletedItem.end - deletedItem.start;

  return items
    .filter(i => i.id !== deletedItem.id)
    .map(item => {
      if (item.trackId === deletedItem.trackId && item.start >= deletedItem.end) {
        return {
          ...item,
          start: item.start - gap,
          end: item.end - gap
        };
      }
      return item;
    });
}
