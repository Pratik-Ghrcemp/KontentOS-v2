export type AudioAssetType = 'voiceover' | 'sfx' | 'bgm';

export interface GeneratedAudioAsset {
  id: string;
  type: AudioAssetType;
  title: string;
  duration: number; // in seconds
  audioUrl: string; // data URI (data:audio/wav;base64,...) or file path
  waveformPeaks: number[]; // 50 normalized values between 0.05 and 1.0
  metadata: {
    voiceId?: string;
    tone?: string;
    sfxCue?: string;
    bgmMood?: string;
    bpm?: number;
    sampleRate: number;
    format: 'wav' | 'mp3';
    fileSizeBytes: number;
    [key: string]: any;
  };
  createdAt: string;
}

export interface TtsRequest {
  text: string;
  voiceId?: string;
  speed?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number; // 0.5 to 1.5 (default 1.0)
  style?: 'natural' | 'punchy' | 'calm' | 'dramatic' | 'fast';
  wordsPerMinute?: number;
  preferredProvider?: 'local' | 'elevenlabs' | 'openai';
}

export type SfxCueType = 
  | 'whoosh'
  | 'impact'
  | 'glitch'
  | 'sub_drop'
  | 'riser'
  | 'bell'
  | 'notification';

export interface SfxRequest {
  cue: SfxCueType | string;
  duration?: number; // 0.2 to 5.0 seconds
  intensity?: number; // 0.1 to 1.0 (default 0.8)
  variation?: 'cinematic' | 'digital' | 'analog' | 'subtle';
}

export type BgmMoodType = 
  | 'energetic'
  | 'cinematic'
  | 'chill'
  | 'corporate'
  | 'dramatic';

export interface BgmRequest {
  mood: BgmMoodType;
  targetDuration: number; // 5.0 to 180.0 seconds
  bpm?: number; // 60 to 160
  duckingVolume?: number; // volume level during speech (e.g. 0.15 for -16dB)
}

export interface AudioGenerationRequest {
  type: AudioAssetType;
  ttsPayload?: TtsRequest;
  sfxPayload?: SfxRequest;
  bgmPayload?: BgmRequest;
}

export interface AudioProposalPool {
  voiceovers: GeneratedAudioAsset[];
  sfx: GeneratedAudioAsset[];
  bgm: GeneratedAudioAsset[];
}
