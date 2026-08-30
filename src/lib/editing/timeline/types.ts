export interface TimelineTimeRange {
  start: number;
  end: number;
}

export interface TrimResult {
  start: number;
  end: number;
  sourceIn?: number;
  sourceOut?: number;
}

export interface SplitResult {
  leftClip: any;
  rightClip: any;
}
