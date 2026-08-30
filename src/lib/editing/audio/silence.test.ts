import { detectSilenceIntervals } from './silence';
import { WaveformData } from './types';

export function runSilenceEngineSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING PURE SILENCE DETECTION ENGINE SANITY TESTS ---');

  // Helper generator
  const createPeaks = (pattern: number[], durationSec: number): WaveformData => ({
    peaks: pattern,
    sampleRate: 44100,
    duration: durationSec
  });

  // 1. No silence (all peaks > 0.1)
  const noSilence = createPeaks([0.5, 0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.6, 0.9, 0.7], 10);
  const res1 = detectSilenceIntervals(noSilence, { amplitudeThreshold: 0.05 });
  assert(res1.length === 0, 'Test 1: Continuous speech returns 0 silence intervals');

  // 2. Single silence interval (speech 0-3s, silence 3-7s, speech 7-10s)
  // 10 samples -> 1s per sample. Samples 3,4,5,6 are 0.0
  const singleSilence = createPeaks([0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.5], 10);
  const res2 = detectSilenceIntervals(singleSilence, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.0 });
  assert(res2.length === 1 && res2[0].start === 3.0 && res2[0].end === 7.0, 'Test 2: Single silence interval detected from t=3s to t=7s');

  // 3. Multiple silence intervals
  const multiSilence = createPeaks([0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5], 7);
  const res3 = detectSilenceIntervals(multiSilence, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.0, mergeThresholdMs: 0 });
  assert(res3.length === 2, 'Test 3: Multiple distinct silence gaps detected (2 intervals)');

  // 4. Below minimum duration rejection (silence 0.2s when minSilenceDuration = 0.5s)
  const shortSilence = createPeaks([0.5, 0.5, 0.5, 0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5], 10); // 1s silence sample
  const res4 = detectSilenceIntervals(shortSilence, { amplitudeThreshold: 0.05, minSilenceDuration: 2.0, paddingDuration: 0.0 });
  assert(res4.length === 0, 'Test 4: Silence below minSilenceDuration (1.0s vs 2.0s min) rejected');

  // 5. Threshold sensitivity (amplitude 0.03 vs threshold 0.05 -> silent, threshold 0.01 -> active)
  const quietAudio = createPeaks([0.03, 0.03, 0.03, 0.03], 4);
  const res5a = detectSilenceIntervals(quietAudio, { amplitudeThreshold: 0.05, minSilenceDuration: 0.1, paddingDuration: 0.0 });
  const res5b = detectSilenceIntervals(quietAudio, { amplitudeThreshold: 0.01, minSilenceDuration: 0.1, paddingDuration: 0.0 });
  assert(res5a.length === 1 && res5b.length === 0, 'Test 5: Threshold sensitivity (0.03 amplitude silent under 0.05, active under 0.01)');

  // 6. Padding behavior (0.1s padding reduces cut duration on speech edges)
  const paddedRes = detectSilenceIntervals(singleSilence, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.1 });
  assert(paddedRes[0].start === 3.1 && paddedRes[0].end === 6.9, 'Test 6: Safety padding (0.1s) adjusts start to 3.1s and end to 6.9s');

  // 7. Adjacent interval merge behavior (2 gap samples separated by 0.05s tiny spike merged if mergeThresholdMs=100ms)
  const rawSpike = createPeaks([0.5, 0.0, 0.0, 0.0, 0.0], 10); // 2.5s per sample
  const mergedRes = detectSilenceIntervals(rawSpike, { amplitudeThreshold: 0.05, minSilenceDuration: 1.0, paddingDuration: 0.0, mergeThresholdMs: 100 });
  assert(mergedRes.length === 1, 'Test 7: Adjacent silence ranges merged cleanly');

  // 8. Silence at beginning (0-3s silent, 3-10s speech)
  const silenceStart = createPeaks([0.0, 0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 10);
  const res8 = detectSilenceIntervals(silenceStart, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.1 });
  assert(res8.length === 1 && res8[0].start === 0.0, 'Test 8: Silence at beginning starts at t=0.0s without negative padding');

  // 9. Silence at end (0-7s speech, 7-10s silent)
  const silenceEnd = createPeaks([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 0.0], 10);
  const res9 = detectSilenceIntervals(silenceEnd, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.1 });
  assert(res9.length === 1 && res9[0].end === 10.0, 'Test 9: Silence at end extends to full media duration t=10.0s');

  // 10. Entire audio silent
  const totalSilence = createPeaks([0.0, 0.0, 0.0, 0.0, 0.0], 5);
  const res10 = detectSilenceIntervals(totalSilence, { amplitudeThreshold: 0.05, minSilenceDuration: 0.5, paddingDuration: 0.0 });
  assert(res10.length === 1 && res10[0].duration === 5.0, 'Test 10: Entire audio silent returns single 5.0s silence interval without crashing');

  // 11. Immutability guarantee
  const originalPeaksCopy = [...singleSilence.peaks];
  detectSilenceIntervals(singleSilence, { amplitudeThreshold: 0.05 });
  assert(JSON.stringify(singleSilence.peaks) === JSON.stringify(originalPeaksCopy), 'Test 11: Canonical peaks array remains untouched');

  // 12. Determinism
  const runA = detectSilenceIntervals(singleSilence, { amplitudeThreshold: 0.05 });
  const runB = detectSilenceIntervals(singleSilence, { amplitudeThreshold: 0.05 });
  assert(JSON.stringify(runA) === JSON.stringify(runB), 'Test 12: Repeated execution is 100% deterministic (Run A === Run B)');

  return passed;
}

runSilenceEngineSanityTests();
