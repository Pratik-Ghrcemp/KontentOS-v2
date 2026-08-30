import { WaveformData } from './types';

export interface SilenceInterval {
  id: string;
  start: number;      // Start timestamp in seconds
  end: number;        // End timestamp in seconds
  duration: number;   // Interval duration in seconds
  confidence: number; // 0.0 to 1.0
}

export interface SilenceDetectionOptions {
  amplitudeThreshold?: number; // Normalized threshold (default 0.02)
  minSilenceDuration?: number; // Minimum silence duration in seconds (default 0.4s)
  paddingDuration?: number;    // Speech safety buffer padding in seconds (default 0.08s)
  mergeThresholdMs?: number;   // Merge gaps closer than ms (default 100ms)
}

/**
 * Pure, deterministic, non-mutating function to detect silent time intervals
 * from waveform amplitude peaks.
 */
export function detectSilenceIntervals(
  data: WaveformData,
  options: SilenceDetectionOptions = {}
): SilenceInterval[] {
  if (!data || !data.peaks || data.peaks.length === 0 || data.duration <= 0) {
    return [];
  }

  const threshold = options.amplitudeThreshold ?? 0.02;
  const minDuration = options.minSilenceDuration ?? 0.4;
  const padding = options.paddingDuration ?? 0.08;
  const mergeGap = (options.mergeThresholdMs ?? 100) / 1000;

  const numSamples = data.peaks.length;
  const sampleDuration = data.duration / numSamples;

  // Step 1: Collect raw silent sample ranges
  const rawRanges: Array<{ start: number; end: number }> = [];
  let rangeStart: number | null = null;

  for (let i = 0; i < numSamples; i++) {
    const isSilent = data.peaks[i] <= threshold;
    const time = i * sampleDuration;

    if (isSilent) {
      if (rangeStart === null) {
        rangeStart = time;
      }
    } else {
      if (rangeStart !== null) {
        rawRanges.push({ start: rangeStart, end: time });
        rangeStart = null;
      }
    }
  }

  if (rangeStart !== null) {
    rawRanges.push({ start: rangeStart, end: data.duration });
  }

  if (rawRanges.length === 0) {
    return [];
  }

  // Step 2: Merge adjacent silence ranges closer than mergeGap
  const mergedRanges: Array<{ start: number; end: number }> = [];
  let current = { ...rawRanges[0] };

  for (let i = 1; i < rawRanges.length; i++) {
    const next = rawRanges[i];
    if (next.start - current.end <= mergeGap) {
      current.end = next.end;
    } else {
      mergedRanges.push(current);
      current = { ...next };
    }
  }
  mergedRanges.push(current);

  // Step 3: Apply safety speech padding and duration filtering
  const finalIntervals: SilenceInterval[] = [];

  mergedRanges.forEach((range, idx) => {
    // Preserve padding at speech edges (start/end of file don't need inner padding)
    const paddedStart = range.start === 0 ? 0 : Math.min(range.end, range.start + padding);
    const paddedEnd = range.end === data.duration ? data.duration : Math.max(paddedStart, range.end - padding);
    const duration = Number((paddedEnd - paddedStart).toFixed(3));

    if (duration >= minDuration) {
      finalIntervals.push({
        id: `silence-${idx + 1}`,
        start: Number(paddedStart.toFixed(3)),
        end: Number(paddedEnd.toFixed(3)),
        duration,
        confidence: 1.0
      });
    }
  });

  return finalIntervals;
}
