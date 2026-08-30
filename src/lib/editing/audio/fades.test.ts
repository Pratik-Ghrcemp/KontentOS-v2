import { calculateFadeGain, calculateEffectiveVolume } from './volume';

export function runAudioFadesSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING AUDIO FADE IN / FADE OUT SANITY TESTS ---');

  // 1. No fade
  const noFade = calculateFadeGain(5.0, 0, 10, 0, 0);
  assert(noFade === 1.0, 'Test 1: No fade gain === 1.0');

  // 2. Fade-in midpoint (2s fade-in on 10s clip at t=1.0s -> 0.5 gain)
  const fadeInMid = calculateFadeGain(1.0, 0, 10, 2.0, 0);
  assert(fadeInMid === 0.5, 'Test 2: Fade-in midpoint at 1.0s (2.0s duration) gain === 0.5');

  // 3. Fade-out midpoint (2s fade-out on 10s clip at t=9.0s -> 0.5 gain)
  const fadeOutMid = calculateFadeGain(9.0, 0, 10, 0, 2.0);
  assert(fadeOutMid === 0.5, 'Test 3: Fade-out midpoint at 9.0s (2.0s duration) gain === 0.5');

  // 4. Full fade duration (at start t=0s -> 0.0, at end t=10s -> 0.0)
  const fadeStart = calculateFadeGain(0.0, 0, 10, 2.0, 2.0);
  const fadeEnd = calculateFadeGain(10.0, 0, 10, 2.0, 2.0);
  assert(fadeStart === 0.0, 'Test 4a: Fade-in start at t=0s gain === 0.0');
  assert(fadeEnd === 0.0, 'Test 4b: Fade-out end at t=10s gain === 0.0');

  // 5. Fade duration equal to clip duration (10s fade-in on 10s clip)
  const fullFade = calculateFadeGain(5.0, 0, 10, 10.0, 0);
  assert(fullFade === 0.5, 'Test 5: Full clip fade-in midpoint at t=5.0s gain === 0.5');

  // 6. Fade clamping (fade-in 15s on 10s clip clamped to 10s max)
  const clampedFade = calculateFadeGain(5.0, 0, 10, 15.0, 0);
  assert(clampedFade === 0.5, 'Test 6: Clamped fade-in duration at t=5.0s gain === 0.5');

  // 7. Interaction with clip volume (50% clip volume * 0.5 fade gain = 0.25 effective gain)
  const effectiveGain = calculateEffectiveVolume(50, 100, false, 1.0, 0.5);
  assert(effectiveGain === 0.25, 'Test 7: 50% clip volume * 0.5 fade gain === 0.25 effective gain');

  // 8. Interaction with auto-ducking (100% volume * 0.5 ducking * 0.5 fade = 0.25 effective gain)
  const duckingWithFade = calculateEffectiveVolume(100, 100, false, 0.5, 0.5);
  assert(duckingWithFade === 0.25, 'Test 8: 100% volume * 0.5 ducking * 0.5 fade === 0.25 effective gain');

  return passed;
}

runAudioFadesSanityTests();
