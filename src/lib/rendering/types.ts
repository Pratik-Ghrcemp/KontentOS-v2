export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type RenderQuality = 'high' | 'medium' | 'low' | 'standard';
export type RenderCaptionMode = 'burn' | 'sidecar' | 'off';

export interface RenderPlatformPreset {
  id: string;
  label: string;
  aspectRatio: string;
  width: number;
  height: number;
  fps: number;
  maxDurationSeconds: number;
  recommendedCodec: string;
  bitrateRange: string;
  audioCodec: string;
  notes: string;
}

export interface RenderRequest {
  projectId?: string;
  mediaAssetId: string;
  platformPresetId: string;
  quality: RenderQuality;
  captionMode: RenderCaptionMode;
  timelineClips: any[];
  captions: any[];
  captionStyle: any;
  textOverlays: any[];
  audioSettings: any;
  brandKit: any;
  projectTitle: string;
}

export interface RenderResult {
  fileUrl?: string;
  srtUrl?: string;
  sizeBytes?: number;
  durationSeconds?: number;
}

export interface RenderJob {
  id: string;
  user_id?: string;
  media_asset_id: string;
  status: RenderJobStatus;
  progress: number;
  request_json: RenderRequest;
  result_json?: RenderResult;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export type RenderWorkerProvider = 'mock' | 'local-ffmpeg' | 'external-worker';

export type RenderEffect = 'Smooth Zoom' | 'Auto Crop' | 'Blur BG' | 'Skin Protect' | string;

export interface RenderLayer {
  id: string;
  type: 'video' | 'audio' | 'image' | 'caption' | 'text' | 'overlay' | 'watermark';
  startTime: number;
  endTime: number;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  keyframes?: any[];
}

export interface RenderVideoLayer extends RenderLayer {
  type: 'video';
  sourcePath: string;
  sourceStart: number;
  sourceEnd: number;
  volume: number;
  muted: boolean;
  effects: RenderEffect[];
  cssFilter?: string;
  speed?: number;
  reversed?: boolean;
  transitionIn?: any;
  transitionOut?: any;
}

export interface RenderImageLayer extends RenderLayer {
  type: 'image';
  sourcePath: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderAudioLayer extends RenderLayer {
  type: 'audio';
  sourcePath: string;
  sourceStart: number;
  sourceEnd: number;
  volume: number;
  muted?: boolean;
  ducking: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface RenderCaptionLayer extends RenderLayer {
  type: 'caption';
  text: string;
  style: any; 
}

export interface RenderTextLayer extends RenderLayer {
  type: 'text';
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  preset?: string;
  overlayType?: 'text' | 'sticker' | 'draw';
  svgPath?: string;
  imageUrl?: string;
}

export interface RenderOverlayLayer extends RenderLayer {
  type: 'overlay';
  overlayType: 'sticker' | 'draw' | 'image';
  label?: string;
  text?: string;
  svgPath?: string;
  imageUrl?: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokePoints?: Array<{ x: number; y: number }>;
}

export interface RenderTimeline {
  duration: number;
  layers: RenderLayer[];
}

export interface RenderOutputSpec {
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: string;
  format: string;
}

export interface RenderComposition {
  id: string;
  projectId: string;
  timeline: RenderTimeline;
  outputSpec: RenderOutputSpec;
  captionMode: RenderCaptionMode;
  audioSettings: any;
  brandKit: any;
}

export interface RenderWorkerResult {
  success: boolean;
  fileUrl?: string;
  outputPath?: string;
  srtUrl?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  error?: string;
  logs?: string[];
}

export interface RenderWorkerError {
  message: string;
  code?: string;
  details?: any;
}

export interface FfmpegCommandPlan {
  inputs: string[];
  filterGraph: string[];
  outputs: string[];
  outputFilename: string;
  summary: string;
}
