import { historyReducer, calculateSnap } from '../engine';
import { evaluateInterpolatedProperties } from '../keyframes';
import { buildRenderRequestFromEditState } from '../../rendering/builder';
import { createRenderJob, cancelRenderJob, retryRenderJob, subscribeToRenderJob } from '../../rendering/render-service';
import { EditState, HistoryState, TimelineItem } from '../types';

export async function runProductionHardeningStressTests(): Promise<boolean> {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ STRESS TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ STRESS TEST PASSED: ${description}`);
    }
  };

  console.log('================================================================');
  console.log('--- RUNNING PHASE 7 PRODUCTION HARDENING & STRESS TEST SUITE ---');
  console.log('================================================================');

  // --------------------------------------------------------------------------------
  // 7A. LARGE TIMELINE STRESS TEST (100 Items, 20 Markers, 30 Keyframes)
  // --------------------------------------------------------------------------------
  console.log('\n[7A] Executing High-Density Timeline Stress Test (100 Items)...');
  const heavyItems: TimelineItem[] = [];
  
  for (let i = 0; i < 50; i++) {
    heavyItems.push({
      id: `heavy-video-${i}`,
      trackId: 'track-video-1',
      type: 'video',
      start: i * 2.0,
      end: (i + 1) * 2.0,
      properties: { x: 0, y: 0, scale: 100, opacity: 100, volume: 100, zIndex: 10 }
    });
  }

  for (let i = 0; i < 20; i++) {
    heavyItems.push({
      id: `heavy-text-${i}`,
      trackId: 'track-text-1',
      type: 'text',
      start: i * 3.0,
      end: (i + 1) * 3.0,
      content: `Heavy Headline Overlay ${i}`,
      keyframes: [
        { id: `kf-1-${i}`, time: 0.0, properties: { opacity: 0, scale: 80 } },
        { id: `kf-2-${i}`, time: 1.5, properties: { opacity: 100, scale: 100 } }
      ],
      properties: {
        x: i * 5, y: -40, fontSize: 32, zIndex: 20
      }
    });
  }

  for (let i = 0; i < 15; i++) {
    heavyItems.push({
      id: `heavy-overlay-${i}`,
      trackId: 'track-text-1',
      type: 'overlay',
      start: i * 4.0,
      end: (i + 1) * 4.0,
      label: `Sticker ${i}`,
      content: '🔥',
      properties: { x: i * 10, y: 50, scale: 120, zIndex: 15 }
    });
  }

  for (let i = 0; i < 15; i++) {
    heavyItems.push({
      id: `heavy-draw-${i}`,
      trackId: 'track-text-1',
      type: 'overlay',
      start: i * 4.0,
      end: (i + 1) * 4.0,
      label: `Vector Drawing ${i}`,
      content: 'drawing',
      properties: {
        x: -50, y: 50, scale: 100,
        strokePoints: [{ x: 0, y: 0 }, { x: 20, y: 20 }],
        strokeColor: '#ef4444', strokeWidth: 6, zIndex: 15
      }
    });
  }

  const heavyState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video Track 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'rose' }
    ],
    items: heavyItems,
    selection: [],
    markers: Array.from({ length: 20 }).map((_, i) => ({ id: `m-${i}`, time: i * 5.0, label: `Marker ${i}`, color: 'amber' })),
    duration: 100
  };

  let history: HistoryState = { past: [], present: heavyState, future: [] };

  const startPerf = Date.now();
  for (let i = 0; i < 50; i++) {
    history = historyReducer(history, {
      type: 'UPDATE_PROPERTIES',
      payload: { id: `heavy-video-${i % 50}`, properties: { opacity: 90 } }
    });
  }
  const perfDurationMs = Date.now() - startPerf;

  assert(history.present.items.length === 100, '7A: High-density editState holds 100 items');
  assert(perfDurationMs < 500, `7A: 50 batch state updates executed in ${perfDurationMs}ms (<500ms budget)`);

  const animatedItem = history.present.items.find(i => i.id === 'heavy-text-5')!;
  const lerpProp = evaluateInterpolatedProperties(animatedItem, 15.75);
  assert(lerpProp.scale === 90, '7A: Keyframe lerp at midpoint 15.75s evaluates scale === 90');

  // --------------------------------------------------------------------------------
  // 7B. MEMORY & LIFECYCLE CLEANUP VERIFICATION
  // --------------------------------------------------------------------------------
  console.log('\n[7B] Testing Memory & Subscriber Cleanup Integrity...');
  const testJobReq = buildRenderRequestFromEditState(history.present, { mediaAssetId: 'asset-leak-test', platformPresetId: 'reels' });
  const testJob = await createRenderJob(testJobReq);
  
  let subCalls = 0;
  const unsubscribe = subscribeToRenderJob(testJob.id, () => {
    subCalls++;
  });
  
  assert(typeof unsubscribe === 'function', '7B: subscribeToRenderJob returns cleanup function');
  unsubscribe(); // Cleanup subscriber
  const subCallsAfterUnsub = subCalls;

  await new Promise(r => setTimeout(r, 600));
  assert(subCalls === subCallsAfterUnsub, '7B: Unsubscribed listener receives 0 further callbacks (No memory leak)');

  // --------------------------------------------------------------------------------
  // 7C. RENDER FAILURE RECOVERY & RETRY LOGIC
  // --------------------------------------------------------------------------------
  console.log('\n[7C] Testing Render Job Cancellation & Failure Recovery Retry Logic...');
  const cancelJob = await createRenderJob(testJobReq);
  const cancelSuccess = await cancelRenderJob(cancelJob.id);
  assert(cancelSuccess === true, '7C: Render job cancelled successfully');

  const retriedJob = await retryRenderJob(cancelJob.id);
  assert(retriedJob.status === 'queued', '7C: retriedJob status is queued');

  const finalRetriedJob = await new Promise<any>((resolve) => {
    subscribeToRenderJob(retriedJob.id, (updated) => {
      if (updated.status === 'completed') resolve(updated);
    });
  });

  assert(finalRetriedJob.status === 'completed', '7C: Retried render job completed successfully');
  assert(typeof finalRetriedJob.result_json?.fileUrl === 'string', '7C: Retried job generated download fileUrl');

  // --------------------------------------------------------------------------------
  // 7D. STATE DIVERGENCE & STRESS UNDO/REDO RECOVERY
  // --------------------------------------------------------------------------------
  console.log('\n[7D] Testing 60-Step Stress Undo/Redo State Divergence Recovery...');
  const baseCount = history.present.items.length; // 100 items

  // Perform 30 rapid state mutations
  for (let i = 0; i < 30; i++) {
    history = historyReducer(history, {
      type: 'ADD_ITEM',
      payload: {
        id: `stress-add-${i}`,
        trackId: 'track-text-1',
        type: 'text',
        start: i,
        end: i + 1,
        content: `Stress ${i}`,
        properties: {}
      }
    });
  }

  assert(history.present.items.length === baseCount + 30, '7D: State holds 130 items after 30 additions');

  // Undo 30 times
  for (let i = 0; i < 30; i++) {
    history = historyReducer(history, { type: 'UNDO' });
  }

  assert(history.present.items.length === baseCount, '7D: 30 consecutive UNDOs restored baseline count 100 items');
  assert(!history.present.items.some(i => i.id.startsWith('stress-add-')), '7D: Zero stress items remaining after 30 UNDOs');

  // Redo 30 times
  for (let i = 0; i < 30; i++) {
    history = historyReducer(history, { type: 'REDO' });
  }

  assert(history.present.items.length === baseCount + 30, '7D: 30 consecutive REDOs restored 130 items');

  return passed;
}

runProductionHardeningStressTests();
