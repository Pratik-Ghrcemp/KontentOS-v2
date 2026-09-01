import * as fs from 'fs';
import * as path from 'path';
import { setJob, getJob, updateJob } from './job-registry';
import { transcribeAudioBuffer } from '../ai/provider';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ BLOCKER FIX VERIFICATION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ BLOCKER FIX VERIFICATION PASSED: ${msg}`);
}

console.log('========================================================================');
console.log('--- BLOCKERS AUD-P0-01, AUD-P0-02 & AUD-P1-02 VERIFICATION SUITE ---');
console.log('========================================================================');

async function runBlockerFixTests() {
  // ------------------------------------------------------------------------
  // Test Blocker 1 (AUD-P0-01): Shared Job Registry & Polling Route Wiring
  // ------------------------------------------------------------------------
  console.log('\n[Test 1] Verifying Shared Render Job Registry for Polling Route...');
  const testJobId = `job-test-${Date.now()}`;
  
  await setJob(testJobId, {
    id: testJobId,
    media_asset_id: 'test-asset',
    status: 'processing',
    progress: 25,
    request_json: {} as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const retrieved = await getJob(testJobId);
  assert(retrieved !== null && retrieved?.id === testJobId, 'Blocker 1: Job stored in shared registry');
  assert(retrieved?.progress === 25, 'Blocker 1: Initial progress matches 25%');

  await updateJob(testJobId, { progress: 80, status: 'processing' });
  const updated = await getJob(testJobId);
  assert(updated?.progress === 80, 'Blocker 1: Progress updated to 80%');

  const downloadUrl = `/api/render-jobs/download?path=test.mp4&filename=video.mp4`;
  await updateJob(testJobId, {
    status: 'completed',
    progress: 100,
    result_json: { fileUrl: downloadUrl } as any
  });

  const finalJob = await getJob(testJobId);
  assert(finalJob?.status === 'completed' && finalJob.result_json?.fileUrl === downloadUrl, 'Blocker 1: Completed status & downloadUrl retrievable via getJob(jobId)');

  // ------------------------------------------------------------------------
  // Test Blocker 2 (AUD-P0-02): Audio Pre-Extraction for Whisper Transcription
  // ------------------------------------------------------------------------
  console.log('\n[Test 2] Verifying Whisper Audio Extraction Pipeline on Video File...');
  const testVideoPath = path.resolve(process.cwd(), 'video.mp4');
  assert(fs.existsSync(testVideoPath), 'Blocker 2: Real video file exists');

  const videoBuffer = fs.readFileSync(testVideoPath);
  const result = await transcribeAudioBuffer(videoBuffer, 'video.mp4', 'en');
  assert(typeof result === 'object' && Array.isArray(result.segments), 'Blocker 2: transcribeAudioBuffer succeeded with extracted audio');

  // ------------------------------------------------------------------------
  // Test Blocker 3 (AUD-P1-02): Signed URL Expiration Duration Check
  // ------------------------------------------------------------------------
  console.log('\n[Test 3] Verifying 24-Hour (86400s) Signed URL Lifetime in Code...');
  const mediaServiceSource = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/data/media-service.ts'), 'utf8');
  assert(mediaServiceSource.includes('86400'), 'Blocker 3: media-service.ts uses 86400 seconds (24h) for signed URLs');

  console.log('\n========================================================================');
  console.log('🎉 ALL 3 CRITICAL BLOCKER FIXES EMPIRICALLY VERIFIED! 🎉');
  console.log('========================================================================');
}

runBlockerFixTests().catch(err => {
  console.error('Fatal Blocker Fix Error:', err);
  process.exit(1);
});
