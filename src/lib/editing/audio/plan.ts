import { EditState, TimelineItem } from '../types';
import { SilenceInterval } from './silence';

export interface TimelineShiftMap {
  cutIntervals: Array<{ start: number; end: number; duration: number }>;
  totalTimeSaved: number;
  newCompositionDuration: number;
}

export interface PlannedItemAction {
  itemId: string;
  trackId: string;
  trackType: string;
  action: 'split_remove_shift' | 'trim' | 'shift' | 'delete' | 'preserve' | 'shrink_duration';
  originalStart: number;
  originalEnd: number;
  newStart: number;
  newEnd: number;
  newSourceIn?: number;
  newSourceOut?: number;
}

export interface SilenceRemovalEditPlan {
  targetTrackId: string;
  totalTimeSaved: number;
  originalDuration: number;
  newDuration: number;
  shiftMap: TimelineShiftMap;
  itemActions: PlannedItemAction[];
}

export interface PlanGeneratorOptions {
  primaryTrackId?: string; // Default 'track-video-1' or 'track-audio-1'
  targetClipId?: string;
}

/**
 * Calculates cumulative time shift at any given timestamp on the timeline.
 */
export function calculateCumulativeShiftAtTime(
  time: number,
  cutIntervals: Array<{ start: number; end: number; duration: number }>
): number {
  let shift = 0;
  for (const cut of cutIntervals) {
    if (time >= cut.end) {
      shift += cut.duration;
    } else if (time > cut.start && time < cut.end) {
      shift += (time - cut.start);
    }
  }
  return Number(shift.toFixed(3));
}

/**
 * Pure, deterministic, non-mutating function to generate a declarative SilenceRemovalEditPlan.
 * Does NOT mutate editState, dispatch actions, or modify UI.
 */
export function generateSilenceCutPlan(
  silenceIntervals: SilenceInterval[],
  editState: EditState,
  options: PlanGeneratorOptions = {}
): SilenceRemovalEditPlan {
  const primaryTrackId = options.primaryTrackId || 'track-video-1';
  const targetClip = editState.items.find(i => i.id === options.targetClipId) || editState.items.find(i => i.trackId === primaryTrackId);
  const clipOffset = targetClip ? targetClip.start : 0;

  // 1. Sort and prepare cut intervals
  const sortedIntervals = [...silenceIntervals].sort((a, b) => a.start - b.start);
  const cutIntervals = sortedIntervals.map(s => ({
    start: Number((s.start + clipOffset).toFixed(3)),
    end: Number((s.end + clipOffset).toFixed(3)),
    duration: Number((s.end - s.start).toFixed(3))
  }));

  const totalTimeSaved = Number(
    cutIntervals.reduce((sum, c) => sum + c.duration, 0).toFixed(3)
  );
  const originalDuration = editState.duration;
  const newCompositionDuration = Math.max(0, Number((originalDuration - totalTimeSaved).toFixed(3)));

  const shiftMap: TimelineShiftMap = {
    cutIntervals,
    totalTimeSaved,
    newCompositionDuration
  };

  if (cutIntervals.length === 0) {
    return {
      targetTrackId: primaryTrackId,
      totalTimeSaved: 0,
      originalDuration,
      newDuration: originalDuration,
      shiftMap,
      itemActions: editState.items.map(item => ({
        itemId: item.id,
        trackId: item.trackId,
        trackType: item.type,
        action: 'preserve',
        originalStart: item.start,
        originalEnd: item.end,
        newStart: item.start,
        newEnd: item.end,
        newSourceIn: item.sourceIn,
        newSourceOut: item.sourceOut
      }))
    };
  }

  // 2. Classify and compute planned actions for each timeline item
  const itemActions: PlannedItemAction[] = [];

  editState.items.forEach(item => {
    // Rule A: BGM Track (track-bgm-1) -> Continuous music, shrink composition duration
    if (item.trackId === 'track-bgm-1') {
      const newEnd = Math.max(item.start, Number((item.end - totalTimeSaved).toFixed(3)));
      itemActions.push({
        itemId: item.id,
        trackId: item.trackId,
        trackType: item.type,
        action: 'shrink_duration',
        originalStart: item.start,
        originalEnd: item.end,
        newStart: item.start,
        newEnd: newEnd,
        newSourceIn: item.sourceIn,
        newSourceOut: item.sourceOut
      });
      return;
    }

    // Rule B: Subtitle Captions (track-caption-1)
    if (item.type === 'caption' || item.trackId === 'track-caption-1') {
      // Check if caption falls inside a silence interval
      const insideSilence = cutIntervals.some(c => item.start >= c.start && item.end <= c.end);
      if (insideSilence) {
        itemActions.push({
          itemId: item.id,
          trackId: item.trackId,
          trackType: item.type,
          action: 'delete',
          originalStart: item.start,
          originalEnd: item.end,
          newStart: 0,
          newEnd: 0
        });
      } else {
        const shiftStart = calculateCumulativeShiftAtTime(item.start, cutIntervals);
        const shiftEnd = calculateCumulativeShiftAtTime(item.end, cutIntervals);
        itemActions.push({
          itemId: item.id,
          trackId: item.trackId,
          trackType: item.type,
          action: 'shift',
          originalStart: item.start,
          originalEnd: item.end,
          newStart: Number((item.start - shiftStart).toFixed(3)),
          newEnd: Number((item.end - shiftEnd).toFixed(3))
        });
      }
      return;
    }

    // Rule C: Independent Text/Titles (if not anchored to primary track)
    if (item.type === 'text' && item.properties?.independent) {
      itemActions.push({
        itemId: item.id,
        trackId: item.trackId,
        trackType: item.type,
        action: 'preserve',
        originalStart: item.start,
        originalEnd: item.end,
        newStart: item.start,
        newEnd: item.end
      });
      return;
    }

    // Rule D: Primary Video & Voice Audio Clips -> Split, remove silence, & shift
    const shiftStart = calculateCumulativeShiftAtTime(item.start, cutIntervals);
    const shiftEnd = calculateCumulativeShiftAtTime(item.end, cutIntervals);

    itemActions.push({
      itemId: item.id,
      trackId: item.trackId,
      trackType: item.type,
      action: 'split_remove_shift',
      originalStart: item.start,
      originalEnd: item.end,
      newStart: Number((item.start - shiftStart).toFixed(3)),
      newEnd: Number((item.end - shiftEnd).toFixed(3)),
      newSourceIn: item.sourceIn,
      newSourceOut: item.sourceOut
    });
  });

  return {
    targetTrackId: primaryTrackId,
    totalTimeSaved,
    originalDuration,
    newDuration: newCompositionDuration,
    shiftMap,
    itemActions
  };
}
