import { filterAssets } from './filter';

export function runAssetFilterSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING MEDIA ASSET SEARCH & FILTER SANITY TESTS ---');

  const mockAssets = [
    { id: '1', title: 'A-Roll Talking Head', fileName: 'aroll_interview.mp4', asset_type: 'video' },
    { id: '2', title: 'B-Roll Beach Sunset', fileName: 'beach_drone.mp4', asset_type: 'video' },
    { id: '3', title: 'Podcast Voiceover Track', fileName: 'voiceover_final.mp3', asset_type: 'audio' },
    { id: '4', title: 'Upbeat Background Music', fileName: 'synthwave_bgm.mp3', asset_type: 'audio' },
    { id: '5', title: 'Company Logo Watermark', fileName: 'logo_transparent.png', asset_type: 'image' },
  ];

  // 1. Empty search -> all assets returned
  const emptyRes = filterAssets(mockAssets, { query: '', type: 'all' });
  assert(emptyRes.length === 5, 'Test 1: Empty search returns all 5 assets');

  // 2. Exact filename search
  const exactRes = filterAssets(mockAssets, { query: 'beach_drone.mp4', type: 'all' });
  assert(exactRes.length === 1 && exactRes[0].id === '2', 'Test 2: Exact filename search returns matching asset');

  // 3. Partial search
  const partialRes = filterAssets(mockAssets, { query: 'voice', type: 'all' });
  assert(partialRes.length === 1 && partialRes[0].id === '3', 'Test 3: Partial search "voice" matches Podcast Voiceover');

  // 4. Case insensitive
  const caseRes = filterAssets(mockAssets, { query: 'TALKING', type: 'all' });
  assert(caseRes.length === 1 && caseRes[0].id === '1', 'Test 4: Case insensitive search "TALKING" matches A-Roll');

  // 5. No results
  const noRes = filterAssets(mockAssets, { query: 'nonexistent_file_123', type: 'all' });
  assert(noRes.length === 0, 'Test 5: Unmatched query returns empty array');

  // 6. Video filter
  const videoRes = filterAssets(mockAssets, { query: '', type: 'video' });
  assert(videoRes.length === 2, 'Test 6: Video filter returns 2 video assets');

  // 7. Audio filter
  const audioRes = filterAssets(mockAssets, { query: '', type: 'audio' });
  assert(audioRes.length === 2, 'Test 7: Audio filter returns 2 audio assets');

  // 8. Image filter
  const imageRes = filterAssets(mockAssets, { query: '', type: 'image' });
  assert(imageRes.length === 1 && imageRes[0].id === '5', 'Test 8: Image filter returns 1 logo image asset');

  // 9. Search + Filter combined
  const combinedRes = filterAssets(mockAssets, { query: 'synthwave', type: 'audio' });
  assert(combinedRes.length === 1 && combinedRes[0].id === '4', 'Test 9: Search "synthwave" + Audio filter returns BGM asset');

  // 10. Clear search restores full list
  const clearedRes = filterAssets(mockAssets, { query: '', type: 'all' });
  assert(clearedRes.length === 5, 'Test 10: Clear search restores full 5 assets');

  // 11. Add new asset during search
  const expandedAssets = [...mockAssets, { id: '6', title: 'New Drone Shot', fileName: 'drone2.mp4', asset_type: 'video' }];
  const expandedRes = filterAssets(expandedAssets, { query: 'drone', type: 'all' });
  assert(expandedRes.length === 2, 'Test 11: Dynamic addition of new asset updates filtered result to 2 drone shots');

  // 12. Immutability guarantee (canonical array untouched)
  assert(mockAssets.length === 5, 'Test 12: Canonical assets array length remains exactly 5');

  return passed;
}

runAssetFilterSanityTests();
