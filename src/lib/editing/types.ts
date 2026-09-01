export type TrackType = 'video' | 'audio' | 'caption' | 'text' | 'overlay';

export interface TimelineItemProperties {
  opacity?: number;
  scale?: number;
  rotation?: number;
  x?: number;
  y?: number;
  speed?: number;       // 0.25 to 4.0 (default 1.0)
  reversed?: boolean;   // default false
  fadeInDuration?: number;  // seconds (default 0.0)
  fadeOutDuration?: number; // seconds (default 0.0)
  brightness?: number;
  contrast?: number;
  saturation?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  preset?: string;
  zIndex?: number;
  [key: string]: any;
}

export interface KeyframePropertyValues {
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  rotation?: number;
  [key: string]: any;
}

export interface Keyframe {
  id: string;
  time: number; // Offset in seconds from clip start (0 <= time <= duration)
  properties: KeyframePropertyValues;
}

export interface TimelineItem {
  id: string;
  trackId: string;
  type: TrackType;
  start: number;
  end: number;
  sourceIn?: number;
  sourceOut?: number;
  assetId?: string;
  content?: string;
  label?: string;
  properties: TimelineItemProperties;
  keyframes?: Keyframe[];
}

export interface Track {
  id: string;
  label: string;
  type: TrackType;
  locked: boolean;
  muted: boolean;
  visible: boolean;
  color: string;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

export interface EditState {
  tracks: Track[];
  items: TimelineItem[];
  selection: string[];
  duration: number; // Overall composition duration
  markers?: TimelineMarker[];
}

export interface HistoryState {
  past: EditState[];
  present: EditState;
  future: EditState[];
  transientBaseState?: EditState | null;
}

export type EditAction = 
  | { type: 'ADD_ITEM'; payload: TimelineItem }
  | { type: 'MOVE_ITEM'; payload: { id: string; newStart: number; newEnd: number }; meta?: { isTransient?: boolean } }
  | { type: 'TRIM_ITEM'; payload: { id: string; newStart: number; newEnd: number; newSourceIn?: number; newSourceOut?: number }; meta?: { isTransient?: boolean } }
  | { type: 'SPLIT_ITEM'; payload: { id: string; time: number } }
  | { type: 'DUPLICATE_ITEM'; payload: { id: string } }
  | { type: 'DELETE_ITEM'; payload: { id: string; ripple?: boolean } }
  | { type: 'SET_SELECTION'; payload: string[] }
  | { type: 'UPDATE_PROPERTIES'; payload: { id: string; properties: Record<string, any> }; meta?: { isTransient?: boolean } }
  | { type: 'BATCH_UPDATE_PROPERTIES'; payload: Array<{ id: string; properties: Record<string, any> }>; meta?: { isTransient?: boolean } }
  | { type: 'APPLY_SILENCE_CUT_PLAN'; payload: import('./audio/plan').SilenceRemovalEditPlan }
  | { type: 'APPLY_AI_SUGGESTIONS'; payload: import('./proposal-compiler').ApplyAiSuggestionsPlan }
  | { type: 'APPLY_STORYBOARD'; payload: import('./storyboard-compiler').ApplyStoryboardPlan }
  | { type: 'APPLY_AUDIO_ASSETS'; payload: { newItems: TimelineItem[] } }
  | { type: 'APPLY_VISUAL_ASSETS'; payload: { newItems: TimelineItem[] } }
  | { type: 'ADD_MARKER'; payload: TimelineMarker }
  | { type: 'DELETE_MARKER'; payload: { id: string } }
  | { type: 'ADD_KEYFRAME'; payload: { itemId: string; keyframe: Keyframe } }
  | { type: 'DELETE_KEYFRAME'; payload: { itemId: string; keyframeId: string } }
  | { type: 'UPDATE_KEYFRAME'; payload: { itemId: string; keyframeId: string; properties: KeyframePropertyValues }; meta?: { isTransient?: boolean } }
  | { type: 'REORDER_ITEM_LAYER'; payload: { itemId: string; direction: 'bring_forward' | 'send_backward' | 'bring_to_front' | 'send_to_back' } }
  | { type: 'TOGGLE_TRACK_LOCK'; payload: { id: string } }
  | { type: 'TOGGLE_TRACK_MUTE'; payload: { id: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_STATE'; payload: EditState }; // For initialization

