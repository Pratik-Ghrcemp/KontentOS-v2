import { buildRenderRequestFromEditState } from './builder';
import { createRenderJob, getRenderJob } from './render-service';
import { EditState, TimelineItem } from '../editing/types';

export async function runExportExecutionSanityTests(): Promise<boolean> {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING PHASE 5H EXPORT & RENDER JOB EXECUTION SANITY TESTS ---');

  const videoClip: TimelineItem = {
    id: 'clip-v1',
    trackId: 'track-video-1',
    type: 'video',
    start: 0,
    end: 10,
    properties: { x: 0, y: 0, scale: 100, opacity: 100, zIndex: 10 },
    keyframes: [{ id: 'kf-1', time: 0, properties: { opacity: 0 } }]
  };

  const textOverlay: TimelineItem = {
    id: 'text-1',
    trackId: 'track-text-1',
    type: 'text',
    start: 0,
    end: 10,
    content: 'Export Header',
    properties: { x: 0, y: 0, fontSize: 32, zIndex: 20 }
  };

  const editState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-text-1', label: 'Text / Overlays', type: 'text', locked: false, muted: false, visible: true, color: 'rose' }
    ],
    items: [videoClip, textOverlay],
    selection: ['clip-v1'],
    duration: 10
  };

  // 1. Build Render Request
  const renderReq = buildRenderRequestFromEditState(editState, {
    mediaAssetId: 'asset-test-1',
    platformPresetId: 'instagram-reels',
    quality: 'high',
    captionMode: 'burn'
  });

  assert(renderReq.mediaAssetId === 'asset-test-1', 'Test 1: mediaAssetId preserved in RenderRequest');
  assert(renderReq.timelineClips.length === 1, 'Test 1: timelineClips serialized');
  assert(renderReq.textOverlays.length === 1, 'Test 1: textOverlays serialized');
  assert(renderReq.timelineClips[0].keyframes?.length === 1, 'Test 1: keyframes preserved in export payload');
  assert(renderReq.timelineClips[0].properties.zIndex === 10, 'Test 1: zIndex preserved in export payload');

  // 2. Create Render Job
  const job = await createRenderJob(renderReq);
  assert(typeof job.id === 'string' && job.id.length > 0, 'Test 2: Job ID generated');
  assert(job.status === 'queued', 'Test 2: Initial job status is queued');

  // 3. Poll Render Job Status until Completion
  let currentJob = await getRenderJob(job.id);
  assert(currentJob !== null, 'Test 3: getRenderJob returned job object');

  // Wait for mock worker completion (timeout max 8s)
  const startTime = Date.now();
  while (currentJob && currentJob.status !== 'completed' && Date.now() - startTime < 8000) {
    await new Promise(r => setTimeout(r, 400));
    currentJob = await getRenderJob(job.id);
  }

  assert(currentJob?.status === 'completed', 'Test 4: Render job status reached completed');
  assert(currentJob?.progress === 100, 'Test 4: Progress reached 100%');
  assert(typeof currentJob?.result_json?.fileUrl === 'string', 'Test 4: Result fileUrl present');

  return passed;
}

runExportExecutionSanityTests();
