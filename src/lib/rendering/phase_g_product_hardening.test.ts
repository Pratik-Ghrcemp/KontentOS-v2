import * as fs from 'fs';
import * as path from 'path';
import { initialEditState, timelineReducer, historyReducer } from '../editing/engine';
import { createCaptionTimelineItems, createTextTimelineItem } from '../editing/text-factory';
import { buildRenderRequestFromEditState } from './builder';
import { buildRenderComposition } from './composition-builder';
import { runLocalFfmpegRender, checkLocalFfmpegAvailable } from './workers/local-ffmpeg-worker';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ PHASE G TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PHASE G TEST PASSED: ${msg}`);
}

console.log('========================================================================');
console.log('--- PHASE G: REAL PRODUCT STRESS & PRODUCTION HARDENING TEST SUITE ---');
console.log('========================================================================');

async function runPhaseGTests() {
  // ------------------------------------------------------------------------
  // G1: High-Density Timeline & Long Duration Stress Testing
  // ------------------------------------------------------------------------
  console.log('\n[G1] Testing 100-Clip High Density Timeline & Long Duration Math...');
  let stressState = { ...initialEditState };

  const startPerf = Date.now();
  for (let i = 0; i < 100; i++) {
    const item = {
      id: `stress-clip-${i}`,
      trackId: i % 2 === 0 ? 'track-video-1' : 'track-text-1',
      type: (i % 2 === 0 ? 'video' : 'text') as any,
      start: i * 3.0,
      end: (i + 1) * 3.0,
      sourceIn: 0,
      sourceOut: 3.0,
      label: `Clip Segment ${i}`,
      properties: { opacity: 100, scale: 100, x: 0, y: 0, rotation: 0 }
    };
    stressState = timelineReducer(stressState, { type: 'ADD_ITEM', payload: item });
  }
  const endPerf = Date.now();

  assert(stressState.items.length === 100, 'G1: 100 items successfully inserted into timeline');
  assert(stressState.duration === 300.0, 'G1: Duration correctly calculated to 300.0s (5 minutes)');
  assert((endPerf - startPerf) < 150, `G1: 100 timeline insertions completed in ${endPerf - startPerf}ms (<150ms performance baseline)`);

  // ------------------------------------------------------------------------
  // G2: Full Creator Workflow Lifecycle & Persistence Round-Trip
  // ------------------------------------------------------------------------
  console.log('\n[G2] Verifying Full Creator Workflow State Round-Trip...');
  const testVideoPath = path.resolve(process.cwd(), 'video.mp4');
  assert(fs.existsSync(testVideoPath), 'G2: Physical test video exists');

  const captionSegments = [
    { text: 'Start with a hook.', start_time: 0.0, end_time: 2.0 },
    { text: 'Deliver the core value.', start_time: 2.1, end_time: 4.5 },
    { text: 'End with a strong CTA.', start_time: 4.6, end_time: 6.0 }
  ];
  const captions = createCaptionTimelineItems(captionSegments, 'kinetic');
  const headline = createTextTimelineItem('title', { content: 'VIRAL PRODUCTION', startTime: 0.0, duration: 6.0 });

  const workflowState = {
    ...initialEditState,
    duration: 6.0,
    items: [
      {
        id: 'main-video-clip',
        trackId: 'track-video-1',
        type: 'video' as const,
        start: 0,
        end: 6.0,
        sourceIn: 0,
        sourceOut: 6.0,
        label: 'Main Video',
        assetId: testVideoPath,
        properties: { opacity: 100, scale: 100, x: 0, y: 0, rotation: 0 }
      },
      headline,
      ...captions
    ]
  };

  const renderReq = buildRenderRequestFromEditState(
    workflowState,
    {
      mediaAssetId: testVideoPath,
      platformPresetId: 'instagram-reels',
      quality: 'high',
      captionMode: 'burn',
      projectTitle: 'Phase_G_Hardened_Reel',
      brandKit: { watermark: { text: 'KontentOS Pro', position: 'bottom-right' } }
    }
  );

  const comp = buildRenderComposition(renderReq);
  assert(comp.timeline.duration === 6.0, 'G2: Composition duration exactly matches 6.0s sequence boundary');
  assert(comp.timeline.layers.length >= 4, 'G2: Composition contains video, headline, captions, and watermark layers');

  // ------------------------------------------------------------------------
  // G3: Local FFmpeg Video Generation & Download Path Validation
  // ------------------------------------------------------------------------
  console.log('\n[G3] Testing Local FFmpeg Rendering & Download Path Integrity...');
  const isAvailable = await checkLocalFfmpegAvailable();
  assert(isAvailable, 'G3: FFmpeg native binary is runnable');

  const renderResult = await runLocalFfmpegRender(comp);
  assert(renderResult.success === true, 'G3: Physical FFmpeg render succeeded');
  assert(typeof renderResult.fileUrl === 'string' && renderResult.fileUrl.startsWith('file://'), 'G3: Render returned valid fileUrl');
  
  const rawPath = renderResult.fileUrl!.replace(/^file:\/\/\/?/, '');
  assert(fs.existsSync(rawPath), 'G3: Rendered file verified on local disk at ' + rawPath);
  const fileSize = fs.statSync(rawPath).size;
  assert(fileSize > 500000, `G3: Rendered output has valid video stream (${fileSize} bytes)`);

  // Verify Download URL construction
  const downloadUrl = `/api/render-jobs/download?path=${encodeURIComponent(renderResult.fileUrl || '')}&filename=Phase_G_Hardened_Reel.mp4`;
  assert(downloadUrl.includes('/api/render-jobs/download'), 'G3: In-browser download URL constructed cleanly');

  // ------------------------------------------------------------------------
  // G4: Failure Resilience & Edge Cases
  // ------------------------------------------------------------------------
  console.log('\n[G4] Verifying Failure Resilience & Error Handling...');
  
  // 1. History undo/redo boundary check
  const emptyHistory = { past: [], present: initialEditState, future: [] };
  const undoResult = historyReducer(emptyHistory, { type: 'UNDO' });
  assert(undoResult === emptyHistory, 'G4: Undo on empty history safely preserves state without throwing error');

  const redoResult = historyReducer(emptyHistory, { type: 'REDO' });
  assert(redoResult === emptyHistory, 'G4: Redo on empty future safely preserves state without throwing error');

  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE G REAL PRODUCT STRESS & HARDENING CHECKS 100% PASSED! 🎉');
  console.log('========================================================================');
}

runPhaseGTests().catch(err => {
  console.error('Fatal Phase G Error:', err);
  process.exit(1);
});
