export type VisualAssetType = 'b_roll' | 'graphic_card' | 'kinetic_title' | 'ai_image' | 'gradient_backdrop';

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type FitMode = 'cover' | 'contain' | 'fill';

export type KenBurnsMotion = 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'subtle_drift' | 'none';

export interface KenBurnsConfig {
  motion: KenBurnsMotion;
  startScale: number; // e.g. 100
  endScale: number;   // e.g. 115
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
}

export interface VisualIntent {
  beatId?: string;
  role?: string;
  primarySubject: string;
  secondarySubjects: string[];
  mood: string;
  motionStyle: string;
  colorTheme: string;
  keywords: string[];
  searchQueries: string[];
  targetDuration: number;
  suggestedStartTime?: number;
}

export interface VisualAssetProposal {
  id: string;
  type: VisualAssetType;
  title: string;
  description?: string;
  previewUrl: string;       // Data URI or public preview path
  sourcePathOrData: string; // Resolvable media path or SVG/base64 payload
  relevanceScore: number;   // 0.0 to 1.0
  targetBeatId?: string;
  suggestedStartTime: number;
  suggestedDuration: number;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  kenBurns: KenBurnsConfig;
  metadata: {
    format: 'svg' | 'png' | 'jpg' | 'mp4';
    width: number;
    height: number;
    tags: string[];
    promptUsed?: string;
    isLocalMatch?: boolean;
    matchedFileName?: string;
  };
  createdAt: string;
}

export interface VisualProposalPool {
  bRollProposals: VisualAssetProposal[];
  graphicCards: VisualAssetProposal[];
  generatedImages: VisualAssetProposal[];
}

export interface VisualIntentRequest {
  beats?: Array<{
    id: string;
    title: string;
    role?: string;
    visualHook?: string;
    spokenText?: string;
    bRollIdeas?: string[];
    estimatedStartTime?: number;
    estimatedDuration?: number;
  }>;
  scriptText?: string;
  aspectRatio?: AspectRatio;
}

export interface ProceduralVisualRequest {
  type: 'kinetic_title' | 'graphic_card' | 'gradient_backdrop';
  headline: string;
  subtitle?: string;
  theme?: 'neon_cyber' | 'minimal_dark' | 'vibrant_creator' | 'corporate_clean' | 'warm_editorial';
  aspectRatio?: AspectRatio;
  duration?: number;
}
