import { TimelineItem } from '../types';
import { TrimResult } from './types';

/**
 * Pure calculation for left-edge clip trimming (adjusts start time and sourceIn offset).
 */
export function calculateTrimLeft(item: TimelineItem, proposedStart: number, minDuration = 0.5): TrimResult {
  const maxStart = item.end - minDuration;
  const clampedStart = Math.max(0, Math.min(proposedStart, maxStart));
  const dt = clampedStart - item.start;
  const initialSourceIn = item.sourceIn ?? 0;
  const newSourceIn = Math.max(0, initialSourceIn + dt);

  return {
    start: clampedStart,
    end: item.end,
    sourceIn: newSourceIn,
    sourceOut: item.sourceOut
  };
}

/**
 * Pure calculation for right-edge clip trimming (adjusts end time and sourceOut offset).
 */
export function calculateTrimRight(item: TimelineItem, proposedEnd: number, minDuration = 0.5): TrimResult {
  const minEnd = item.start + minDuration;
  const clampedEnd = Math.max(minEnd, proposedEnd);
  const dt = clampedEnd - item.end;
  const initialSourceOut = item.sourceOut ?? (item.end - item.start);
  const newSourceOut = Math.max(minDuration, initialSourceOut + dt);

  return {
    start: item.start,
    end: clampedEnd,
    sourceIn: item.sourceIn,
    sourceOut: newSourceOut
  };
}
