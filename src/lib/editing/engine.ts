import { EditState, EditAction, HistoryState, TimelineItem } from './types';
import { calculateSplitClips, calculateRippleShift } from './timeline';

const MAX_HISTORY = 50;

export const initialEditState: EditState = {
  tracks: [
    { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'var(--accent-cyan)' },
    { id: 'track-audio-1', label: 'Primary Audio', type: 'audio', locked: false, muted: false, visible: true, color: 'var(--accent-green)' },
    { id: 'track-bgm-1', label: 'BGM Track', type: 'audio', locked: false, muted: false, visible: true, color: 'var(--accent-purple)' },
    { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'var(--accent-rose)' },
    { id: 'track-caption-1', label: 'Captions', type: 'caption', locked: false, muted: false, visible: true, color: 'var(--accent-amber)' },
  ],
  items: [],
  selection: [],
  duration: 0,
};

export function recalculateDuration(items: TimelineItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.end), 0);
}

function isTrackLocked(state: EditState, trackId: string): boolean {
  const track = state.tracks.find(t => t.id === trackId);
  return Boolean(track?.locked);
}

export function timelineReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'ADD_ITEM': {
      if (isTrackLocked(state, action.payload.trackId)) return state;
      const newItems = [...state.items, action.payload];
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'MOVE_ITEM': {
      const target = state.items.find(i => i.id === action.payload.id);
      if (!target || isTrackLocked(state, target.trackId)) return state;
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, start: action.payload.newStart, end: action.payload.newEnd }
          : item
      );
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'TRIM_ITEM': {
      const target = state.items.find(i => i.id === action.payload.id);
      if (!target || isTrackLocked(state, target.trackId)) return state;
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? {
              ...item,
              start: action.payload.newStart,
              end: action.payload.newEnd,
              ...(action.payload.newSourceIn !== undefined && { sourceIn: action.payload.newSourceIn }),
              ...(action.payload.newSourceOut !== undefined && { sourceOut: action.payload.newSourceOut })
            }
          : item
      );
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'SPLIT_ITEM': {
      const target = state.items.find(i => i.id === action.payload.id);
      if (!target || isTrackLocked(state, target.trackId)) return state;
      
      const splitClips = calculateSplitClips(target, action.payload.time);
      if (!splitClips) return state;

      const newItems = state.items.filter(i => i.id !== target.id).concat(splitClips);
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'DUPLICATE_ITEM': {
      const target = state.items.find(i => i.id === action.payload.id);
      if (!target || isTrackLocked(state, target.trackId)) return state;
      
      const duration = target.end - target.start;
      const newClip = { ...target, id: `clip-${crypto.randomUUID()}`, start: target.end, end: target.end + duration };
      
      const newItems = [...state.items, newClip];
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'DELETE_ITEM': {
      const target = state.items.find(i => i.id === action.payload.id);
      if (!target || isTrackLocked(state, target.trackId)) return state;

      const newItems = action.payload.ripple
        ? calculateRippleShift(state.items, target)
        : state.items.filter(i => i.id !== action.payload.id);

      const newSelection = state.selection.filter(id => id !== action.payload.id);
      return { ...state, items: newItems, selection: newSelection, duration: recalculateDuration(newItems) };
    }

    case 'SET_SELECTION':
      return { ...state, selection: action.payload };

    case 'UPDATE_PROPERTIES': {
      const newItems = state.items.map(item => {
        if (item.id !== action.payload.id) return item;
        const newProperties = { ...item.properties, ...action.payload.properties };
        
        let newEnd = item.end;
        if (action.payload.properties.speed !== undefined && action.payload.properties.speed > 0) {
          const speed = action.payload.properties.speed;
          const sourceSpan = (item.sourceOut ?? item.end) - (item.sourceIn ?? item.start);
          newEnd = item.start + sourceSpan / speed;
        }

        return {
          ...item,
          end: newEnd,
          properties: newProperties
        };
      });
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'BATCH_UPDATE_PROPERTIES': {
      const updateMap = new Map(action.payload.map(u => [u.id, u.properties]));
      const newItems = state.items.map(item => {
        const props = updateMap.get(item.id);
        if (!props) return item;
        const newProperties = { ...item.properties, ...props };
        
        let newEnd = item.end;
        if (props.speed !== undefined && props.speed > 0) {
          const speed = props.speed;
          const sourceSpan = (item.sourceOut ?? item.end) - (item.sourceIn ?? item.start);
          newEnd = item.start + sourceSpan / speed;
        }

        return {
          ...item,
          end: newEnd,
          properties: newProperties
        };
      });
      return { ...state, items: newItems, duration: recalculateDuration(newItems) };
    }

    case 'APPLY_SILENCE_CUT_PLAN': {
      const plan = action.payload;
      if (!plan || !plan.itemActions || plan.itemActions.length === 0 || plan.totalTimeSaved <= 0) {
        return state;
      }

      const actionMap = new Map(plan.itemActions.map(a => [a.itemId, a]));
      const newItems: TimelineItem[] = [];

      state.items.forEach(item => {
        const plannedAction = actionMap.get(item.id);
        if (!plannedAction || plannedAction.action === 'preserve') {
          newItems.push(item);
          return;
        }

        if (plannedAction.action === 'delete') {
          return;
        }

        if (plannedAction.action === 'shift' || plannedAction.action === 'shrink_duration') {
          newItems.push({
            ...item,
            start: plannedAction.newStart,
            end: plannedAction.newEnd
          });
          return;
        }

        if (plannedAction.action === 'split_remove_shift') {
          newItems.push({
            ...item,
            start: plannedAction.newStart,
            end: plannedAction.newEnd,
            sourceIn: plannedAction.newSourceIn ?? item.sourceIn,
            sourceOut: plannedAction.newSourceOut ?? item.sourceOut
          });
        }
      });

      const newSelection = state.selection.filter(id => newItems.some(item => item.id === id));
      const newDuration = recalculateDuration(newItems);

      return {
        ...state,
        items: newItems,
        selection: newSelection,
        duration: newDuration
      };
    }

    case 'ADD_MARKER': {
      const currentMarkers = state.markers || [];
      // Prevent duplicate markers at effectively the same timestamp (within 0.1s threshold)
      if (currentMarkers.some(m => Math.abs(m.time - action.payload.time) < 0.1)) {
        return state;
      }
      const newMarkers = [...currentMarkers, action.payload].sort((a, b) => a.time - b.time);
      return { ...state, markers: newMarkers };
    }

    case 'DELETE_MARKER': {
      const currentMarkers = state.markers || [];
      const newMarkers = currentMarkers.filter(m => m.id !== action.payload.id);
      return { ...state, markers: newMarkers };
    }

    case 'ADD_KEYFRAME': {
      const { itemId, keyframe } = action.payload;
      const newItems = state.items.map(item => {
        if (item.id !== itemId) return item;
        const currentKfs = item.keyframes || [];
        // Replace existing keyframe if within 0.05s of same time
        const filtered = currentKfs.filter(k => Math.abs(k.time - keyframe.time) >= 0.05);
        const updatedKfs = [...filtered, keyframe].sort((a, b) => a.time - b.time);
        return { ...item, keyframes: updatedKfs };
      });
      return { ...state, items: newItems };
    }

    case 'DELETE_KEYFRAME': {
      const { itemId, keyframeId } = action.payload;
      const newItems = state.items.map(item => {
        if (item.id !== itemId) return item;
        const currentKfs = item.keyframes || [];
        const updatedKfs = currentKfs.filter(k => k.id !== keyframeId);
        return { ...item, keyframes: updatedKfs };
      });
      return { ...state, items: newItems };
    }

    case 'UPDATE_KEYFRAME': {
      const { itemId, keyframeId, properties } = action.payload;
      const newItems = state.items.map(item => {
        if (item.id !== itemId) return item;
        const currentKfs = item.keyframes || [];
        const updatedKfs = currentKfs.map(k => {
          if (k.id !== keyframeId) return k;
          return { ...k, properties: { ...k.properties, ...properties } };
        });
        return { ...item, keyframes: updatedKfs };
      });
      return { ...state, items: newItems };
    }

    case 'REORDER_ITEM_LAYER': {
      const { itemId, direction } = action.payload;
      const targetItem = state.items.find(i => i.id === itemId);
      if (!targetItem) return state;

      // Ensure visual items have a baseline zIndex if missing
      const itemsWithZIndex = state.items.map((item, idx) => ({
        ...item,
        properties: {
          ...item.properties,
          zIndex: item.properties?.zIndex ?? (item.type === 'text' ? 20 + idx : 10 + idx)
        }
      }));

      const sortedVisuals = itemsWithZIndex
        .filter(i => i.type === 'video' || i.type === 'text' || i.type === 'overlay')
        .sort((a, b) => (a.properties.zIndex! - b.properties.zIndex!));

      const targetIdx = sortedVisuals.findIndex(i => i.id === itemId);
      if (targetIdx === -1) return state;

      const currentZ = sortedVisuals[targetIdx].properties.zIndex!;
      let newZ = currentZ;

      if (direction === 'bring_forward') {
        if (targetIdx < sortedVisuals.length - 1) {
          const aboveItem = sortedVisuals[targetIdx + 1];
          newZ = (aboveItem.properties.zIndex ?? 0) + 1;
        } else {
          newZ = currentZ + 1;
        }
      } else if (direction === 'send_backward') {
        if (targetIdx > 0) {
          const belowItem = sortedVisuals[targetIdx - 1];
          newZ = Math.max(1, (belowItem.properties.zIndex ?? 0) - 1);
        } else {
          newZ = Math.max(1, currentZ - 1);
        }
      } else if (direction === 'bring_to_front') {
        const maxZ = Math.max(...sortedVisuals.map(i => i.properties.zIndex ?? 0));
        newZ = maxZ + 1;
      } else if (direction === 'send_to_back') {
        const minZ = Math.min(...sortedVisuals.map(i => i.properties.zIndex ?? 0));
        newZ = Math.max(1, minZ - 1);
      }

      const newItems = itemsWithZIndex.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          properties: {
            ...item.properties,
            zIndex: newZ
          }
        };
      });

      return { ...state, items: newItems };
    }

    case 'TOGGLE_TRACK_LOCK': {
      const newTracks = state.tracks.map(t =>
        t.id === action.payload.id ? { ...t, locked: !t.locked } : t
      );
      return { ...state, tracks: newTracks };
    }

    case 'TOGGLE_TRACK_MUTE': {
      const newTracks = state.tracks.map(t =>
        t.id === action.payload.id ? { ...t, muted: !t.muted } : t
      );
      return { ...state, tracks: newTracks };
    }

    default:
      return state;
  }
}

export function historyReducer(state: HistoryState, action: EditAction): HistoryState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    return {
      ...state,
      past: newPast,
      present: previous,
      future: [state.present, ...state.future],
      transientBaseState: null
    };
  }

  if (action.type === 'REDO') {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    return {
      ...state,
      past: [...state.past, state.present],
      present: next,
      future: newFuture,
      transientBaseState: null
    };
  }

  // Handle Selection updates without affecting history or transient snapshots
  if (action.type === 'SET_SELECTION') {
    const nextState = timelineReducer(state.present, action);
    return {
      ...state,
      present: nextState
    };
  }

  // Handle Live Transient Drag / Slider Updates
  if ((action.type === 'UPDATE_PROPERTIES' || action.type === 'BATCH_UPDATE_PROPERTIES' || action.type === 'MOVE_ITEM' || action.type === 'TRIM_ITEM') && action.meta?.isTransient) {
    const nextState = timelineReducer(state.present, action);
    return {
      ...state,
      // Record exact pre-gesture state snapshot on the very first transient update tick
      transientBaseState: state.transientBaseState ?? state.present,
      present: nextState
    };
  }

  // Regular action or committed gesture completion (isTransient: false / undefined)
  const nextState = timelineReducer(state.present, action);
  if (nextState === state.present && !state.transientBaseState) return state;

  // Use transientBaseState (the exact snapshot before the gesture began) if returning from a transient drag session
  const baseToPush = state.transientBaseState ?? state.present;

  return {
    past: [...state.past, baseToPush].slice(-MAX_HISTORY),
    present: nextState,
    future: [],
    transientBaseState: null
  };
}


// --------------------------------------------------------------------------------
// Snapping Engine
// --------------------------------------------------------------------------------
export interface SnapResult {
  time: number;
  snapped: boolean;
  distance: number;
}

export function calculateSnap(
  dragTime: number,
  state: EditState,
  ignoreItemId: string | null = null,
  snapThreshold: number = 0.25,
  playheadTime: number | null = null
): SnapResult {
  const roundedDrag = Math.round(dragTime * 1000) / 1000;
  let closestTime = roundedDrag;
  let minDistance = snapThreshold;
  let snapped = false;

  const trySnap = (targetTime: number) => {
    const dist = Math.abs(roundedDrag - targetTime);
    if (dist <= minDistance) {
      minDistance = dist;
      closestTime = Math.round(targetTime * 1000) / 1000;
      snapped = true;
    }
  };

  // 1. Snap to 0 (Start of timeline)
  trySnap(0);

  // 2. Snap to playhead
  if (playheadTime !== null) {
    trySnap(playheadTime);
  }

  // 3. Snap to edges of other clips
  for (const item of state.items) {
    if (item.id === ignoreItemId) continue;
    
    // Check start and end of this item
    trySnap(item.start);
    trySnap(item.end);
  }

  // 4. Snap to timeline markers
  if (state.markers && state.markers.length > 0) {
    for (const marker of state.markers) {
      trySnap(marker.time);
    }
  }

  return { time: closestTime, snapped, distance: minDistance };
}

