/**
 * Phase 22A: Storyboard & Script-to-Video Intelligence Type Definitions
 * 
 * Strict safety boundary: Storyboard types are isolated from canonical timeline items.
 */

export type StoryboardBeatRole = 
  | 'hook' 
  | 'problem' 
  | 'solution' 
  | 'proof' 
  | 'call_to_action' 
  | 'transition';

export type StoryboardTone = 
  | 'energetic' 
  | 'educational' 
  | 'storytelling' 
  | 'sales' 
  | 'casual';

export type StoryboardFormat = 
  | 'instagram-reels' 
  | 'youtube-shorts' 
  | 'tiktok' 
  | 'youtube-landscape';

export type StoryboardTransition = 
  | 'cut' 
  | 'crossfade' 
  | 'zoom_in' 
  | 'slide_left';

export interface ScriptInputRequest {
  rawText?: string;
  topic?: string;
  targetDuration: number; // in seconds, e.g. 15, 30, 60, 90
  tone: StoryboardTone;
  formatPreset: StoryboardFormat;
  wordsPerMinute?: number; // default: 150 WPM
  preferredProvider?: 'ollama' | 'heuristic';
  model?: string;
}

export interface StoryboardBeat {
  id: string;
  beatIndex: number;
  role: StoryboardBeatRole;
  title: string;
  spokenText: string;
  estimatedStartTime: number; // in seconds
  estimatedDuration: number; // in seconds
  visualIntent: string;
  brollKeywords: string[];
  suggestedHeadline?: string;
  transitionType?: StoryboardTransition;
  soundCue?: string;
  confidence: number; // 0 to 100
  isApproved: boolean;
}

export interface StoryboardPlan {
  id: string;
  title: string;
  topic?: string;
  targetDuration: number;
  estimatedTotalDuration: number;
  tone: StoryboardTone;
  formatPreset: StoryboardFormat;
  beats: StoryboardBeat[];
  provider: string;
  createdAt: string;
  validationWarnings?: string[];
}

export interface StoryboardValidationResult {
  isValid: boolean;
  sanitizedPlan: StoryboardPlan;
  rejections: string[];
  warnings: string[];
}
