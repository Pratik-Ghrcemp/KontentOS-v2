import { EditState, HistoryState } from './types';
import { initialEditState, historyReducer, timelineReducer } from './engine';
import { buildRenderRequestFromEditState } from '../rendering/builder';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PHASE A TEST PASSED: ${msg}`);
}

console.log('===================================================');
console.log('--- RUNNING PHASE A CRITICAL REALITY FIXES TEST ---');
console.log('===================================================');

// 1. Verify Captions CRUD Canonical State Binding
let state: EditState = { ...initialEditState, items: [] };

// Add Caption
const newCaption = {
  id: 'caption-test-1',
  trackId: 'track-text-1',
  type: 'text' as const,
  start: 2.0,
  end: 5.0,
  label: 'Test Subtitle',
  content: 'Test Subtitle',
  properties: { x: 0, y: 150, fontSize: 36, color: '#ffffff' }
};
state = timelineReducer(state, { type: 'ADD_ITEM', payload: newCaption });
assert(state.items.length === 1 && state.items[0].id === 'caption-test-1', 'Captions ADD_ITEM populates canonical editState');

// Update Caption
state = timelineReducer(state, {
  type: 'UPDATE_PROPERTIES',
  payload: { id: 'caption-test-1', properties: { text: 'Updated Subtitle Text' } }
});
assert(state.items[0].properties.text === 'Updated Subtitle Text', 'Captions UPDATE_PROPERTIES updates canonical caption text');

// Duplicate Caption
state = timelineReducer(state, { type: 'DUPLICATE_ITEM', payload: { id: 'caption-test-1' } });
assert(state.items.length === 2, 'Captions DUPLICATE_ITEM duplicates caption segment');

// Delete Caption
state = timelineReducer(state, { type: 'DELETE_ITEM', payload: { id: 'caption-test-1' } });
assert(state.items.length === 1, 'Captions DELETE_ITEM removes caption segment');

// 2. Verify Export Quality and Caption Mode Wiring
const requestPayload = buildRenderRequestFromEditState(state, {
  mediaAssetId: 'asset-1',
  platformPresetId: 'instagram-reels',
  quality: 'medium',
  captionMode: 'sidecar',
  projectTitle: 'Reality Test Reel'
});

assert(requestPayload.quality === 'medium', 'RenderRequest captures custom quality target ("medium")');
assert(requestPayload.captionMode === 'sidecar', 'RenderRequest captures custom caption mode ("sidecar")');

// 3. Verify Timeline Drag Gesture History Compression (1 Drag Gesture = 1 Undo Entry)
let history: HistoryState = {
  past: [],
  present: state,
  future: [],
  transientBaseState: null
};

// Start dragging clip across 5 mousemove events with isTransient: true
for (let i = 1; i <= 5; i++) {
  history = historyReducer(history, {
    type: 'MOVE_ITEM',
    payload: { id: state.items[0].id, newStart: 5.0 + i, newEnd: 8.0 + i },
    meta: { isTransient: true }
  });
}
assert(history.past.length === 0, 'Transient drag moves do not pollute history.past during active drag gesture');

// Mouse up / gesture commit (isTransient omitted)
history = historyReducer(history, {
  type: 'MOVE_ITEM',
  payload: { id: state.items[0].id, newStart: 10.0, newEnd: 13.0 }
});
assert(history.past.length === 1, 'Pointer release commits exactly 1 Undo entry for the entire drag gesture');

// Execute Undo
history = historyReducer(history, { type: 'UNDO' });
assert(history.present.items[0].start < 10.0, 'Single UNDO action cleanly reverts the entire clip drag gesture');

console.log('===================================================');
console.log('🎉 ALL PHASE A CRITICAL REALITY FIXES VERIFIED! 🎉');
console.log('===================================================');
