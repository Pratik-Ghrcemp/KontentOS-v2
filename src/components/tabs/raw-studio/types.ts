export type ToolId = 'assets' | 'templates' | 'captions' | 'text' | 'effects' | 'audio' | 'brand' | 'settings';
export type AssetType = 'video' | 'audio' | 'image' | 'raw_video' | 'raw_media';
export type CaptionPosition = 'top' | 'middle' | 'bottom';
export type CaptionPreset = 'kinetic' | 'minimal' | 'hormozi' | 'standard';
export type ExportState = 'idle' | 'exporting' | 'done' | 'failed' | 'cancelled';
export type PlatformPreset = 'Instagram Reels' | 'TikTok' | 'YouTube Shorts' | 'Custom';
export type TextOverlayType = 'hook' | 'standard' | 'cta' | 'lower_third' | 'title';
export type RenderCaptionMode = 'burn_in' | 'metadata' | 'none';
export type AutosaveStatus = 'saved' | 'saving' | 'error';
export type ToastType = { message: string; type: 'success' | 'error' | 'info' };

export type VideoClip = {
  id: string;
  assetId: string;
  start: number;
  end: number;
  label: string;
};

export interface AIStatusResponse {
  configured_provider: string;
  resolved_provider: string;
  mock_fallback: boolean;
  model: string;
  azure_configured: boolean;
  openai_configured: boolean;
  missing_fields: string[];
}

export type StudioAsset = {
  id: string;
  project_id?: string;
  user_id?: string;
  asset_type: AssetType | string;
  storage_path: string;
  duration_seconds?: number | null;
  previewUrl?: string;
  fileName?: string;
  _raw_path?: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  projects?: { title?: string | null } | null;
};

export type CaptionSegment = {
  id: string;
  text: string;
  start_time: number;
  end_time: number;
  style?: string;
};

export type TextOverlay = {
  id: string;
  text: string;
  type: TextOverlayType | string;
  start_time: number;
  end_time: number;
  x?: number;
  y?: number;
};

export type CaptionStyle = {
  size: number;
  position: CaptionPosition | string;
  preset: CaptionPreset | string;
  color: string;
  burnIn: boolean;
};

export type AudioSettings = {
  primaryVol: number;
  bgmVol: number;
  voiceCleanup: boolean;
  noiseReduction: boolean;
  autoDuck: boolean;
};

export type { BrandKit } from '@/lib/editing/brand-kit';
