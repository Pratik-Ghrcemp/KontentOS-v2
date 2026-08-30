import { StudioAsset, CaptionSegment } from './types';














export const mockAssets: StudioAsset[] = [
  { id: 'm1', asset_type: 'raw_video', storage_path: '', fileName: 'IMG_4921.MOV', duration_seconds: 15.4 },
  { id: 'm2', asset_type: 'raw_video', storage_path: '', fileName: 'B-ROLL_CITY.MP4', duration_seconds: 8.2 },
  { id: 'm3', asset_type: 'audio', storage_path: '', fileName: 'trending_audio_bgm.mp3', duration_seconds: 60.0 },
];

export const mockMusic: Array<{ id: string; title: string; duration: string; url?: string }> = [
  { id: 'bg1', title: 'Lofi Chill Beat', duration: '2:14' },
  { id: 'bg2', title: 'Viral Pop Synth', duration: '0:45' },
  { id: 'bg3', title: 'Corporate Tech', duration: '1:30' },
];

export const mockInitialCaptions: CaptionSegment[] = [
  { id: 'c1', text: 'Stop scrolling! 🛑', start_time: 0.0, end_time: 2.0 },
  { id: 'c2', text: 'This AI trick', start_time: 2.1, end_time: 4.5 },
  { id: 'c3', text: 'Saves 10 hours a week 🤯', start_time: 4.6, end_time: 7.0 }
];

export interface GraphicElementPreset {
  id: string;
  name: string;
  category: 'sticker' | 'shape' | 'badge' | 'arrow';
  symbol: string;
  color: string;
}

export const mockGraphicElements: GraphicElementPreset[] = [
  { id: 'el-fire', name: 'Trending Fire', category: 'sticker', symbol: '🔥', color: '#f97316' },
  { id: 'el-star', name: 'Gold Star', category: 'badge', symbol: '⭐', color: '#eab308' },
  { id: 'el-check', name: 'Verified Badge', category: 'badge', symbol: '☑️', color: '#3b82f6' },
  { id: 'el-alert', name: 'Warning Alert', category: 'badge', symbol: '⚠️', color: '#ef4444' },
  { id: 'el-arrow-right', name: 'Pointer Arrow', category: 'arrow', symbol: '➔', color: '#06b6d4' },
  { id: 'el-circle', name: 'Focus Circle', category: 'shape', symbol: '⭕', color: '#a855f7' },
  { id: 'el-heart', name: 'Like Heart', category: 'sticker', symbol: '❤️', color: '#ec4899' },
  { id: 'el-zap', name: 'Power Zap', category: 'sticker', symbol: '⚡', color: '#f59e0b' }
];
