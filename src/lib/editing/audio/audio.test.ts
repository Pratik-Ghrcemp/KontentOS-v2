import { volumeToGain, gainToDb, dbToGain, calculateEffectiveVolume } from './volume';
import { generateFallbackPeaks } from './waveform';
import { calculateDuckingGain, calculateDuckingGainCurve } from './ducking';
import { TimelineItem } from '../types';

export function runAudioSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING AUDIO PIPELINE SANITY TESTS ---');

  // 1. Volume conversion tests
  assert(volumeToGain(100) === 1.0, 'volumeToGain(100) === 1.0');
  assert(volumeToGain(50) === 0.5, 'volumeToGain(50) === 0.5');
  assert(volumeToGain(0) === 0.0, 'volumeToGain(0) === 0.0');

  // 2. dB gain conversion tests
  assert(Math.abs(gainToDb(1.0) - 0) < 0.001, 'gainToDb(1.0) === 0 dB');
  assert(Math.abs(dbToGain(0) - 1.0) < 0.001, 'dbToGain(0 dB) === 1.0');

  // 3. Effective volume calculation
  assert(calculateEffectiveVolume(100, 100, false, 1.0) === 1.0, 'Effective volume 100% === 1.0');
  assert(calculateEffectiveVolume(100, 100, true, 1.0) === 0.0, 'Effective volume track muted === 0.0');
  assert(calculateEffectiveVolume(100, 50, false, 0.5) === 0.25, 'Effective volume 100% * 50% * 0.5 === 0.25');

  // 4. Waveform peak generation
  const peaks = generateFallbackPeaks(40);
  assert(peaks.length === 40, 'generateFallbackPeaks(40) returns 40 peak samples');
  assert(peaks.every(p => p >= 0 && p <= 1.0), 'All generated peaks normalized between 0.0 and 1.0');

  // 5. Deterministic Auto Ducking tests
  const voiceClips: TimelineItem[] = [
    { id: 'v1', trackId: 'track-audio-1', type: 'audio', start: 2.0, end: 6.0, properties: {} }
  ];

  const duckGainIdle = calculateDuckingGain(1.0, voiceClips);
  const duckGainActive = calculateDuckingGain(3.5, voiceClips);
  assert(duckGainIdle === 1.0, 'BGM gain at 1.0s (no voice) === 1.0');
  assert(duckGainActive < 0.5, 'BGM gain at 3.5s (voice active) is ducked < 0.5');

  const curve = calculateDuckingGainCurve(10.0, voiceClips);
  assert(curve.length > 0, 'Ducking gain curve generated points across duration');

  return passed;
}

runAudioSanityTests();
