import { resolveEffectiveItemStyle, resolveWatermarkPosition } from './resolver';
import { createCustomBrandKit } from './factory';
import { DEFAULT_BRAND_KITS } from './presets';

export function runBrandKitSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING BRAND KIT SUBSYSTEM SANITY TESTS ---');

  // 1. Preset Kits check
  assert(Boolean(DEFAULT_BRAND_KITS.minimal_neo), 'Minimal Neo brand kit preset exists');
  assert(Boolean(DEFAULT_BRAND_KITS.hormozi_bold), 'Alex Hormozi brand kit preset exists');

  // 2. Custom Brand Kit Factory
  const customKit = createCustomBrandKit({
    name: 'Custom Agency Kit',
    colors: { primary: '#ff5500', secondary: '#111111', accent: '#00ffaa', background: '#000000', text: '#ffffff' }
  });
  assert(customKit.name === 'Custom Agency Kit', 'Factory sets custom kit name');
  assert(customKit.colors.primary === '#ff5500', 'Factory sets custom primary color #ff5500');

  // 3. Style Resolution Precedence: Brand Defaults -> Preset Defaults -> Explicit Overrides
  const brandDefaultStyle = resolveEffectiveItemStyle({}, customKit);
  assert(brandDefaultStyle.color === '#ffffff', 'Brand default text color resolved');

  const overrideStyle = resolveEffectiveItemStyle({ color: '#ff0000', fontSize: 64 }, customKit);
  assert(overrideStyle.color === '#ff0000', 'Explicit item color override takes precedence over brand default');
  assert(overrideStyle.fontSize === 64, 'Explicit item fontSize override takes precedence');

  // 4. Watermark Position Resolution
  const posTopRight = resolveWatermarkPosition('top-right', 1920, 1080, 200, 50, 20);
  assert(posTopRight.x === 1700 && posTopRight.y === 20, 'Top-Right watermark position calculated correctly');

  const posBottomLeft = resolveWatermarkPosition('bottom-left', 1920, 1080, 200, 50, 20);
  assert(posBottomLeft.x === 20 && posBottomLeft.y === 1010, 'Bottom-Left watermark position calculated correctly');

  return passed;
}

runBrandKitSanityTests();
