import { generateCssFilter } from './filters';
import { CINEMATIC_LUTS } from './presets';

export function runEffectsSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING VIDEO EFFECTS & COLOR PIPELINE SANITY TESTS ---');

  // 1. LUT Presets Dictionary check
  assert(Boolean(CINEMATIC_LUTS.studio_enhance), 'Studio enhance LUT preset exists');
  assert(Boolean(CINEMATIC_LUTS.teal_orange), 'Teal & Orange LUT preset exists');
  assert(Boolean(CINEMATIC_LUTS.noir_classic), 'Noir Classic B&W LUT preset exists');

  // 2. LUT Filter generation
  const tealFilter = generateCssFilter({}, 'teal_orange');
  assert(tealFilter.includes('saturate(1.12)'), 'Teal & Orange CSS filter contains saturate(1.12)');

  // 3. Custom Color Grading properties composition
  const customGrading = generateCssFilter({
    brightness: 120,
    contrast: 110,
    hue: 45,
    blur: 4
  });

  assert(customGrading.includes('brightness(1.20)'), 'Custom filter contains brightness(1.20)');
  assert(customGrading.includes('contrast(1.10)'), 'Custom filter contains contrast(1.10)');
  assert(customGrading.includes('hue-rotate(45deg)'), 'Custom filter contains hue-rotate(45deg)');
  assert(customGrading.includes('blur(4px)'), 'Custom filter contains blur(4px)');

  return passed;
}

runEffectsSanityTests();
