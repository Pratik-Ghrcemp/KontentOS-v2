import * as fs from 'fs';
import * as path from 'path';
import { getWhisperInstallationStatus, runLocalWhisperTranscription } from '../ai/local-whisper-worker';
import { transcribeAudioBuffer } from '../ai/provider';
import { checkLocalFfmpegAvailable, getFfmpegExecutablePath, runLocalFfmpegRender } from './workers/local-ffmpeg-worker';
import { detectSilenceIntervals, extractPeaksFromAudioBuffer } from '../editing/audio';
import { detectFillerWords } from '../editing/speech/filler-words';
import { generateSilenceCutPlan } from '../editing/audio/plan';
import { createDurableRenderJob, getDurableRenderJob, updateDurableRenderJob, listDurableRenderJobs } from '../data/render-job-db';
import { buildRenderComposition } from './composition-builder';
import { EditState } from '../editing/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ TEST PASSED: ${msg}`);
}

async function runHatBlockersVerification() {
  console.log('========================================================================');
  console.log('--- HAT BLOCKERS REPAIR VERIFICATION SUITE (BLOCKERS 1, 2, 3) ---');
  console.log('========================================================================\n');

  // ─── BLOCKER 1: LOCAL WHISPER & FFMPEG DETECTION + NO MOCK CAPTIONS ───
  console.log('[BLOCKER 1] Testing Physical Runtime FFmpeg & Whisper Diagnostics...');
  const ffmpegOk = await checkLocalFfmpegAvailable();
  const ffmpegPath = getFfmpegExecutablePath();
  console.log(`  FFmpeg Executable Path: ${ffmpegPath} (Runnable: ${ffmpegOk})`);
  assert(ffmpegOk, 'FFmpeg binary is detected and runnable on host');

  const diag = await getWhisperInstallationStatus();
  console.log('  Whisper Installation Status:', JSON.stringify(diag, null, 2));
  assert(diag.isReady === true, 'getWhisperInstallationStatus returns isReady: true');
  assert(diag.ffmpegInstalled === true, 'getWhisperInstallationStatus reports FFmpeg detected');
  assert(diag.whisperBinaryInstalled === true, 'getWhisperInstallationStatus reports Whisper binary detected');
  assert(diag.whisperModelInstalled === true, 'getWhisperInstallationStatus reports Model weights detected');

  console.log('\n[BLOCKER 1] Testing Real Acoustic Transcription on Spoken Speech Video...');
  const spokenVideoPath = path.resolve('test_spoken_video.mp4');
  assert(fs.existsSync(spokenVideoPath), 'Spoken speech video exists');
  const spokenBuffer = fs.readFileSync(spokenVideoPath);

  const realSttResult = await runLocalWhisperTranscription(spokenBuffer, 'test_spoken_video.mp4');
  console.log(`  Real Acoustic Transcribed Text: "${realSttResult.text}"`);
  console.log(`  Segments Count: ${realSttResult.segments.length}`);
  assert(realSttResult.segments.length > 0, 'Real whisper.cpp produced actual timestamped segments');
  assert(realSttResult.text.length > 5, 'Real whisper.cpp produced non-empty speech text');
  assert(realSttResult.provider === 'local_whisper_cpp', 'Provider is local_whisper_cpp');

  console.log('\n[BLOCKER 1] Testing No-Mock-Caption Rule on Silent Video (sample-4.mp4)...');
  const silentVideoPath = path.resolve('sample-4.mp4');
  const silentBuffer = fs.readFileSync(silentVideoPath);
  const silentResult = await transcribeAudioBuffer(silentBuffer, 'sample-4.mp4');
  console.log('  Silent Video STT Result:', { isMock: silentResult.isMock, error: silentResult.error, segments: silentResult.segments.length });
  assert(silentResult.segments.length === 0, 'Silent video produced 0 segments (no fake captions generated)');

  // ─── BLOCKER 2: SMART CUT SILENCE & FILLER WORD DETECTION ───
  console.log('\n[BLOCKER 2] Testing Silence & Dead Air Detection on Real Media Waves...');
  // Extract real peaks from speech WAV
  const wavPath = path.resolve('test_spoken.wav');
  assert(fs.existsSync(wavPath), 'WAV file exists for audio peak analysis');
  const wavBuffer = fs.readFileSync(wavPath);
  // Parse PCM samples
  const pcmSamples: number[] = [];
  for (let i = 44; i < wavBuffer.length - 1; i += 2) {
    const sample = wavBuffer.readInt16LE(i) / 32768.0;
    pcmSamples.push(Math.abs(sample));
  }
  const numPeaks = 100;
  const step = Math.floor(pcmSamples.length / numPeaks);
  const peaks: number[] = [];
  for (let i = 0; i < numPeaks; i++) {
    let max = 0;
    for (let j = 0; j < step; j++) {
      if (pcmSamples[i * step + j] > max) max = pcmSamples[i * step + j];
    }
    peaks.push(max);
  }
  const maxPeak = Math.max(...peaks, 0.001);
  const normalizedPeaks = peaks.map(p => p / maxPeak);

  const silenceIntervals = detectSilenceIntervals(
    { peaks: normalizedPeaks, duration: 6.0, sampleRate: 44100 },
    { amplitudeThreshold: 0.05, minSilenceDuration: 0.2, paddingDuration: 0.05 }
  );
  console.log(`  Detected Silence Intervals: ${silenceIntervals.length}`, silenceIntervals);
  assert(silenceIntervals.length >= 1, 'Detected at least 1 real silence gap in speech audio');
  assert(silenceIntervals[0].start < silenceIntervals[0].end, 'Silence interval has valid forward timestamps');

  console.log('\n[BLOCKER 2] Testing Multi-Lingual Filler Word Detection...');
  const captionSegments = realSttResult.segments.map((s, idx) => ({
    id: `cap-${idx + 1}`,
    text: s.text,
    start_time: s.start_time,
    end_time: s.end_time
  }));
  const fillerCandidates = detectFillerWords(captionSegments, { languages: ['en', 'hi', 'hinglish'] });
  console.log(`  Detected Filler Candidates: ${fillerCandidates.length}`, fillerCandidates);
  assert(fillerCandidates.length >= 1, 'Detected filler word candidates from transcript (e.g. "basically", "you know", "um")');

  console.log('\n[BLOCKER 2] Testing Smart Cut Plan Generation & Multi-Track Ripple Shift...');
  const mockEditState: EditState = {
    tracks: [{ id: 'track-v1', type: 'video', label: 'Video Track', locked: false, muted: false, visible: true, color: '#3b82f6' }],
    duration: 10.0,
    selection: ['clip-1'],
    items: [
      { id: 'clip-1', type: 'video', trackId: 'track-v1', start: 0, end: 10.0, label: 'Main Video', properties: {} },
      { id: 'cap-1', type: 'caption', trackId: 'track-c1', start: 0.5, end: 3.5, label: 'Welcome to Studio Hub', properties: {} },
      { id: 'cap-2', type: 'caption', trackId: 'track-c1', start: 4.0, end: 7.0, label: 'Basically you know', properties: {} }
    ]
  };

  const cutPlan = generateSilenceCutPlan(
    [
      { id: 'cut-1', start: 1.0, end: 2.0, duration: 1.0, confidence: 1.0 }
    ],
    mockEditState,
    { targetClipId: 'clip-1' }
  );
  console.log('  Generated Cut Plan:', {
    totalTimeSaved: cutPlan.totalTimeSaved,
    newDuration: cutPlan.newDuration,
    itemActionsCount: cutPlan.itemActions.length
  });
  assert(cutPlan.totalTimeSaved === 1.0, 'Saved exactly 1.0s cut time');
  assert(cutPlan.newDuration === 9.0, 'New duration reduced from 10.0s to 9.0s');
  const cap2Action = cutPlan.itemActions.find(a => a.itemId === 'cap-2');
  assert(cap2Action?.newStart === 3.0, 'Downstream caption shifted by exact cut duration (4.0s - 1.0s = 3.0s)');

  // ─── BLOCKER 3: EXPORT / RENDER NON-BLOCKING SUPABASE RESILIENCE ───
  console.log('\n[BLOCKER 3] Testing Export POST /api/render-jobs Resilience with Invalid JWT...');
  const invalidToken = 'kontentos-super-admin-bypass-token';
  const renderReq = {
    platformPresetId: 'reel',
    mediaAssetId: 'test_spoken_video.mp4',
    projectTitle: 'HAT_Verified_Export',
    aspectRatio: '9:16' as const,
    resolution: '720p' as const,
    quality: 'high' as const,
    captionMode: 'burn_in' as const,
    captionStyle: { preset: 'hormozi' as const, fontSize: 38, color: '#facc15' },
    timelineClips: [
      { id: 'v1', start: 0, end: 5.0, sourceUrl: path.resolve('test_spoken_video.mp4'), properties: {} }
    ]
  };

  const createdJob = await createDurableRenderJob(renderReq as any, 'admin-super-user', undefined, invalidToken);
  console.log('  Created Render Job:', { id: createdJob.id, status: createdJob.status, progress: createdJob.progress });
  assert(Boolean(createdJob.id), 'Render job created successfully without throwing JWT error');
  assert(createdJob.status === 'queued', 'Job initial status is queued');

  console.log('\n[BLOCKER 3] Running Physical Local FFmpeg Render for Job...');
  const comp = buildRenderComposition(renderReq as any);
  let finalProgress = 0;
  const renderWorkerResult = await runLocalFfmpegRender(comp, (p) => {
    finalProgress = p;
  });
  console.log('  Render Result:', { success: renderWorkerResult.success, fileUrl: renderWorkerResult.fileUrl, sizeBytes: renderWorkerResult.sizeBytes });
  assert(renderWorkerResult.success === true, 'Physical FFmpeg render succeeded');
  const physicalPath = renderWorkerResult.outputPath || (renderWorkerResult.fileUrl ? renderWorkerResult.fileUrl.replace(/^file:\/\//, '') : '');
  assert(Boolean(physicalPath && fs.existsSync(physicalPath)), 'Exported MP4 file physically exists on disk');
  assert((renderWorkerResult.sizeBytes || 0) > 10000, 'Exported MP4 is non-empty valid video file');

  await updateDurableRenderJob(createdJob.id, {
    status: 'completed',
    progress: 100,
    result_json: { fileUrl: renderWorkerResult.fileUrl, sizeBytes: renderWorkerResult.sizeBytes }
  }, 'admin-super-user', invalidToken);

  const finalJobState = await getDurableRenderJob(createdJob.id, 'admin-super-user', invalidToken);
  assert(finalJobState?.status === 'completed', 'Final job state updated to completed');
  assert(finalJobState?.progress === 100, 'Final job progress reached 100%');

  const jobList = await listDurableRenderJobs('admin-super-user', invalidToken);
  assert(jobList.some(j => j.id === createdJob.id), 'Job list includes the completed render job');

  console.log('\n========================================================================');
  console.log('🎉 ALL 3 HAT BLOCKERS FULLY RESOLVED AND VERIFIED AT PHYSICAL RUNTIME! 🎉');
  console.log('========================================================================');
}

runHatBlockersVerification().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
