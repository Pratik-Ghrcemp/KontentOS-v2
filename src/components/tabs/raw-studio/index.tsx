"use client";

import React, { useEffect, useMemo, useRef, useState, useReducer, useCallback } from 'react';
import { historyReducer, initialEditState } from '@/lib/editing/engine';
import { Captions, Download, FileVideo, Music2, PanelRight, Pause, Play,
  Scissors, Settings2, SlidersHorizontal, Sparkles, TextCursorInput,
  Upload, Wand2, LayoutTemplate, Paintbrush, Undo, Redo, CheckCircle,
  ZoomIn, ZoomOut, Lock, VolumeX, Trash2, MonitorPlay, Grid3X3,
  Type, Eye, ChevronLeft, ChevronRight, Hash, Image as ImageIcon,
  MessageSquareShare, Briefcase, Smile, Zap, RefreshCw, Smartphone, Split,
  Copy, Check, Volume2, MicOff, AlignLeft, AlignCenter, AlignRight, Palette,
  RotateCcw, MousePointer2, CloudUpload, Pencil, Clapperboard, Share2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useAppState } from '@/context/state-context';
import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { StudioAsset, CaptionSegment, TextOverlay, CaptionStyle, AudioSettings, BrandKit, VideoClip } from './types';
import { RenderJob, RenderRequest, RenderCaptionMode } from '@/lib/rendering/types';
import { platformPresets } from '@/lib/rendering/presets';
import { generateCaptions, rewriteCaption, suggestHooks, suggestHashtags, suggestCtas, repurposeContent } from '@/lib/ai/ai-service';
import { AiGenerationEvent, CaptionRewriteTone } from '@/lib/ai/types';
import { Toast } from './Toast';
import { RawStudioToolbar } from './RawStudioToolbar';
import { VideoPreview } from './VideoPreview';
import { Timeline } from './Timeline';
import { RawStudioInspector } from './RawStudioInspector';
import { ExportModal } from './ExportModal';
import { getProject, saveProject } from '@/lib/data/projects-service';
import { getMediaAssets, saveMediaAsset, uploadMediaAsset, deleteMediaAsset } from '@/lib/data/media-service';
import { getCaptions, saveCaptions } from '@/lib/data/captions-service';
import { getTextOverlays, saveTextOverlays } from '@/lib/data/text-overlays-service';
import { getAiHistory, saveAiEvent } from '@/lib/data/ai-history-service';
import { getRenderHistory, saveRenderHistory } from '@/lib/data/render-history-service';
import { createRenderJob, cancelRenderJob, subscribeToRenderJob } from '@/lib/rendering/render-service';
import { getMediaMetadata } from '@/lib/utils/media';
import { formatTime, isPlayablePath } from './utils';
import { RawStudioProvider, RawStudioState } from './RawStudioContext';
import { createTimelineItemFromAsset } from '@/lib/editing/factory';
import { createCaptionTimelineItems } from '@/lib/editing/text-factory';
import { buildRenderRequestFromEditState } from '@/lib/rendering/builder';
import { DEFAULT_BRAND_KITS } from '@/lib/editing/brand-kit';

const toolRail = [
    { id: 'select', label: 'Select', icon: MousePointer2 },
    { id: 'smart-cut', label: 'Smart Cut', icon: Scissors },
    { id: 'hooks', label: 'AI Hooks', icon: Zap },
    { id: 'suggestions', label: 'AI Smart Edits', icon: Sparkles },
    { id: 'storyboard', label: 'AI Storyboard', icon: Clapperboard },
    { id: 'publish', label: 'Publish', icon: Share2 },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'captions', label: 'Captions', icon: Captions },
    { id: 'elements', label: 'Elements', icon: LayoutTemplate },
    { id: 'upload', label: 'Upload', icon: CloudUpload },
    { id: 'audio', label: 'Audio', icon: Music2 },
    { id: 'effects', label: 'Effects', icon: Wand2 },
    { id: 'draw', label: 'Draw', icon: Pencil },
    { id: 'brand', label: 'Brand Kit', icon: Paintbrush },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

export function RawStudio() {
  const { user } = useAuth();
  
  const [activeTool, setActiveTool] = useState('select');
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [activeAsset, setActiveAsset] = useState<StudioAsset | null>(null);
  
  // Playback & Canvas
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<string>('fit');
  

  // NEW EDITING ENGINE
  const [historyState, dispatch] = useReducer(historyReducer, { past: [], present: initialEditState, future: [] });
  const editState = historyState.present;
  const timelineDuration = editState.duration; // Ground truth sequence duration

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__kontentos_dispatch = dispatch;
      (window as any).__kontentos_history = historyState;
    }
  }, [dispatch, historyState]);
  
  // Captions (Legacy support pointers mapping to Engine)
  const [loadingCaptions, setLoadingCaptions] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({ size: 1.4, position: 'bottom', preset: 'kinetic', color: '#ffffff', burnIn: true });

  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({ primaryVol: 100, bgmVol: 30, voiceCleanup: false, noiseReduction: false, autoDuck: true });
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit>(DEFAULT_BRAND_KITS.minimal_neo);
  const [selectedLutId, setSelectedLutId] = useState('none');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(6);
  const [ghostProposals, setGhostProposals] = useState<import('@/lib/ai/proposal-types').AiProposal[]>([]);
  const [selectedGhostIds, setSelectedGhostIds] = useState<Set<string>>(new Set());
  const [storyboardPlan, setStoryboardPlan] = useState<import('@/lib/ai/storyboard-types').StoryboardPlan | null>(null);
  const [selectedBeatIds, setSelectedBeatIds] = useState<Set<string>>(new Set());
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [audioProposals, setAudioProposals] = useState<import('@/lib/ai/audio/types').AudioProposalPool>({ voiceovers: [], sfx: [], bgm: [] });
  const [selectedAudioIds, setSelectedAudioIds] = useState<Set<string>>(new Set());
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [visualProposals, setVisualProposals] = useState<import('@/lib/ai/visual/types').VisualAssetProposal[]>([]);
  const [selectedVisualIds, setSelectedVisualIds] = useState<Set<string>>(new Set());
  const [previewVisualModalAsset, setPreviewVisualModalAsset] = useState<import('@/lib/ai/visual/types').VisualAssetProposal | null>(null);
  
  // Phase 25 Publishing State
  const [platformPackages, setPlatformPackages] = useState<import('@/lib/publishing/types').PlatformPackage[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<import('@/lib/publishing/types').PublishingPlatform>>(new Set());
  const [packageOverrides, setPackageOverrides] = useState<Record<string, Partial<import('@/lib/publishing/types').PlatformPackage>>>({});
  const providerCallCount = 0;

  const selectedClipId = editState.selection.length === 1 ? editState.selection[0] : null;

  const selectSingle = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTION', payload: [id] });
  }, [dispatch]);

  const toggleSelection = useCallback((id: string) => {
    const current = editState.selection;
    const exists = current.includes(id);
    const updated = exists ? current.filter(item => item !== id) : [...current, id];
    dispatch({ type: 'SET_SELECTION', payload: updated });
  }, [editState.selection, dispatch]);

  const selectMultiple = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTION', payload: ids });
  }, [dispatch]);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTION', payload: [] });
  }, [dispatch]);

  const setSelectedClipId = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTION', payload: id ? [id] : [] });
  }, [dispatch]);

  // Clean stale selection pointers if items are deleted or removed
  useEffect(() => {
    if (editState.selection.length > 0) {
      const validSelection = editState.selection.filter(id => editState.items.some(item => item.id === id));
      if (validSelection.length !== editState.selection.length) {
        dispatch({ type: 'SET_SELECTION', payload: validSelection });
      }
    }
  }, [editState.items, editState.selection, dispatch]);

  const [timelineZoom, setTimelineZoom] = useState(50);
  const [timelineHeight, setTimelineHeight] = useState(250);
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [isDraggingInspector, setIsDraggingInspector] = useState(false);
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const workbenchRef = useRef<HTMLDivElement>(null);

  const handleInspectorResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    try { target.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingInspector(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = inspectorWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(260, startWidth - deltaX), 550);
      setInspectorWidth(newWidth);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture(upEvent.pointerId); } catch {}
      setIsDraggingInspector(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
      target.removeEventListener('pointercancel', handlePointerUp);
    };

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
    target.addEventListener('pointercancel', handlePointerUp);
  };

  const handleTimelineResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    try { target.setPointerCapture(e.pointerId); } catch {}
    setIsDraggingTimeline(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const startY = e.clientY;
    const startHeight = timelineHeight;

    const availableHeight = workbenchRef.current ? workbenchRef.current.clientHeight : 700;
    const maxTimelineHeight = Math.max(200, availableHeight - 220); // Guarantee at least 220px for preview canvas

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.min(Math.max(160, startHeight - deltaY), maxTimelineHeight);
      setTimelineHeight(newHeight);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture(upEvent.pointerId); } catch {}
      setIsDraggingTimeline(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
      target.removeEventListener('pointercancel', handlePointerUp);
    };

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
    target.addEventListener('pointercancel', handlePointerUp);
  };

  // AI State
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiHistory, setAiHistory] = useState<AiGenerationEvent[]>([]);
  const [socialCaption, setSocialCaption] = useState('');
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([]);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [suggestedCtas, setSuggestedCtas] = useState<string[]>([]);
  const [repurposeIdeas, setRepurposeIdeas] = useState<any[]>([]);

  // Project settings
  const [projectId, setProjectId] = useState<string>('demo');
  const [projectTitle, setProjectTitle] = useState('Untitled Reel');
  const [autosaveStatus, setAutosaveStatus] = useState<'saved'|'saving'|'error'>('saved');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [uploadingAssets, setUploadingAssets] = useState(false);

  // Export
  const [exportModal, setExportModal] = useState(false);
  const [platformPreset, setPlatformPreset] = useState('instagram-reels');
  const [exportQuality, setExportQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [exportCaptionMode, setExportCaptionMode] = useState<'burn' | 'sidecar' | 'off'>('burn');
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null);
  const [exportHistory, setExportHistory] = useState<RenderJob[]>([]);

  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  // Load from LocalStorage or Supabase
  useEffect(() => {
    if (isDemoMode() || !isSupabaseConfigured()) {
      try {
        const saved = localStorage.getItem('kontentos_demo_state');
        if (saved) {
          const s = JSON.parse(saved);
          if (s.editState) dispatch({ type: 'SET_STATE', payload: s.editState });
          if (s.captionStyle) setCaptionStyle(s.captionStyle);
          if (s.brandKit) setBrandKit(s.brandKit);
          if (s.platformPreset) setPlatformPreset(s.platformPreset);
          if (s.exportHistory) setExportHistory(s.exportHistory);
          if (s.projectTitle) setProjectTitle(s.projectTitle);
          if (s.aiHistory) setAiHistory(s.aiHistory);
          if (s.socialCaption) setSocialCaption(s.socialCaption);
          if (s.selectedBgmId) setSelectedBgmId(s.selectedBgmId);
          if (s.audioSettings) setAudioSettings(s.audioSettings);
          if (s.activeEffects) setActiveEffects(s.activeEffects);
          if (s.selectedLutId) setSelectedLutId(s.selectedLutId);
          if (s.drawColor) setDrawColor(s.drawColor);
          if (s.drawWidth) setDrawWidth(s.drawWidth);
          if (s.exportQuality) setExportQuality(s.exportQuality);
          if (s.exportCaptionMode) setExportCaptionMode(s.exportCaptionMode);
          if (s.assets && Array.isArray(s.assets) && s.assets.length > 0) {
            setAssets(s.assets);
            setActiveAsset(s.assets[0]);
          }
          if (s.ghostProposals && Array.isArray(s.ghostProposals)) {
            setGhostProposals(s.ghostProposals);
          }
          if (s.selectedGhostIds && Array.isArray(s.selectedGhostIds)) {
            setSelectedGhostIds(new Set(s.selectedGhostIds));
          }
        }
      } catch (e) {
        console.warn('Could not restore local studio state', e);
      }
    } else if (projectId) {
      // Production Supabase Hydration
      getProject(projectId).then(proj => {
        if (proj && proj.settings) {
          const settings = proj.settings as any;
          if (settings.editState) dispatch({ type: 'SET_STATE', payload: settings.editState });
          if (settings.captionStyle) setCaptionStyle(settings.captionStyle);
          if (settings.brandKit) setBrandKit(settings.brandKit);
          if (settings.audioSettings) setAudioSettings(settings.audioSettings);
          if (settings.selectedLutId) setSelectedLutId(settings.selectedLutId);
          if (settings.activeEffects) setActiveEffects(settings.activeEffects);
          if (proj.title) setProjectTitle(proj.title);
          if (proj.platform_preset) setPlatformPreset(proj.platform_preset);
        }
      }).catch(err => console.warn('Supabase project hydration error:', err));
    }
  }, [projectId]);

  // Save to LocalStorage & Supabase Real Mode
  useEffect(() => {
    if (isDemoMode() || !isSupabaseConfigured()) {
      const s = {
        editState, captionStyle, brandKit, platformPreset, projectTitle, exportHistory, aiHistory, socialCaption, selectedBgmId, projectId, user,
        audioSettings, activeEffects, selectedLutId, drawColor, drawWidth, exportQuality, exportCaptionMode,
        assets, ghostProposals, selectedGhostIds: Array.from(selectedGhostIds)
      };
      localStorage.setItem('kontentos_demo_state', JSON.stringify(s));
    } else if (user?.id && projectId) {
      const timer = setTimeout(() => {
        saveProject({
          id: projectId,
          user_id: user.id,
          title: projectTitle,
          platform_preset: platformPreset,
          settings: {
            editState,
            captionStyle,
            brandKit,
            audioSettings,
            selectedLutId,
            activeEffects,
            exportQuality,
            exportCaptionMode
          } as any
        }).catch(err => console.warn('Supabase saveProject auto-sync error:', err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [editState, captionStyle, brandKit, platformPreset, projectTitle, exportHistory, socialCaption, aiHistory, selectedBgmId, projectId, user, audioSettings, activeEffects, selectedLutId, drawColor, drawWidth, exportQuality, exportCaptionMode, assets, ghostProposals, selectedGhostIds]);

  const videoSrc = activeAsset?.previewUrl || (isPlayablePath(activeAsset?.storage_path) ? activeAsset?.storage_path : '');
  const activeAssetId = activeAsset?.id;

  const activeCaption = useMemo(
    () => editState.items.find((item) => item.type === 'caption' && currentTime >= item.start && currentTime <= item.end) as any,
    [currentTime, editState.items]
  );
  
  const activeTexts = useMemo(
    () => editState.items.filter((item) => item.type === 'text' && currentTime >= item.start && currentTime <= item.end) as any,
    [currentTime, editState.items]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) {
      showToast('Upload a video first');
      return;
    }

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      showToast('Video playback could not start');
    }
  };

  const seekTo = (time: number) => {
    const nextTime = Math.max(0, Math.min(time, timelineDuration));
    if (videoRef.current) { videoRef.current.currentTime = nextTime; }
    setCurrentTime(nextTime);
  };
  
  const skip = (s: number) => seekTo(currentTime + s);

  const handleFilesAdded = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    setUploadingAssets(true);
    const addedAssets: StudioAsset[] = [];
    let firstVideoClip: any = null;

    try {
      for (const file of fileList) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name);
        const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(file.name);
        const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|svg)$/i.test(file.name);

        if (!isVideo && !isAudio && !isImage) {
          showToast(`Skipped unsupported file: ${file.name}`);
          continue;
        }

        if (file.size > 100 * 1024 * 1024) {
          showToast(`File ${file.name} exceeds 100MB limit.`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
        const assetId = `local-${crypto.randomUUID()}`;
        const assetType = isVideo ? 'raw_video' : isAudio ? 'audio' : 'image';

        const localAsset: StudioAsset & { file?: File; blob?: Blob } = {
          id: assetId,
          user_id: user?.id,
          asset_type: assetType as any,
          storage_path: `local-preview/${file.name}`,
          previewUrl,
          fileName: file.name,
          mime_type: file.type,
          file_size: file.size,
          duration_seconds: 0,
          projects: { title: file.name.replace(/\.[^.]+$/, '') },
          file,
          blob: file
        };

        // Save in IndexedDB for session refresh persistence
        import('@/lib/data/indexed-db-media').then(({ storeMediaBlob }) => {
          storeMediaBlob(assetId, file, localAsset).catch(e => console.warn('IndexedDB save skipped:', e));
        });

        addedAssets.push(localAsset);

        // If no active asset, activate the first video or media
        if (isVideo && (!activeAsset || addedAssets.length === 1)) {
          setActiveAsset(localAsset);
          firstVideoClip = createTimelineItemFromAsset(localAsset, { startTime: 0, customDuration: 0 });
        }

        // Asynchronously extract and update metadata
        getMediaMetadata(file).then(metadata => {
          const realDuration = Number.isFinite(metadata.duration) && metadata.duration ? metadata.duration : (isImage ? 4 : 0);
          setAssets(prev => prev.map(a => a.id === assetId ? { ...a, duration_seconds: realDuration, width: metadata.width, height: metadata.height } : a));
          if (firstVideoClip && firstVideoClip.assetId === assetId) {
            setDuration(realDuration);
            dispatch({ type: 'TRIM_ITEM', payload: { id: firstVideoClip.id, newStart: 0, newEnd: realDuration } });
          }
        }).catch(() => {});
      }

      if (addedAssets.length > 0) {
        setAssets(prev => [...addedAssets, ...prev]);
        if (firstVideoClip) {
          dispatch({ type: 'ADD_ITEM', payload: firstVideoClip });
          selectSingle(firstVideoClip.id);
        }
        showToast(`Added ${addedAssets.length} asset${addedAssets.length > 1 ? 's' : ''} to Project Media`);
      }
    } finally {
      setUploadingAssets(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      void handleFilesAdded(event.target.files);
    }
    event.target.value = '';
  };

  useEffect(() => {
    if (!activeAssetId || !Number.isFinite(duration) || duration <= 0) return;

    setAssets(prev => prev.map(asset => (
      asset.id === activeAssetId ? { ...asset, duration_seconds: duration } : asset
    )));
  }, [activeAssetId, duration]);

  const updateCaption = async (id: string, updates: Partial<CaptionSegment>) => {
    const item = editState.items.find(i => i.id === id);
    if (item) {
      if (updates.text) {
        dispatch({
          type: 'UPDATE_PROPERTIES',
          payload: { id, properties: { ...item.properties, text: updates.text } }
        });
      }
      if (updates.start_time !== undefined || updates.end_time !== undefined) {
        dispatch({
          type: 'MOVE_ITEM',
          payload: {
            id,
            newStart: updates.start_time ?? item.start,
            newEnd: updates.end_time ?? item.end
          }
        });
      }
    }
  };

  const addCaption = () => {
    const newItem = {
      id: `caption-${crypto.randomUUID()}`,
      trackId: 'track-text-1',
      type: 'text' as const,
      start: currentTime,
      end: Math.min(timelineDuration || 15, currentTime + 3.0),
      label: 'New Caption',
      content: 'New Caption',
      properties: { x: 0, y: 150, fontSize: 36, color: '#ffffff', zIndex: 20 }
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
    selectSingle(newItem.id);
    showToast('Added caption segment to timeline');
  };

  const deleteCaption = (id: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: { id } });
    showToast('Deleted caption segment');
  };

  const duplicateCaption = (id: string) => {
    dispatch({ type: 'DUPLICATE_ITEM', payload: { id } });
    showToast('Duplicated caption segment');
  };
  
  const withAiLoading = async (key: string, taskType: any, action: () => Promise<string>) => {
    if (aiLoading[key]) return;
    setAiLoading(p => ({ ...p, [key]: true }));
    try {
      const preview = await action();
      const ev = { task_type: taskType, preview };
      await saveAiEvent(ev, user?.id || 'local');
      setAiHistory(await getAiHistory());
    } catch (e) {
      showToast('AI request failed.');
    } finally {
      setAiLoading(p => ({ ...p, [key]: false }));
    }
  };

  const { state: appState } = useAppState();
  const creatorProfile = appState?.creatorProfile;
  const importedIdeaIdRef = useRef<string | null>(null);

  useEffect(() => {
    const idea = appState?.studioIdeaContext;
    if (!idea) return;
    const ideaKey = `${idea.id || idea.idea}-${idea.createdAt}`;
    if (importedIdeaIdRef.current === ideaKey) return;
    importedIdeaIdRef.current = ideaKey;

    const hookText = idea.hook || idea.suggestedScript || idea.idea;
    const scriptText = idea.suggestedScript || `${hookText}\n\n${idea.idea}`;
    const topic = idea.topic || idea.idea || 'Studio Idea';
    const targetDuration = idea.contentGoal?.includes('15') ? 15 : idea.contentGoal?.includes('60') ? 60 : 30;
    const hookDuration = Math.min(6, Math.max(3, Math.round(targetDuration * 0.25)));
    const bodyDuration = Math.max(6, targetDuration - hookDuration - 5);
    const now = Date.now();
    const beats = [
      {
        id: `idea-hook-${now}`,
        beatIndex: 0,
        role: 'hook' as const,
        title: 'Hook',
        spokenText: hookText,
        estimatedStartTime: 0,
        estimatedDuration: hookDuration,
        visualIntent: `Open with a strong creator-facing hook for ${topic}`,
        brollKeywords: [topic, creatorProfile?.proNiche || 'creator workflow', 'attention hook'],
        suggestedHeadline: hookText.slice(0, 72),
        transitionType: 'cut' as const,
        confidence: 92,
        isApproved: true,
      },
      {
        id: `idea-script-${now}`,
        beatIndex: 1,
        role: 'solution' as const,
        title: 'Script Body',
        spokenText: scriptText,
        estimatedStartTime: hookDuration,
        estimatedDuration: bodyDuration,
        visualIntent: `Show practical examples and visual proof points for ${topic}`,
        brollKeywords: [creatorProfile?.proSubNiche || 'workflow', 'dashboard', 'before after'],
        suggestedHeadline: topic.slice(0, 72),
        transitionType: 'zoom_in' as const,
        confidence: 88,
        isApproved: true,
      },
      {
        id: `idea-cta-${now}`,
        beatIndex: 2,
        role: 'call_to_action' as const,
        title: 'CTA',
        spokenText: creatorProfile?.customCatchphrase || 'Save this and try it in your next video.',
        estimatedStartTime: hookDuration + bodyDuration,
        estimatedDuration: Math.max(3, targetDuration - hookDuration - bodyDuration),
        visualIntent: `End with a clear save, follow, or try-this-next action for ${idea.platform || 'short-form video'}`,
        brollKeywords: ['call to action', 'save button', 'creator result'],
        suggestedHeadline: 'Try this today',
        transitionType: 'cut' as const,
        confidence: 86,
        isApproved: true,
      },
    ];

    setProjectTitle(topic);
    setStoryboardPlan({
      id: `idea-plan-${now}`,
      title: topic,
      topic,
      targetDuration,
      estimatedTotalDuration: targetDuration,
      tone: creatorProfile?.mode === 'pro' ? 'educational' : 'energetic',
      formatPreset: idea.platform?.toLowerCase().includes('youtube') ? 'youtube-shorts' : 'instagram-reels',
      beats,
      provider: 'idea-studio-bridge',
      createdAt: new Date().toISOString(),
    });
    setSelectedBeatIds(new Set(beats.map(beat => beat.id)));
    setActiveBeatIndex(0);
    setActiveTool('storyboard');
    showToast('Idea imported into Studio storyboard');
  }, [appState?.studioIdeaContext, creatorProfile]);

  const handleGenerateCaptions = () => {
    if (!activeAsset) { showToast('No active asset'); return; }
    withAiLoading('captions', 'caption_generation', async () => {
      showToast('Transcribing speech & generating captions...');
      const res = await generateCaptions({
        durationSeconds: Math.round(timelineDuration || 15),
        creatorProfile
      });

      // Clear existing captions to prevent duplicate stacking on regeneration
      const existingCaptions = editState.items.filter(i => i.type === 'caption');
      existingCaptions.forEach(c => dispatch({ type: 'DELETE_ITEM', payload: { id: c.id } }));

      const captionItems = createCaptionTimelineItems(res.segments, captionStyle.preset);
      captionItems.forEach(item => dispatch({ type: 'ADD_ITEM', payload: item }));

      if (captionItems.length > 0) {
        selectSingle(captionItems[0].id);
      }

      showToast(`Generated ${captionItems.length} captions synchronized to timeline!`);
      return `Generated ${captionItems.length} caption segments`;
    });
  };

  const applyRewrite = (id: string, type: string) => {
    const cap = editState.items.find(c => c.id === id && c.type === 'caption') as any;
    if (!cap) { showToast('Select a caption block first'); return; }
    withAiLoading(`rewrite-${id}`, 'caption_rewrite', async () => {
      const res = await rewriteCaption({
        text: cap.text,
        tone: type as CaptionRewriteTone,
        creatorProfile
      });
      updateCaption(id, { text: res.rewrittenText });
      showToast(`${type} rewrite applied!`);
      return `Rewrote: "${res.rewrittenText.slice(0, 30)}..."`;
    });
  };

  const loadHooks = () => {
    withAiLoading('hooks', 'hook_suggestion', async () => {
      const res = await suggestHooks({
        topic: projectTitle,
        creatorProfile
      });
      setSuggestedHooks(res.hooks);
      return 'Generated hook ideas';
    });
  };

  const loadHashtags = () => {
    withAiLoading('hashtags', 'hashtag_suggestion', async () => {
      const res = await suggestHashtags({
        topic: projectTitle,
        platform: platformPresets[platformPreset]?.label || 'Custom',
        creatorProfile
      });
      setSuggestedHashtags(res.hashtags);
      return 'Generated hashtag ideas';
    });
  };

  const loadCtas = () => {
    withAiLoading('ctas', 'cta_suggestion', async () => {
      const res = await suggestCtas({
        goal: 'Engagement',
        creatorProfile
      });
      setSuggestedCtas(res.ctas);
      return 'Generated CTA ideas';
    });
  };

  const loadRepurpose = () => {
    withAiLoading('repurpose', 'repurpose', async () => {
      const res = await repurposeContent({
        sourceText: projectTitle,
        creatorProfile
      });
      setRepurposeIdeas(res.ideas);
      return 'Generated repurpose ideas';
    });
  };

  const splitSelectedClip = () => {
    if (!selectedClipId) return;
    dispatch({ type: 'SPLIT_ITEM', payload: { id: selectedClipId, time: currentTime } });
  };

  const deleteSelectedClip = () => {
    if (editState.selection.length === 0) return;
    const count = editState.selection.length;
    editState.selection.forEach(id => {
      dispatch({ type: 'DELETE_ITEM', payload: { id, ripple: false } });
    });
    dispatch({ type: 'SET_SELECTION', payload: [] });
    showToast(`${count} clip(s) deleted`);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'Backspace' || e.code === 'Delete') {
        if (editState.selection.length > 0) {
          deleteSelectedClip();
        }
      } else if (e.key === ',' || e.code === 'Comma') {
        e.preventDefault();
        const frameTime = 1 / 30;
        seekTo(Math.max(0, currentTime - frameTime));
      } else if (e.key === '.' || e.code === 'Period') {
        e.preventDefault();
        const frameTime = 1 / 30;
        seekTo(Math.min(timelineDuration, currentTime + frameTime));
      } else if (e.code === 'Escape') {
        if (editState.selection.length > 0) {
          clearSelection();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
          showToast('Redo action');
        } else {
          dispatch({ type: 'UNDO' });
          showToast('Undo action');
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        showToast('Redo action');
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        if (editState.selection.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.code === 'ArrowLeft') dx = -step;
          if (e.code === 'ArrowRight') dx = +step;
          if (e.code === 'ArrowUp') dy = -step;
          if (e.code === 'ArrowDown') dy = +step;

          const batchPayload = editState.selection.map(id => {
            const item = editState.items.find(i => i.id === id);
            return {
              id,
              properties: {
                x: (item?.properties?.x ?? 0) + dx,
                y: (item?.properties?.y ?? 0) + dy
              }
            };
          });

          dispatch({
            type: 'BATCH_UPDATE_PROPERTIES',
            payload: batchPayload
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState.selection, editState.items, dispatch, clearSelection, togglePlay]);

  const resetDemo = () => {
    localStorage.removeItem('kontentos_demo_state');
    import('@/lib/data/indexed-db-media').then(({ clearMediaBlobs }) => {
      clearMediaBlobs().catch(() => {});
    });
    setAssets([]);
    setActiveAsset(null);
    dispatch({ type: 'SET_STATE', payload: initialEditState });
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    showToast('Project reset to default state');
  };

  const loadDemoProject = useCallback(() => {
    const demoAsset: StudioAsset = {
      id: 'demo-creator-asset-1',
      asset_type: 'raw_video',
      storage_path: '/test_spoken_video.mp4',
      previewUrl: '/test_spoken_video.mp4',
      fileName: 'KontentOS_Creator_Pitch.mp4',
      duration_seconds: 6.0,
      file_size: 2132177
    };

    setAssets([demoAsset]);
    setActiveAsset(demoAsset);
    setProjectTitle('KontentOS Showcase Reel');
    setDuration(6.0);

    const videoItem: import('@/lib/editing/types').TimelineItem = {
      id: 'item-demo-video-1',
      trackId: 'track-video-main',
      type: 'video',
      start: 0,
      end: 6.0,
      sourceIn: 0,
      sourceOut: 6.0,
      assetId: demoAsset.id,
      label: 'Speaker Track (9:16)',
      properties: { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 }
    };

    const textItem: import('@/lib/editing/types').TimelineItem = {
      id: 'item-demo-title-1',
      trackId: 'track-overlay-1',
      type: 'text',
      start: 0.2,
      end: 3.0,
      content: '🚀 The Future of Content Creation',
      label: 'Kinetic Hook Card',
      properties: { opacity: 1, scale: 1, x: 0, y: -220, rotation: 0, fontSize: 32, color: '#facc15' }
    };

    const caption1: import('@/lib/editing/types').TimelineItem = {
      id: 'item-demo-cap-1',
      trackId: 'track-overlay-1',
      type: 'caption',
      start: 0,
      end: 2.8,
      content: 'KontentOS is the AI Creator Operating System.',
      label: 'Caption 1',
      properties: { fontSize: 26, color: '#ffffff', opacity: 1, scale: 1, x: 0, y: 180, rotation: 0 }
    };

    const caption2: import('@/lib/editing/types').TimelineItem = {
      id: 'item-demo-cap-2',
      trackId: 'track-overlay-1',
      type: 'caption',
      start: 2.8,
      end: 6.0,
      content: 'Automate editing, platform packaging, and distribution in seconds.',
      label: 'Caption 2',
      properties: { fontSize: 26, color: '#ffffff', opacity: 1, scale: 1, x: 0, y: 180, rotation: 0 }
    };

    dispatch({
      type: 'SET_STATE',
      payload: {
        duration: 6.0,
        tracks: [
          { id: 'track-overlay-1', label: 'Overlays', type: 'text', locked: false, muted: false, visible: true, color: '#a855f7' },
          { id: 'track-video-main', label: 'Main Video', type: 'video', locked: false, muted: false, visible: true, color: '#6366f1' },
          { id: 'track-audio-main', label: 'Audio / SFX', type: 'audio', locked: false, muted: false, visible: true, color: '#10b981' }
        ],
        items: [textItem, videoItem, caption1, caption2],
        selection: []
      }
    });

    setGhostProposals([
      {
        id: 'ghost-prop-1',
        kind: 'hook',
        title: 'Viral Question Hook',
        startTime: 0,
        endTime: 2.5,
        confidence: 94,
        reasoning: 'Question hooks increase 3-second retention by 38% for tech topics.',
        source: 'heuristic',
        status: 'proposed',
        targetTrackId: 'track-overlay-1',
        data: {
          text: 'Stop Wasting 5 Hours Editing Reels!',
          color: '#facc15',
          stylePreset: 'kinetic'
        }
      },
      {
        id: 'ghost-prop-2',
        kind: 'zoom',
        title: 'Dynamic Punch-in on Key Takeaway',
        startTime: 2.8,
        endTime: 5.4,
        confidence: 89,
        reasoning: 'Punch-in reframes subject on strong value statement.',
        source: 'heuristic',
        status: 'proposed',
        targetTrackId: 'track-video-main',
        data: {
          scale: 1.15
        }
      }
    ]);

    setSelectedGhostIds(new Set(['ghost-prop-1']));
    setActiveTool('suggestions');
    showToast('✨ Showcase Demo Project Loaded (1-Click Ready)');
  }, [dispatch]);

  const handleExport = async () => {
    const targetAsset = activeAsset || assets[0] || (editState.items.find(i => i.type === 'video') as any);
    if (!targetAsset) {
      showToast('No video or media asset found in project!');
      return;
    }
    if (activeJob && (activeJob.status === 'processing' || activeJob.status === 'queued')) {
      showToast('Export already in progress!');
      return;
    }
    
    const request = buildRenderRequestFromEditState(editState, {
      projectId,
      mediaAssetId: targetAsset.id,
      platformPresetId: platformPreset,
      quality: exportQuality,
      captionMode: exportCaptionMode,
      projectTitle,
      captionStyle,
      audioSettings,
      brandKit,
      selectedLutId
    });
    
    try {
      const job = await createRenderJob(request);
      setActiveJob(job);
      setExportHistory(prev => [job, ...prev].slice(0, 5));
      showToast('Export started!');
    } catch (err) {
      showToast('Failed to start export');
    }
  };

  const cancelExport = async () => {
    if (!activeJob) return;
    await cancelRenderJob(activeJob.id);
    setActiveJob(null);
    showToast('Export cancelled');
  };

  useEffect(() => {
    if (!activeJob) return;
    const unsub = subscribeToRenderJob(activeJob.id, (updatedJob) => {
      setActiveJob(updatedJob);
      setExportHistory(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      
      if (updatedJob.status === 'completed') showToast('Export complete!');
      if (updatedJob.status === 'failed') showToast('Export failed!');
    });
    return () => unsub();
  }, [activeJob]);
  
  const toggleTrackLock = (label: string) => dispatch({ type: 'TOGGLE_TRACK_LOCK', payload: { id: label } });
  const trackStates = {}; // Mock legacy support
  const toggleTrackMute = (label: string) => dispatch({ type: 'TOGGLE_TRACK_MUTE', payload: { id: label } });
  const toggleEffect = (eff: string) => {
    setActiveEffects(p => p.includes(eff) ? p.filter(e => e !== eff) : [...p, eff]);
    showToast(`Effect ${eff} toggled`);
  };

  const ctxValue: RawStudioState = {
    activeTool, setActiveTool,
    assets, setAssets, activeAsset, setActiveAsset, uploadingAssets,
    isPlaying, setIsPlaying, currentTime, setCurrentTime, duration, setDuration, timelineDuration, showSafeGuides, setShowSafeGuides, previewZoom, setPreviewZoom,
    togglePlay, seekTo, skip,
    
    // NEW ENGINE
    editState, dispatch,
    
    loadingCaptions, captionStyle, setCaptionStyle, activeCaption, addCaption, deleteCaption, duplicateCaption, updateCaption,
    
    activeEffects, toggleEffect, audioSettings, setAudioSettings, selectedBgmId, setSelectedBgmId,
    brandKit, setBrandKit,
    selectedLutId, setSelectedLutId,
    drawColor, setDrawColor, drawWidth, setDrawWidth,
    
    // Selection API
    timelineZoom, setTimelineZoom, timelineHeight, setTimelineHeight, inspectorWidth, setInspectorWidth,
    selectedClipId, setSelectedClipId,
    selectSingle, toggleSelection, selectMultiple, clearSelection,
    splitSelectedClip, deleteSelectedClip,
    trackStates, toggleTrackLock, toggleTrackMute,
    
    aiLoading, aiHistory,
    ghostProposals, setGhostProposals, selectedGhostIds, setSelectedGhostIds,
    storyboardPlan, setStoryboardPlan, selectedBeatIds, setSelectedBeatIds,
    activeBeatIndex, setActiveBeatIndex,
    audioProposals, setAudioProposals, selectedAudioIds, setSelectedAudioIds,
    playingAudioId, setPlayingAudioId,
    visualProposals, setVisualProposals, selectedVisualIds, setSelectedVisualIds,
    previewVisualModalAsset, setPreviewVisualModalAsset,
    platformPackages, setPlatformPackages, selectedPlatformIds, setSelectedPlatformIds,
    packageOverrides, setPackageOverrides, providerCallCount,
    socialCaption, setSocialCaption,
    suggestedHooks, suggestedHashtags, suggestedCtas, repurposeIdeas,
    handleGenerateCaptions, applyRewrite, loadHooks, loadHashtags, loadCtas, loadRepurpose,
    projectId, projectTitle, setProjectTitle: (t: string) => setProjectTitle(t), autosaveStatus,
    exportModal, setExportModal, platformPreset, setPlatformPreset,
    exportQuality, setExportQuality, exportCaptionMode, setExportCaptionMode,
    activeJob, setActiveJob, exportHistory, handleExport, cancelExport,
    showToast, videoRef, fileInputRef, handleFileSelected, handleFilesAdded, resetDemo, loadDemoProject,
  };

  return (
    <RawStudioProvider value={ctxValue}>
    <div className="raw-studio-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden', position: 'relative' }}>
      {/* Toast Notification */}
      <Toast message={toast} />

      <input ref={fileInputRef} type="file" multiple accept="video/*,audio/*,image/*,.mp4,.mov,.m4v,.webm,.mkv,.mp3,.wav,.ogg,.aac,.m4a,.png,.jpg,.jpeg,.webp" hidden onChange={handleFileSelected} />

      <RawStudioToolbar 
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        autosaveStatus={autosaveStatus}
        previewZoom={previewZoom}
        setPreviewZoom={setPreviewZoom}
        setActiveTool={setActiveTool}
        setExportModal={setExportModal}
      />

      <section ref={workbenchRef} className="studio-workbench" style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left Tool Rail */}
        <div style={{ position: 'relative', width: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <nav className="studio-tool-rail" style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', 
            padding: '1.25rem 0.5rem', 
            background: 'var(--bg-surface)', 
            borderRadius: '40px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-subtle)',
            height: 'max-content',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            {toolRail.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id && !exportModal;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => { setActiveTool(tool.id); setExportModal(false); }}
                  title={tool.label}
                  aria-label={tool.label}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'var(--bg-base)', border: 'none', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', width: '100%', padding: '0 4px' }}
                >
                  <div style={{ padding: '10px', borderRadius: '12px', background: isActive ? 'var(--accent-primary-glow)' : 'transparent', transition: 'background 0.2s' }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 500, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{tool.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center Workspace (Canvas + Timeline) */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
          <VideoPreview />
          
          {/* Horizontal Hairline Resizable Splitter */}
          <div
            onPointerDown={handleTimelineResizeStart}
            title="Resize timeline"
            style={{
              height: '1px',
              margin: '-4px 0',
              padding: '4px 0',
              cursor: 'row-resize',
              userSelect: 'none',
              flexShrink: 0,
              zIndex: 25,
              position: 'relative',
              boxSizing: 'content-box',
              background: 'transparent',
            }}
          >
            <div
              style={{
                height: '1px',
                width: '100%',
                background: isDraggingTimeline ? 'var(--accent-primary)' : 'var(--border-subtle)',
                boxShadow: isDraggingTimeline ? '0 0 8px var(--accent-primary)' : 'none',
                transition: 'background 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isDraggingTimeline) e.currentTarget.style.background = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isDraggingTimeline) e.currentTarget.style.background = 'var(--border-subtle)';
              }}
            />
          </div>

          <Timeline />
        </div>

        {/* Vertical Hairline Resizable Splitter */}
        <div
          onPointerDown={handleInspectorResizeStart}
          title="Resize panel"
          style={{
            width: '1px',
            margin: '0 -4px',
            padding: '0 4px',
            cursor: 'col-resize',
            userSelect: 'none',
            flexShrink: 0,
            zIndex: 25,
            position: 'relative',
            boxSizing: 'content-box',
            background: 'transparent',
          }}
        >
          <div
            style={{
              width: '1px',
              height: '100%',
              background: isDraggingInspector ? 'var(--accent-primary)' : 'var(--border-subtle)',
              boxShadow: isDraggingInspector ? '0 0 8px var(--accent-primary)' : 'none',
              transition: 'background 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isDraggingInspector) e.currentTarget.style.background = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isDraggingInspector) e.currentTarget.style.background = 'var(--border-subtle)';
            }}
          />
        </div>

        {/* Right Inspector */}
        <aside className="studio-inspector" style={{ width: `${inspectorWidth}px`, maxWidth: '100%', flexShrink: 0, height: '100%', minHeight: 0, background: 'var(--bg-surface)', borderLeft: 'none', padding: '0', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <RawStudioInspector />
        </aside>
      </section>
      <ExportModal />
    </div>
    </RawStudioProvider>
  );
}
