import { createTextTimelineItem, createCaptionTimelineItems } from './text-factory';
import { CaptionSegment } from '@/components/tabs/raw-studio/types';

export function runTextFactorySanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING TEXT & CAPTION FACTORY SANITY TESTS ---');

  // 1. Title item creation
  const titleItem = createTextTimelineItem('title', { startTime: 3.5 });
  assert(titleItem.trackId === 'track-text-1', 'Title item assigned to track-text-1');
  assert(titleItem.type === 'text', 'Title item type === text');
  assert(titleItem.start === 3.5, 'Title item start === 3.5');
  assert(titleItem.end === 6.5, 'Title item end === 6.5 (3s duration)');
  assert(titleItem.properties.fontSize === 52, 'Title item fontSize === 52');

  // 2. Lower third item creation
  const lowerThirdItem = createTextTimelineItem('lower_third', { startTime: 1.0, content: 'John Doe | CEO' });
  assert(lowerThirdItem.content === 'John Doe | CEO', 'Lower third content preserved');
  assert(lowerThirdItem.properties.fontSize === 28, 'Lower third fontSize === 28');

  // 3. Caption segment batch binding
  const mockSegments: CaptionSegment[] = [
    { id: 'seg-1', text: 'Welcome to KontentOS', start_time: 0, end_time: 2.5 },
    { id: 'seg-2', text: 'Professional video editing', start_time: 2.5, end_time: 5.0 }
  ];

  const captionItems = createCaptionTimelineItems(mockSegments, 'hormozi');
  assert(captionItems.length === 2, '2 caption items generated from 2 segments');
  assert(captionItems[0].trackId === 'track-caption-1', 'Caption item 0 assigned to track-caption-1');
  assert(captionItems[0].type === 'caption', 'Caption item type === caption');
  assert(captionItems[0].start === 0 && captionItems[0].end === 2.5, 'Caption item 0 start: 0, end: 2.5');
  assert(captionItems[0].properties.preset === 'hormozi', 'Caption item 0 preset === hormozi');
  assert(captionItems[1].start === 2.5 && captionItems[1].end === 5.0, 'Caption item 1 start: 2.5, end: 5.0');

  return passed;
}

runTextFactorySanityTests();
