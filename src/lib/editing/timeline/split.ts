import { TimelineItem } from '../types';

/**
 * Pure calculation for splitting a TimelineItem into two sequential clips at splitTime.
 */
export function calculateSplitClips(item: TimelineItem, splitTime: number): [TimelineItem, TimelineItem] | null {
  if (splitTime <= item.start || splitTime >= item.end) return null;

  const dt = splitTime - item.start;
  const initialSourceIn = item.sourceIn ?? 0;

  const leftClip: TimelineItem = {
    ...item,
    end: splitTime,
    sourceOut: initialSourceIn + dt
  };

  const rightClip: TimelineItem = {
    ...item,
    id: `clip-${crypto.randomUUID()}`,
    start: splitTime,
    sourceIn: initialSourceIn + dt
  };

  return [leftClip, rightClip];
}
