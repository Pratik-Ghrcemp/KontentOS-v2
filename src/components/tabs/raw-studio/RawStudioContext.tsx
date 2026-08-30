"use client";

import React, { createContext, useContext } from 'react';
import { StudioAsset, CaptionSegment, TextOverlay, CaptionStyle, AudioSettings, BrandKit, VideoClip } from './types';
import { EditState, EditAction } from '@/lib/editing/types';
import { RenderJob } from '@/lib/rendering/types';
import { AiGenerationEvent } from '@/lib/ai/types';

// ─── State Shape ─────────────────────────────────────────────
export interface RawStudioState {
  // Tool
  activeTool: string;
  setActiveTool: (tool: string) => void;

  // Assets
  assets: StudioAsset[];
  setAssets: React.Dispatch<React.SetStateAction<StudioAsset[]>>;
  activeAsset: StudioAsset | null;
  setActiveAsset: (asset: StudioAsset | null) => void;
  uploadingAssets: boolean;

  // Playback
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  timelineDuration: number;
  showSafeGuides: boolean;
  setShowSafeGuides: (v: boolean) => void;
  previewZoom: string;
  setPreviewZoom: (v: string) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  skip: (seconds: number) => void;

  // Captions (Legacy UI support)
  loadingCaptions: boolean;
  captionStyle: CaptionStyle;
  setCaptionStyle: React.Dispatch<React.SetStateAction<CaptionStyle>>;
  activeCaption: CaptionSegment | undefined;
  addCaption: () => void;
  deleteCaption: (id: string) => void;
  duplicateCaption: (id: string) => void;
  updateCaption: (id: string, updates: Partial<CaptionSegment>) => void;

  // Effects & Audio
  activeEffects: string[];
  toggleEffect: (effect: string) => void;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  selectedBgmId: string | null;
  setSelectedBgmId: (id: string | null) => void;

  // Brand
  brandKit: BrandKit;
  setBrandKit: React.Dispatch<React.SetStateAction<BrandKit>>;

  // LUTs
  selectedLutId: string;
  setSelectedLutId: (id: string) => void;

  // Draw Tool State
  drawColor: string;
  setDrawColor: (c: string) => void;
  drawWidth: number;
  setDrawWidth: (w: number) => void;

  // NEW EDITING ENGINE
  editState: EditState;
  dispatch: React.Dispatch<EditAction>;

  // Selection
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  selectSingle: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  splitSelectedClip: () => void;
  deleteSelectedClip: () => void;
  trackStates: Record<string, { locked: boolean; muted: boolean }>;
  toggleTrackLock: (label: string) => void;
  toggleTrackMute: (label: string) => void;

  // Timeline & Resizing
  timelineZoom: number;
  timelineHeight: number;
  setTimelineHeight: React.Dispatch<React.SetStateAction<number>>;
  setTimelineZoom: (zoom: number) => void;
  inspectorWidth: number;
  setInspectorWidth: React.Dispatch<React.SetStateAction<number>>;

  // AI
  aiLoading: Record<string, boolean>;
  aiHistory: AiGenerationEvent[];
  socialCaption: string;
  setSocialCaption: React.Dispatch<React.SetStateAction<string>>;
  suggestedHooks: string[];
  suggestedHashtags: string[];
  suggestedCtas: string[];
  repurposeIdeas: any[];
  handleGenerateCaptions: () => void;
  applyRewrite: (id: string, tone: string) => void;
  loadHooks: () => void;
  loadHashtags: () => void;
  loadCtas: () => void;
  loadRepurpose: () => void;

  // Project
  projectId: string;
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  autosaveStatus: 'saved' | 'saving' | 'error';

  // Export
  exportModal: boolean;
  setExportModal: (open: boolean) => void;
  platformPreset: string;
  setPlatformPreset: (preset: string) => void;
  exportQuality: 'high' | 'medium' | 'low';
  setExportQuality: (q: 'high' | 'medium' | 'low') => void;
  exportCaptionMode: 'burn' | 'sidecar' | 'off';
  setExportCaptionMode: (m: 'burn' | 'sidecar' | 'off') => void;
  activeJob: RenderJob | null;
  setActiveJob: React.Dispatch<React.SetStateAction<RenderJob | null>>;
  exportHistory: RenderJob[];
  handleExport: () => void;
  cancelExport: () => void;

  // UI
  showToast: (msg: string) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilesAdded: (files: FileList | File[]) => void;
  resetDemo: () => void;
}

// ─── Context ─────────────────────────────────────────────────
const RawStudioContext = createContext<RawStudioState | null>(null);

export function useRawStudio(): RawStudioState {
  const ctx = useContext(RawStudioContext);
  if (!ctx) throw new Error('useRawStudio must be used within RawStudioProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────
interface RawStudioProviderProps {
  value: RawStudioState;
  children: React.ReactNode;
}

export function RawStudioProvider({ value, children }: RawStudioProviderProps) {
  return (
    <RawStudioContext.Provider value={value}>
      {children}
    </RawStudioContext.Provider>
  );
}
