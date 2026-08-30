import * as fs from 'fs';
import * as path from 'path';
import { transcribeAudioBuffer } from './provider';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ PHASE AI-2 TEST FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PHASE AI-2 TEST PASSED: ${msg}`);
}

console.log('========================================================================');
console.log('--- PHASE AI-2: WHISPER AUDIO TRANSCRIPTION PIPELINE TEST SUITE ---');
console.log('========================================================================');

async function runWhisperTestSuite() {
  const realVideoPath = path.resolve(process.cwd(), 'video.mp4');
  assert(fs.existsSync(realVideoPath), 'Phase AI-2: Real test video (video.mp4) exists on filesystem');

  const videoBuffer = fs.readFileSync(realVideoPath);
  console.log(`[Input] Read test media buffer (${videoBuffer.length} bytes)`);

  console.log('\n[1] Testing Whisper transcribeAudioBuffer API...');
  const result = await transcribeAudioBuffer(videoBuffer, 'test-video.mp4', 'en', 'Short form video creator');

  assert(typeof result === 'object', 'Phase AI-2: transcribeAudioBuffer returned valid result object');
  assert(Array.isArray(result.segments), 'Phase AI-2: segments is an array');

  if (!result.isMock && result.segments.length > 0) {
    console.log(`✨ Live Whisper API Transcribed ${result.segments.length} segments!`);
    console.log(`✨ Full Text: "${result.text}"`);
    result.segments.forEach((seg, i) => {
      console.log(`   [${seg.start_time.toFixed(2)}s - ${seg.end_time.toFixed(2)}s] ${seg.text}`);
      assert(typeof seg.text === 'string', `Phase AI-2: Segment ${i} has text string`);
      assert(seg.start_time <= seg.end_time, `Phase AI-2: Segment ${i} timestamps are valid`);
    });
  } else {
    console.log('ℹ️ Whisper Fallback Mode Active (Zero crash when OpenAI key is absent)');
    assert(result.isMock === true, 'Phase AI-2: Correctly flagged isMock=true');
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL PHASE AI-2 WHISPER TRANSCRIPTION PIPELINE CHECKS PASSED! 🎉');
  console.log('========================================================================');
}

runWhisperTestSuite().catch(err => {
  console.error('Fatal AI-2 Error:', err);
  process.exit(1);
});
