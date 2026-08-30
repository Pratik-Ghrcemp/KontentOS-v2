import { buildRenderRequestFromEditState } from './builder';
import { EditState } from '@/lib/editing/types';

export function runRenderBuilderSanityTests(): boolean {
  let passed = true;
  const assert = (condition: boolean, description: string) => {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${description}`);
      passed = false;
    } else {
      console.log(`✅ TEST PASSED: ${description}`);
    }
  };

  console.log('--- RUNNING RENDER REQUEST BUILDER SANITY TESTS ---');

  const mockEditState: EditState = {
    tracks: [
      { id: 'track-video-1', label: 'Video 1', type: 'video', locked: false, muted: false, visible: true, color: 'cyan' },
      { id: 'track-audio-1', label: 'Audio 1', type: 'audio', locked: false, muted: false, visible: true, color: 'green' },
      { id: 'track-text-1', label: 'Text 1', type: 'text', locked: false, muted: false, visible: true, color: 'rose' },
      { id: 'track-caption-1', label: 'Caption 1', type: 'caption', locked: false, muted: false, visible: true, color: 'amber' }
    ],
    items: [
      { id: 'v1', trackId: 'track-video-1', type: 'video', start: 0, end: 10, sourceIn: 0, sourceOut: 10, assetId: 'asset-1', label: 'Main Video', properties: { opacity: 100, scale: 100, brightness: 110 } },
      { id: 't1', trackId: 'track-text-1', type: 'text', start: 2, end: 5, content: 'Title Overlay', label: 'Title Overlay', properties: { fontSize: 48, color: '#ffffff' } },
      { id: 'c1', trackId: 'track-caption-1', type: 'caption', start: 1, end: 3, content: 'Hello World', label: 'Hello World', properties: { preset: 'kinetic' } },
      { id: 'a1', trackId: 'track-audio-1', type: 'audio', start: 0, end: 8, sourceIn: 0, sourceOut: 8, assetId: 'audio-1', label: 'Voiceover', properties: { volume: 100 } }
    ],
    selection: ['v1'],
    duration: 10
  };

  const payload = buildRenderRequestFromEditState(mockEditState, {
    mediaAssetId: 'asset-1',
    platformPresetId: 'instagram-reels',
    quality: 'high',
    captionMode: 'burn',
    projectTitle: 'Demo Reel',
    selectedLutId: 'teal_orange'
  });

  assert(payload.mediaAssetId === 'asset-1', 'mediaAssetId correctly set to asset-1');
  assert(payload.platformPresetId === 'instagram-reels', 'platformPresetId === instagram-reels');
  assert(payload.timelineClips.length === 1, '1 video clip serialized');
  assert(payload.timelineClips[0].cssFilter.includes('saturate(1.12)'), 'CSS filter includes LUT preset saturate(1.12)');
  assert(payload.timelineClips[0].cssFilter.includes('brightness(1.10)'), 'CSS filter includes custom brightness(1.10)');
  assert(payload.textOverlays.length === 1 && payload.textOverlays[0].text === 'Title Overlay', '1 text overlay serialized');
  assert(payload.captions.length === 1 && payload.captions[0].text === 'Hello World', '1 caption segment serialized');
  assert(payload.audioSettings.clips.length === 1, '1 audio clip serialized in audioSettings');

  return passed;
}

runRenderBuilderSanityTests();
