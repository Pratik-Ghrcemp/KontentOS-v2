import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, RefreshCw, CheckCircle, Copy, Upload, FileVideo, Music2,
  Sparkles, Type, Trash2, Zap, Hash, RotateCcw, SlidersHorizontal, Plus, Search, Scissors, X, Layers, Pencil, Paintbrush
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { HookInspectorCard } from './HookInspectorCard';
import { AiIntelligencePanel } from './AiIntelligencePanel';
import { StoryboardDeck } from './StoryboardDeck';
import { GenerativeAudioDeck } from './GenerativeAudioDeck';
import { VisualDeck } from './VisualDeck';
import { PublishingDeck } from './PublishingDeck';
import { platformPresets } from '@/lib/rendering/presets';
import { formatTime, isPlayablePath } from './utils';
import { mockMusic, mockGraphicElements } from './mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTimelineItemFromAsset } from '@/lib/editing/factory';
import { createTextTimelineItem, createCaptionTimelineItems } from '@/lib/editing/text-factory';
import { DEFAULT_BRAND_KITS } from '@/lib/editing/brand-kit';
import { filterAssets } from '@/lib/editing/assets/filter';
import { resolveTextContent } from '@/lib/editing/canonical';
import { deleteMediaAsset, updateMediaAssetTitle } from '@/lib/data/media-service';
import { STRUCTURAL_TEMPLATES, saveCustomTemplate, getCustomTemplates, deleteCustomTemplate, CustomTemplate } from '@/lib/editing/templates';
import { 
  detectSilenceIntervals, 
  extractPeaksFromAudioBuffer, 
  generateSilenceCutPlan, 
  SilenceRemovalEditPlan,
  generateFallbackPeaks
} from '@/lib/editing/audio';
import { detectFillerWords, FillerWordInterval } from '@/lib/editing/speech/filler-words';
import { getWhisperInstallationStatusClient, transcribeMedia } from '@/lib/ai/ai-service';


const CINEMATIC_LUTS = [
  { id: 'studio_enhance', name: '⚡ 4K Studio Clarity', category: 'Auto-Enhance', color: '#0ea5e9' },
  { id: 'kodak_portra', name: 'Kodak Portra 400', category: 'Warm Skin Tones', color: '#f59e0b' },
  { id: 'teal_orange', name: 'Hollywood Teal & Orange', category: 'Blockbuster', color: '#0284c7' },
  { id: 'cinematic_moody', name: 'Netflix Moody Drama', category: 'Cinematic', color: '#475569' },
  { id: 'studio_commercial', name: 'Apple Commercial', category: 'High-Key', color: '#ffffff' },
  { id: 'sunset_golden', name: 'Golden Hour Magic', category: 'Warm Glow', color: '#fbbf24' },
  { id: 'fuji_velvia', name: 'Vibrant Pop', category: 'Color Vivid', color: '#ef4444' },
  { id: 'vintage_90s', name: 'Vintage 35mm Clean', category: 'Retro Film', color: '#d97706' },
  { id: 'warm_earth', name: 'Sahara Sun-Baked', category: 'Warm Linen', color: '#c2652a' },
  { id: 'noir_classic', name: 'Dramatic Noir B&W', category: 'Monochrome', color: '#000000' },
  { id: 'none', name: 'Raw / Natural Unfiltered', category: 'Original', color: '#64748b' }
];

function SmartCutPanel() {
  const { editState, dispatch, showToast, seekTo, activeAsset, assets } = useRawStudio();
  const [activeTab, setActiveTab] = useState<'silence' | 'filler'>('silence');
  const [amplitudeThreshold, setAmplitudeThreshold] = useState(0.02);
  const [minSilenceDuration, setMinSilenceDuration] = useState(0.4);
  const [paddingDuration, setPaddingDuration] = useState(0.05);
  const [fillerLanguage, setFillerLanguage] = useState<'auto' | 'en' | 'hi'>('auto');
  
  const [detectedSilences, setDetectedSilences] = useState<Array<{ id: string; start: number; end: number; duration: number; enabled: boolean }>>([]);
  const [detectedFillers, setDetectedFillers] = useState<Array<{ id: string; word: string; start: number; end: number; duration: number; enabled: boolean }>>([]);
  const [isScanning, setIsScanning] = useState(false);

  const videoClips = useMemo(() => editState.items.filter(i => i.type === 'video'), [editState.items]);
  const primaryClip = videoClips[0];
  const captions = useMemo(() => editState.items.filter(i => i.type === 'caption'), [editState.items]);

  // Scan Silences & Dead Air using real decoded audio
  const handleScanSilences = async () => {
    if (!primaryClip) {
      showToast('Add a video to the timeline first');
      return;
    }
    setIsScanning(true);
    try {
      const clipDuration = primaryClip.end - primaryClip.start;
      let peaks: number[] = [];
      let mediaSource: Blob | File | null = null;
      let mediaUrl = (primaryClip as any).sourceUrl || (primaryClip.properties as any)?.sourceUrl || '';

      const asset = activeAsset || assets.find(a => a.id === primaryClip.id || a.previewUrl === mediaUrl);
      if (asset) {
        mediaSource = (asset as any).file || (asset as any).blob || null;
        if (!mediaSource && asset.previewUrl && asset.previewUrl.startsWith('blob:')) {
          try {
            mediaSource = await fetch(asset.previewUrl).then(r => r.blob());
          } catch (e) {}
        }
        if (!mediaSource) {
          try {
            const { getMediaBlob } = await import('@/lib/data/indexed-db-media');
            const stored = await getMediaBlob(asset.id);
            if (stored) mediaSource = stored;
          } catch (e) {}
        }
        if (!mediaUrl && asset.previewUrl) {
          mediaUrl = asset.previewUrl;
        }
      }

      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
          let arrayBuffer: ArrayBuffer | null = null;
          if (mediaSource) {
            arrayBuffer = await mediaSource.arrayBuffer();
          } else if (mediaUrl) {
            const res = await fetch(mediaUrl);
            arrayBuffer = await res.arrayBuffer();
          }

          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const numSamples = Math.max(200, Math.round(clipDuration * 50));
            const waveform = extractPeaksFromAudioBuffer(audioBuffer, numSamples);
            peaks = waveform.peaks;
          }
        } catch (audioErr: any) {
          console.warn('Web Audio decoding failed for clip, checking fallback:', audioErr);
        }
      }

      if (peaks.length === 0) {
        showToast('No extractable audio stream found in media file.');
        setDetectedSilences([]);
        return;
      }

      const intervals = detectSilenceIntervals(
        { peaks, duration: clipDuration, sampleRate: 44100 },
        { amplitudeThreshold, minSilenceDuration, paddingDuration }
      );

      if (intervals.length === 0) {
        showToast(`No silence pauses found above ${minSilenceDuration}s threshold. Try adjusting threshold.`);
        setDetectedSilences([]);
        return;
      }

      const items = intervals.map(int => ({
        id: int.id,
        start: Number((primaryClip.start + int.start).toFixed(2)),
        end: Number((primaryClip.start + int.end).toFixed(2)),
        duration: int.duration,
        enabled: true
      }));

      setDetectedSilences(items);
      showToast(`Found ${items.length} silent pause regions!`);
    } catch (e: any) {
      showToast('Silence detection failed: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Scan Filler Words
  const handleScanFillers = () => {
    if (captions.length === 0) {
      showToast('Generate captions first to scan filler words');
      return;
    }
    setIsScanning(true);
    try {
      const languages: ('en' | 'hi' | 'hinglish')[] = 
        fillerLanguage === 'hi' ? ['hi', 'hinglish'] : fillerLanguage === 'en' ? ['en'] : ['en', 'hi', 'hinglish'];
      
      const found = detectFillerWords(
        captions.map(c => ({ id: c.id, start_time: c.start, end_time: c.end, text: c.label || '' })),
        { languages }
      );

      const items = found.map(f => ({
        id: f.id,
        word: f.word,
        start: f.start,
        end: f.end,
        duration: f.duration,
        enabled: true
      }));

      setDetectedFillers(items);
      showToast(`Found ${items.length} filler words`);
    } catch (e: any) {
      showToast('Filler scan failed: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  const totalTimeSaved = useMemo(() => {
    const sTime = detectedSilences.filter(s => s.enabled).reduce((sum, s) => sum + s.duration, 0);
    const fTime = detectedFillers.filter(f => f.enabled).reduce((sum, f) => sum + f.duration, 0);
    return Number((sTime + fTime).toFixed(2));
  }, [detectedSilences, detectedFillers]);

  const activeCutCount = useMemo(() => {
    return detectedSilences.filter(s => s.enabled).length + detectedFillers.filter(f => f.enabled).length;
  }, [detectedSilences, detectedFillers]);

  // Apply Cuts Atomically to Timeline
  const handleApplySmartCuts = () => {
    if (!primaryClip) {
      showToast('No clip selected to apply cuts');
      return;
    }

    const allCuts = [
      ...detectedSilences.filter(s => s.enabled).map(s => ({ id: s.id, start: s.start, end: s.end, duration: s.duration })),
      ...detectedFillers.filter(f => f.enabled).map(f => ({ id: f.id, start: f.start, end: f.end, duration: f.duration }))
    ];

    if (allCuts.length === 0) {
      showToast('No cuts selected');
      return;
    }

    // Sort cuts chronologically
    allCuts.sort((a, b) => a.start - b.start);

    const plan = generateSilenceCutPlan(allCuts as any, editState, { targetClipId: primaryClip.id });
    dispatch({ type: 'APPLY_SILENCE_CUT_PLAN', payload: plan });

    setDetectedSilences([]);
    setDetectedFillers([]);
    showToast(`⚡ Applied ${allCuts.length} cuts! Saved ${plan.totalTimeSaved.toFixed(1)}s`);
  };

  return (
    <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={20} color="var(--accent-primary)" /> Smart Editing AI
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Automatically detect and ripple-cut silent pauses and filler words without losing speech clarity.
        </p>
      </div>

      {/* Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-low)', padding: '4px', borderRadius: '8px', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('silence')}
          style={{
            flex: 1, padding: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer',
            background: activeTab === 'silence' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'silence' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          🔇 Pauses & Silence
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('filler')}
          style={{
            flex: 1, padding: '6px', fontSize: '0.8rem', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer',
            background: activeTab === 'filler' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'filler' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          🗣️ Filler Words
        </button>
      </div>

      {activeTab === 'silence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>Min Pause Duration</span>
              <span style={{ fontWeight: 600 }}>{minSilenceDuration}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.1"
              value={minSilenceDuration}
              onChange={e => setMinSilenceDuration(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>Speech Safety Padding</span>
              <span style={{ fontWeight: 600 }}>{(paddingDuration * 1000).toFixed(0)}ms</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.1"
              step="0.01"
              value={paddingDuration}
              onChange={e => setPaddingDuration(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button
            className="btn btn-primary"
            disabled={isScanning || !primaryClip}
            onClick={handleScanSilences}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            {isScanning ? 'Scanning Audio Waves...' : '🔍 Scan Dead Air & Pauses'}
          </button>

          {/* Silence List */}
          {detectedSilences.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Detected Pauses ({detectedSilences.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const allOn = detectedSilences.every(s => s.enabled);
                    setDetectedSilences(prev => prev.map(s => ({ ...s, enabled: !allOn })));
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Toggle All
                </button>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {detectedSilences.map(silence => (
                  <div
                    key={silence.id}
                    onClick={() => seekTo(silence.start)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '0.8rem'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={silence.enabled}
                        onChange={e => {
                          e.stopPropagation();
                          setDetectedSilences(prev => prev.map(s => s.id === silence.id ? { ...s, enabled: e.target.checked } : s));
                        }}
                      />
                      <span>[{silence.start}s – {silence.end}s]</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>-{silence.duration}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'filler' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Spoken Language Dictionary</label>
            <select
              value={fillerLanguage}
              onChange={e => setFillerLanguage(e.target.value as any)}
              className="select-input"
              style={{ width: '100%', padding: '6px', fontSize: '0.8rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
            >
              <option value="auto">Auto Detect (English + Hindi/Hinglish)</option>
              <option value="en">English (um, uh, like, basically...)</option>
              <option value="hi">Hindi (मतलब, तो फिर, अह...)</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            disabled={isScanning || captions.length === 0}
            onClick={handleScanFillers}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
          >
            {isScanning ? 'Scanning Transcript...' : '🗣️ Scan Filler Words'}
          </button>

          {/* Filler List */}
          {detectedFillers.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>Detected Fillers ({detectedFillers.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const allOn = detectedFillers.every(f => f.enabled);
                    setDetectedFillers(prev => prev.map(f => ({ ...f, enabled: !allOn })));
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Toggle All
                </button>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {detectedFillers.map(filler => (
                  <div
                    key={filler.id}
                    onClick={() => seekTo(filler.start)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: '6px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '0.8rem'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={filler.enabled}
                        onChange={e => {
                          e.stopPropagation();
                          setDetectedFillers(prev => prev.map(f => f.id === filler.id ? { ...f, enabled: e.target.checked } : f));
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>"{filler.word}"</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>at {filler.start}s</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600 }}>-{filler.duration}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary & Apply */}
      {activeCutCount > 0 && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(14, 165, 233, 0.08)', borderRadius: '8px', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>⚡ Total Selected Cuts:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{activeCutCount} cuts</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Estimated Time Saved:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>~{totalTimeSaved}s</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleApplySmartCuts}
            style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            ✂️ Apply Smart Cuts to Timeline
          </button>
        </div>
      )}
    </div>
  );
}

export function RawStudioInspector() {

  const handleAddText = (type: string) => {
    const textItem = createTextTimelineItem(
      type === 'title' ? 'title' : type === 'lower_third' ? 'lower_third' : 'standard',
      { startTime: currentTime }
    );
    dispatch({ type: 'ADD_ITEM', payload: textItem });
    selectSingle(textItem.id);
    showToast(`${type === 'title' ? 'Title' : 'Lower Third'} added to timeline`);
  };

  const {
    dispatch,
    editState,
    exportModal,
    activeTool,
    activeJob,
    platformPreset,
    setPlatformPreset,
    captionStyle,
    setCaptionStyle,
    socialCaption,
    setSocialCaption,
    showToast,
    handleExport,
    activeAsset,
    exportHistory,
    projectTitle,
    setActiveJob,
    setExportModal,
    fileInputRef,
    handleFilesAdded,
    assets,
    setAssets,
    setActiveAsset,
    handleGenerateCaptions,
    aiLoading,
    updateCaption,
    deleteCaption,
    duplicateCaption,
    applyRewrite,
    addCaption,
    seekTo,
    activeCaption,
    loadHooks,
    suggestedHooks,
    setDuration,
    currentTime,
    duration,
    loadHashtags,
    suggestedHashtags,
    loadRepurpose,
    repurposeIdeas,
    aiHistory,
    activeEffects,
    toggleEffect,
    audioSettings,
    setAudioSettings,
    selectedBgmId,
    setSelectedBgmId,
    selectedClipId,
    selectSingle,
    brandKit,
    setBrandKit,
    selectedLutId,
    setSelectedLutId,
    setProjectTitle,
    timelineDuration,
    drawColor,
    setDrawColor,
    drawWidth,
    setDrawWidth,
    resetDemo
  } = useRawStudio();

  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [elementsTab, setElementsTab] = useState<'visual' | 'stickers' | 'presets' | 'templates'>('visual');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAssetTitle, setEditingAssetTitle] = useState('');
  const [deletingAsset, setDeletingAsset] = useState<any | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [whisperDiag, setWhisperDiag] = useState<any>(null);
  const [captionLanguage, setCaptionLanguage] = useState<'auto' | 'en' | 'hi'>('auto');
  const [transcriptionStage, setTranscriptionStage] = useState<'idle' | 'preparing' | 'extracting' | 'transcribing' | 'synchronizing'>('idle');
  const transcriptionAbortRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    getWhisperInstallationStatusClient().then(res => {
      if (res && res.success) {
        setWhisperDiag(res);
      }
    }).catch(() => {});
  }, [activeTool]);

  const filteredAssets = useMemo(() => {
    return filterAssets(assets, { query: assetSearchQuery, type: assetTypeFilter });
  }, [assets, assetSearchQuery, assetTypeFilter]);

  const [silenceState, setSilenceState] = useState<{
    status: 'idle' | 'analyzing' | 'plan_ready' | 'error';
    threshold: number;
    minDuration: number;
    padding: number;
    targetClipId: string | null;
    plan: SilenceRemovalEditPlan | null;
    errorMessage?: string;
  }>({
    status: 'idle',
    threshold: 0.02,
    minDuration: 0.4,
    padding: 0.08,
    targetClipId: null,
    plan: null
  });

  useEffect(() => {
    if (silenceState.targetClipId && (!editState.selection.includes(silenceState.targetClipId) && selectedClipId !== silenceState.targetClipId)) {
      setSilenceState(s => ({ ...s, status: 'idle', targetClipId: null, plan: null }));
    }
  }, [editState.selection, selectedClipId, silenceState.targetClipId]);

  const handleAnalyzeSilence = async () => {
    const targetId = editState.selection[0] || selectedClipId;
    const targetClip = editState.items.find(i => i.id === targetId);

    if (!targetClip || (targetClip.type !== 'video' && targetClip.type !== 'audio')) {
      showToast('Please select 1 video or audio clip to remove silence.');
      return;
    }

    setSilenceState(s => ({ ...s, status: 'analyzing', targetClipId: targetClip.id, errorMessage: undefined }));

    try {
      const asset = assets.find((a: any) => a.id === targetClip.assetId);
      const mediaUrl = asset?.previewUrl || (isPlayablePath(asset?.storage_path) ? asset?.storage_path : '');

      let peaks: number[] = [];
      let durationSec = targetClip.end - targetClip.start;

      if (mediaUrl && typeof window !== 'undefined' && window.AudioContext) {
        try {
          const response = await fetch(mediaUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const waveform = extractPeaksFromAudioBuffer(audioBuffer, 100);
          peaks = waveform.peaks;
          durationSec = waveform.duration;
        } catch {
          peaks = generateFallbackPeaks(100);
        }
      } else {
        peaks = generateFallbackPeaks(100);
      }

      const silenceIntervals = detectSilenceIntervals(
        { peaks, sampleRate: 44100, duration: durationSec },
        { amplitudeThreshold: silenceState.threshold, minSilenceDuration: silenceState.minDuration, paddingDuration: silenceState.padding }
      );

      if (silenceIntervals.length === 0) {
        setSilenceState(s => ({ ...s, status: 'idle' }));
        showToast('No silence gaps detected at current threshold.');
        return;
      }

      const generatedPlan = generateSilenceCutPlan(silenceIntervals, editState, { primaryTrackId: targetClip.trackId, targetClipId: targetClip.id });
      setSilenceState(s => ({ ...s, status: 'plan_ready', plan: generatedPlan }));
    } catch (err: any) {
      setSilenceState(s => ({ ...s, status: 'error', errorMessage: err?.message || 'Failed to analyze silence' }));
      showToast('Silence analysis failed safely.');
    }
  };

  if (exportModal) {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ height: '100%' }}>
        {!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled' ? (
          <>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>Export Options</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {Object.values(platformPresets).map(preset => (
                <div key={preset.id} 
                     onClick={() => setPlatformPreset(preset.id)}
                     style={{ padding: '0.75rem', background: platformPreset === preset.id ? 'rgba(123,97,255,0.1)' : 'var(--bg-surface-low)', borderRadius: '8px', border: platformPreset === preset.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{preset.label}</span>
                    <span className="badge badge-purple">{preset.width}x{preset.height}</span>
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>{preset.aspectRatio} • Up to {preset.maxDurationSeconds}s</small>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <label className="studio-field">
                Quality
                <select className="form-select">
                  <option>High (4K, 60fps)</option>
                  <option>Standard (1080p, 30fps)</option>
                </select>
              </label>
              <label className="studio-field">
                Captions
                <select className="form-select" value={captionStyle.burnIn ? 'burn' : 'sidecar'} onChange={e => setCaptionStyle(s => ({...s, burnIn: e.target.value === 'burn'}))}>
                  <option value="burn">Burned-in</option>
                  <option value="sidecar">Sidecar (.srt)</option>
                  <option value="off">Off</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Social Post Caption</h4>
              <textarea 
                className="form-input" 
                rows={4} 
                value={socialCaption} 
                onChange={e => setSocialCaption(e.target.value)} 
                placeholder="Generate or write your social caption here..."
                style={{ width: '100%', resize: 'vertical' }}
              />
              <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => { navigator.clipboard.writeText(socialCaption); showToast('Caption copied!'); }}>Copy Post Caption</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={handleExport} disabled={!activeAsset && assets.length === 0 && !editState.items.some(i => i.type === 'video')}>
              <Download size={20} style={{ marginRight: '8px' }} /> Start Export
            </button>
            
            {exportHistory.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Recent Exports</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {exportHistory.map(job => (
                     <div key={job.id} style={{ background: 'var(--bg-surface-low)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.request_json.projectTitle}.mp4</span>
                         <span style={{ color: job.status === 'completed' ? 'var(--accent-green)' : job.status === 'failed' ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{job.status}</span>
                       </div>
                       <div style={{ color: 'var(--text-muted)' }}>{platformPresets[job.request_json.platformPresetId]?.label || 'Custom'} • {new Date(job.created_at).toLocaleDateString()}</div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', textAlign: 'center' }}>
            {activeJob?.status === 'processing' || activeJob?.status === 'queued' ? (
              <>
                <RefreshCw size={48} className="animate-spin" color="var(--accent-primary)" />
                <h3>Rendering Video...</h3>
                <div style={{ width: '100%', background: 'var(--bg-surface-low)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${(activeJob?.progress || 0)}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.2s' }} />
                </div>
                <p className="studio-muted">{(activeJob?.progress || 0)}% Complete</p>
              </>
            ) : (
              <>
                <CheckCircle size={56} color="var(--accent-green)" />
                <h3>Export Ready!</h3>
                <div style={{ background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '8px', width: '100%', textAlign: 'left', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{color: 'var(--text-muted)'}}>File:</span> <span>{projectTitle}.mp4</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{color: 'var(--text-muted)'}}>Platform:</span> <span>{platformPresets[activeJob?.request_json.platformPresetId || 'instagram-reels']?.label}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{color: 'var(--text-muted)'}}>Size:</span> <span>~45 MB</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Captions:</span> <span>{captionStyle.burnIn ? 'Burned In' : 'Sidecar'}</span></div>
                </div>
                {activeJob?.result_json?.fileUrl ? (
                  <a
                    href={activeJob.result_json.fileUrl}
                    download={`${projectTitle || 'render'}.mp4`}
                    className="btn btn-primary"
                    style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Download size={16}/> Download MP4
                  </a>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => showToast('Downloading MP4...')}><Download size={16}/> Download MP4</button>
                )}
                {activeJob?.result_json?.srtUrl ? (
                  <a
                    href={activeJob.result_json.srtUrl}
                    download={`${projectTitle || 'captions'}.srt`}
                    className="btn btn-secondary"
                    style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Copy size={16}/> Download SRT Subtitles
                  </a>
                ) : (
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { navigator.clipboard?.writeText?.('1\n00:00:00,000 --> 00:00:03,000\nSample Subtitle'); showToast('Captions copied to clipboard'); }}><Copy size={16}/> Copy SRT Subtitles</button>
                )}
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setActiveJob(null); setExportModal(false); }}>Close</button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  if (editState.selection.length > 1) {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '1rem' }}>
          Group Selection ({editState.selection.length} Items)
        </h4>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            <SlidersHorizontal size={18} />
            Multiple Items Selected
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Drag on canvas to move all {editState.selection.length} selected items together while preserving relative layout, or use Arrow keys to nudge the group.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {editState.selection.map(id => {
              const item = editState.items.find(i => i.id === id);
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item?.label || item?.content || id}</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{item?.type || 'item'}</span>
                </div>
              );
            })}
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => dispatch({ type: 'SET_SELECTION', payload: [] })}>
            Deselect All
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'select' && selectedClipId) {
    const selectedItem = editState.items.find(item => item.id === selectedClipId);
    const itemType = selectedItem?.type || (
      selectedClipId.startsWith('clip-') ? 'video' :
      selectedClipId.startsWith('txt-') ? 'text' :
      selectedClipId.startsWith('cap-') ? 'caption' : 'audio'
    );

    const isVideo = itemType === 'video';
    const isText = itemType === 'text';
    const isCaption = itemType === 'caption';
    const isAudio = itemType === 'audio';

    const updateSelectedProperties = (properties: Record<string, any>, isTransient = false) => {
      if (!selectedClipId) return;
      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: { id: selectedClipId, properties },
        meta: { isTransient }
      });
    };

    const props = selectedItem?.properties || {};
    const opacityVal = props.opacity ?? 100;
    const scaleVal = props.scale ?? 100;
    const volumeVal = props.volume ?? 100;
    const fontSizeVal = props.fontSize ?? 32;
    const colorVal = props.color || '#ffffff';

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '1rem' }}>
          {isVideo ? 'Video Properties' : isText ? 'Text Properties' : isCaption ? 'Caption Properties' : 'Audio Properties'}
        </h4>
        
        <div className="card hover-border" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', background: 'var(--bg-surface-low)' }}>
          {isVideo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Opacity ({opacityVal}%)</span>
                 <input
                   type="range"
                   min="0"
                   max="100"
                   value={opacityVal}
                   onChange={(e) => updateSelectedProperties({ opacity: Number(e.target.value) }, true)}
                   onPointerUp={(e) => updateSelectedProperties({ opacity: Number((e.target as HTMLInputElement).value) }, false)}
                   style={{ width: '55%' }}
                 />
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Scale ({scaleVal}%)</span>
                 <input
                   type="range"
                   min="10"
                   max="200"
                   value={scaleVal}
                   onChange={(e) => updateSelectedProperties({ scale: Number(e.target.value) }, true)}
                   onPointerUp={(e) => updateSelectedProperties({ scale: Number((e.target as HTMLInputElement).value) }, false)}
                   style={{ width: '55%' }}
                 />
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Volume ({volumeVal}%)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeVal}
                    onChange={(e) => updateSelectedProperties({ volume: Number(e.target.value) }, true)}
                    onPointerUp={(e) => updateSelectedProperties({ volume: Number((e.target as HTMLInputElement).value) }, false)}
                    style={{ width: '55%' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Speed ({selectedItem?.properties?.speed ?? 1.0}x)</span>
                  <input
                    type="range"
                    min="0.25"
                    max="4.0"
                    step="0.25"
                    value={selectedItem?.properties?.speed ?? 1.0}
                    onChange={(e) => updateSelectedProperties({ speed: Number(e.target.value) }, true)}
                    onPointerUp={(e) => updateSelectedProperties({ speed: Number((e.target as HTMLInputElement).value) }, false)}
                    style={{ width: '55%' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Reverse Playback</span>
                  <button 
                    className={`btn ${selectedItem?.properties?.reversed ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.2rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => updateSelectedProperties({ reversed: !selectedItem?.properties?.reversed }, false)}
                  >
                    {selectedItem?.properties?.reversed ? 'Reversed ON' : 'Normal'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Transition In</span>
                  <select 
                    className="form-select" 
                    style={{ width: '55%', fontSize: '0.8rem' }}
                    value={selectedItem?.properties?.transitionIn?.type || 'none'}
                    onChange={(e) => {
                      const type = e.target.value;
                      if (type === 'none') {
                        updateSelectedProperties({ transitionIn: undefined }, false);
                      } else {
                        updateSelectedProperties({ transitionIn: { type, duration: selectedItem?.properties?.transitionIn?.duration ?? 0.5 } }, false);
                      }
                    }}
                  >
                    <option value="none">None</option>
                    <option value="crossfade">Crossfade (0.5s)</option>
                    <option value="dissolve">Dissolve (0.5s)</option>
                    <option value="fade_black">Fade from Black (0.5s)</option>
                  </select>
                </div>
             </div>
          )}
          {isText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Font Size ({fontSizeVal}px)</span>
                 <input
                   type="range"
                   min="12"
                   max="96"
                   step="1"
                   value={fontSizeVal}
                   onChange={(e) => updateSelectedProperties({ fontSize: Number(e.target.value) }, true)}
                   onPointerUp={(e) => updateSelectedProperties({ fontSize: Number((e.target as HTMLInputElement).value) }, false)}
                   style={{ width: '55%' }}
                 />
               </div>
               <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Color:</span>
                 {['#ffffff', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'].map(c => (
                   <div
                     key={c}
                     onClick={() => updateSelectedProperties({ color: c }, false)}
                     style={{
                       width: '24px',
                       height: '24px',
                       borderRadius: '50%',
                       background: c,
                       cursor: 'pointer',
                       border: colorVal === c ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                       boxShadow: colorVal === c ? '0 0 8px var(--accent-primary-glow)' : 'none',
                       transition: 'transform 0.15s, border 0.15s'
                     }}
                     className="hover-scale"
                   />
                 ))}
               </div>
            </div>
          )}
          {(isCaption || isAudio) && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Use the dedicated tool panels to edit this track type in bulk.
            </div>
          )}
        </div>
        
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
          Press Backspace or Delete to remove this clip. Click empty space in the timeline to deselect.
        </p>
      </div>
    );
  }

  if (activeTool === 'upload') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <div 
          style={{ border: '2px dashed var(--accent-primary)', borderRadius: '12px', padding: '2.5rem 1rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface-low)', transition: 'all 0.2s' }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length) {
              handleFilesAdded(event.dataTransfer.files);
            }
          }}
          className="hover-bg-high"
          
        >
          <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Upload size={24} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>Click or drag to upload</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports MP4, MOV, M4V, WebM, MKV</div>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', margin: 0 }}>Project Media ({filteredAssets.length})</h4>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search assets..."
              value={assetSearchQuery}
              onChange={(e) => setAssetSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px', borderRadius: '6px' }}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem' }}>
            {(['all', 'video', 'audio', 'image'] as const).map(type => (
              <button
                key={type}
                className={`btn ${assetTypeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.75rem', textTransform: 'capitalize', flex: 1 }}
                onClick={() => setAssetTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Delete Confirmation Modal */}
        {deletingAsset && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '380px',
              width: '90%',
              boxShadow: 'var(--shadow-neo-raised-lg)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Delete Asset?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Are you sure you want to delete <strong>{deletingAsset.title || deletingAsset.fileName || 'this asset'}</strong>?
                {(() => {
                  const clipCount = editState.items.filter(i => 
                    i.assetId === deletingAsset.id || 
                    i.properties?.sourcePath === deletingAsset.storage_path ||
                    i.id.includes(deletingAsset.id)
                  ).length;
                  return clipCount > 0 
                    ? ` This asset is used by ${clipCount} timeline clip(s). Deleting it will also remove those clips.`
                    : ' This action cannot be undone.';
                })()}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setDeletingAsset(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'var(--accent-rose)', color: '#fff', border: 'none', fontWeight: 600 }}
                  onClick={async () => {
                    const target = deletingAsset;
                    const clips = editState.items.filter(i => 
                      i.assetId === target.id || 
                      i.properties?.sourcePath === target.storage_path ||
                      i.id.includes(target.id)
                    );
                    clips.forEach(c => dispatch({ type: 'DELETE_ITEM', payload: { id: c.id } }));
                    if (activeAsset?.id === target.id) setActiveAsset(null);
                    await deleteMediaAsset(target.id, target._raw_path);
                    setAssets(prev => prev.filter(a => a.id !== target.id));
                    setDeletingAsset(null);
                    showToast(`Deleted asset${clips.length > 0 ? ` and removed ${clips.length} clip(s)` : ''}`);
                  }}
                >
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="studio-asset-list">
          {filteredAssets.length === 0 && <div className="studio-empty" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No matching assets found.</div>}
          {filteredAssets.map((asset) => {
            const isEditing = editingAssetId === asset.id;
            const assetName = (asset as any).title || asset.fileName || (asset as any).file_name || asset.projects?.title || 'Media';
            return (
              <div
                key={asset.id}
                className={`studio-asset-row ${activeAsset?.id === asset.id ? 'active' : ''}`}
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.75rem', background: activeAsset?.id === asset.id ? 'var(--bg-surface-high)' : 'var(--bg-surface-low)', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => setActiveAsset(asset)}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(asset))}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '4px', flex: 1 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingAssetTitle}
                        onChange={e => setEditingAssetTitle(e.target.value)}
                        autoFocus
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            const trimmed = editingAssetTitle.trim();
                            if (trimmed) {
                              await updateMediaAssetTitle(asset.id, trimmed);
                              setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: trimmed, fileName: trimmed, file_name: trimmed, projects: a.projects ? { ...a.projects, title: trimmed } : undefined } : a));
                              showToast('Renamed asset');
                            }
                            setEditingAssetId(null);
                          } else if (e.key === 'Escape') {
                            setEditingAssetId(null);
                          }
                        }}
                        style={{ flex: 1, padding: '2px 6px', fontSize: '0.85rem', background: 'var(--bg-surface-lowest)', border: '1px solid var(--accent-primary)', borderRadius: '4px', color: 'var(--text-main)' }}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={async () => {
                          const trimmed = editingAssetTitle.trim();
                          if (trimmed) {
                            await updateMediaAssetTitle(asset.id, trimmed);
                            setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, title: trimmed, fileName: trimmed, file_name: trimmed, projects: a.projects ? { ...a.projects, title: trimmed } : undefined } : a));
                            showToast('Renamed asset');
                          }
                          setEditingAssetId(null);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {assetName}
                      </span>
                      <button
                        aria-label="Rename asset"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAssetId(asset.id);
                          setEditingAssetTitle(assetName);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                  {asset.asset_type === 'audio' ? <Music2 size={14} color="var(--text-muted)"/> : <FileVideo size={14} color="var(--text-muted)"/>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(Number(asset.duration_seconds) || 0)}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const newClip = createTimelineItemFromAsset(asset, { startTime: currentTime });
                        dispatch({ type: 'ADD_ITEM', payload: newClip });
                        selectSingle(newClip.id);
                        setDuration(Math.max(duration, newClip.end));
                        showToast('Added asset to timeline'); 
                      }}
                    >
                      + Add
                    </button>
                    <button
                      aria-label="Delete asset"
                      className="btn btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingAsset(asset);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTool === 'smart-cut') {
    return <SmartCutPanel />;
  }

  if (activeTool === 'hooks') {
    return <HookInspectorCard />;
  }

  if (activeTool === 'suggestions') {
    return <AiIntelligencePanel />;
  }

  if (activeTool === 'storyboard') {
    return <StoryboardDeck />;
  }

  if (activeTool === 'captions') {
    const captionItems = editState.items.filter(i => i.type === 'caption');

    const handleApplyCaptionPreset = (presetKey: 'hormozi' | 'neon' | 'minimal' | 'boxed') => {
      setCaptionStyle(prev => ({ ...prev, preset: presetKey }));
      captionItems.forEach(cap => {
        let newColor = '#ffffff';
        let newBg = '#000000';
        let newBgOpacity = 0.7;
        let newFontSize = 38;

        if (presetKey === 'hormozi') {
          newColor = '#facc15';
          newBgOpacity = 0.85;
          newFontSize = 48;
        } else if (presetKey === 'neon') {
          newColor = '#06b6d4';
          newBg = '#06b6d4';
          newBgOpacity = 0.3;
          newFontSize = 44;
        } else if (presetKey === 'minimal') {
          newColor = '#ffffff';
          newBgOpacity = 0;
          newFontSize = 32;
        }

        dispatch({
          type: 'UPDATE_PROPERTIES',
          payload: {
            id: cap.id,
            properties: {
              ...(cap.properties || {}),
              preset: presetKey,
              color: newColor,
              fontSize: newFontSize,
              backgroundColor: newBg,
              backgroundOpacity: newBgOpacity
            }
          }
        });
      });
      showToast(`Applied '${presetKey}' caption style preset`);
    };

    const handleClearAllCaptions = () => {
      captionItems.forEach(c => dispatch({ type: 'DELETE_ITEM', payload: { id: c.id } }));
      showToast('Cleared all captions from timeline');
    };

    const handleAddManualCaption = () => {
      const newItem = createTextTimelineItem('standard', {
        content: 'New Subtitle',
        startTime: currentTime,
        duration: 2.5
      });
      // Override to caption type
      (newItem as any).type = 'caption';
      newItem.trackId = 'track-text-1';
      newItem.label = 'Caption: New Subtitle';
      dispatch({ type: 'ADD_ITEM', payload: newItem });
      selectSingle(newItem.id);
      showToast('Added subtitle block at playhead');
    };

    const handleCancelTranscription = () => {
      if (transcriptionAbortRef.current) {
        transcriptionAbortRef.current.abort();
        transcriptionAbortRef.current = null;
      }
      setTranscriptionStage('idle');
      showToast('Transcription cancelled');
    };

    const handleTriggerCaptions = async () => {
      if (!activeAsset) {
        showToast('Please select an active video asset first');
        return;
      }

      let mediaSource: Blob | File | null = (activeAsset as any).file || (activeAsset as any).blob || null;
      if (!mediaSource && activeAsset.previewUrl && activeAsset.previewUrl.startsWith('blob:')) {
        try {
          mediaSource = await fetch(activeAsset.previewUrl).then(r => r.blob());
        } catch (e) {}
      }
      if (!mediaSource) {
        try {
          const { getMediaBlob } = await import('@/lib/data/indexed-db-media');
          const stored = await getMediaBlob(activeAsset.id);
          if (stored) mediaSource = stored;
        } catch (e) {}
      }

      if (!mediaSource) {
        showToast('Could not load media file for local Whisper transcription');
        return;
      }

      const controller = new AbortController();
      transcriptionAbortRef.current = controller;
      setTranscriptionStage('preparing');

      try {
        await new Promise(r => setTimeout(r, 150));
        setTranscriptionStage('extracting');
        await new Promise(r => setTimeout(r, 200));
        setTranscriptionStage('transcribing');

        const res = await transcribeMedia(
          mediaSource,
          captionLanguage,
          undefined,
          Math.round(timelineDuration || 15),
          controller.signal
        );

        if (controller.signal.aborted) return;

        if (res.error && res.error.includes('cancelled')) {
          showToast('Transcription cancelled');
          return;
        }

        if (res.segments && res.segments.length > 0) {
          setTranscriptionStage('synchronizing');
          // Clear existing captions
          const existing = editState.items.filter(i => i.type === 'caption');
          existing.forEach(c => dispatch({ type: 'DELETE_ITEM', payload: { id: c.id } }));

          const captionItems = createCaptionTimelineItems(res.segments, captionStyle.preset);
          captionItems.forEach(item => dispatch({ type: 'ADD_ITEM', payload: item }));

          if (captionItems.length > 0) {
            selectSingle(captionItems[0].id);
          }
          showToast(`Generated ${captionItems.length} captions synchronized to timeline!`);
        } else {
          showToast(res.error || 'No speech segments detected in media');
        }
      } catch (err: any) {
        if (controller.signal.aborted || err.message?.includes('cancelled')) {
          showToast('Transcription cancelled');
        } else {
          showToast('Transcription failed: ' + (err.message || 'Unknown error'));
        }
      } finally {
        transcriptionAbortRef.current = null;
        setTranscriptionStage('idle');
      }
    };

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1rem', background: 'var(--bg-main)', height: '100%', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Auto Captions</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {captionItems.length > 0 ? `${captionItems.length} synchronized phrases` : 'Speech-to-Text Intelligence'}
            </div>
          </div>
          {captionItems.length > 0 && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px', color: 'var(--accent-rose)' }}
              onClick={handleClearAllCaptions}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Honest Setup Diagnostic Banner */}
        {whisperDiag && (
          <div style={{
            background: whisperDiag.isReady ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${whisperDiag.isReady ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            borderRadius: '10px',
            padding: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', color: whisperDiag.isReady ? '#10b981' : '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
              <span>🎙️ Local Whisper Engine: {whisperDiag.isReady ? 'READY (100% Offline)' : 'Setup Required'}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
              <div>FFmpeg: {whisperDiag.ffmpegInstalled ? '✓ Detected' : '✗ Missing'}</div>
              <div>Whisper Binary: {whisperDiag.whisperBinaryInstalled ? `✓ Detected (${whisperDiag.whisperExecutable})` : '✗ Missing'}</div>
              <div>Model Weights: {whisperDiag.whisperModelInstalled ? `✓ Detected (${whisperDiag.model})` : '✗ Missing'}</div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.75rem', padding: '5px' }}
              onClick={() => {
                getWhisperInstallationStatusClient().then(res => {
                  if (res && res.success) {
                    setWhisperDiag(res);
                    if (res.isReady) showToast('Local Whisper.cpp engine detected & ready!');
                    else showToast('Whisper binary or model missing in folders.');
                  }
                });
              }}
            >
              Check Installation
            </button>
          </div>
        )}

        {/* Spoken Language Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
            SPOKEN LANGUAGE
          </label>
          <select
            className="form-control"
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}
            value={captionLanguage}
            onChange={(e) => setCaptionLanguage(e.target.value as any)}
            title="Auto Detect is recommended for mixed Hindi-English speech."
          >
            <option value="auto">Auto Detect (Recommended for mixed Hindi-English)</option>
            <option value="en">English (en)</option>
            <option value="hi">Hindi (हिन्दी - hi)</option>
          </select>
        </div>

        {/* Multi-Stage Progress vs Primary Action Button */}
        {transcriptionStage !== 'idle' ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} className="animate-spin text-accent" />
              <span>Speech Intelligence in Progress</span>
            </div>
            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '0.75rem' }}>
              <div style={{ color: transcriptionStage === 'preparing' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {transcriptionStage === 'preparing' ? '●' : '✓'} Preparing media buffer
              </div>
              <div style={{ color: transcriptionStage === 'extracting' ? 'var(--accent-primary)' : transcriptionStage === 'transcribing' || transcriptionStage === 'synchronizing' ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                {transcriptionStage === 'extracting' ? '● Extracting 16kHz audio...' : transcriptionStage === 'transcribing' || transcriptionStage === 'synchronizing' ? '✓ Audio extracted' : '○ Extracting 16kHz audio'}
              </div>
              <div style={{ color: transcriptionStage === 'transcribing' ? 'var(--accent-primary)' : transcriptionStage === 'synchronizing' ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                {transcriptionStage === 'transcribing' ? '● AI is transcribing speech... (This may take a moment)' : transcriptionStage === 'synchronizing' ? '✓ Speech transcribed' : '○ AI speech transcription'}
              </div>
              <div style={{ color: transcriptionStage === 'synchronizing' ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {transcriptionStage === 'synchronizing' ? '● Synchronizing timeline captions...' : '○ Synchronizing timeline captions'}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.75rem', padding: '5px', color: 'var(--accent-rose)' }}
              onClick={handleCancelTranscription}
            >
              Cancel Transcription
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)',
              cursor: 'pointer',
              border: 'none'
            }}
            onClick={handleTriggerCaptions}
            disabled={Boolean(aiLoading['captions']) || transcriptionStage !== 'idle'}
          >
            <Sparkles size={16} />
            {captionItems.length > 0 ? 'Regenerate Captions' : 'Auto Generate Captions'}
          </button>
        )}

        {/* Caption Style Presets */}
        <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
          CAPTION STYLE PRESETS
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { key: 'hormozi', name: 'Alex Hormozi', color: '#facc15', desc: 'Yellow + Black Stroke' },
            { key: 'neon', name: 'Neon Glow', color: '#06b6d4', desc: 'Cyan Cyberpunk Glow' },
            { key: 'minimal', name: 'Minimalist', color: '#ffffff', desc: 'Clean Transparent' },
            { key: 'boxed', name: 'Classic Boxed', color: '#ffffff', desc: 'High Contrast Pill' }
          ].map(p => {
            const isSelected = captionStyle.preset === p.key;
            return (
              <div
                key={p.key}
                className="card hover-border"
                style={{
                  padding: '0.65rem',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => handleApplyCaptionPreset(p.key as any)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>{p.name}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Save Style to Brand Kit Button */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '1.25rem' }}
          onClick={() => {
            const activeColor = captionItems[0]?.properties?.color || '#facc15';
            const activePreset = captionItems[0]?.properties?.preset || 'hormozi';
            const activeFont = captionItems[0]?.properties?.fontFamily || 'Inter';
            const activeFontSize = captionItems[0]?.properties?.fontSize || 48;

            setBrandKit((prev: any) => ({
              ...prev,
              captionStyle: {
                preset: activePreset,
                fontFamily: activeFont,
                fontSize: activeFontSize,
                color: activeColor,
                fontColor: activeColor
              }
            }));
            showToast(`Saved '${activePreset}' caption styling to Brand Kit!`);
          }}
        >
          <Paintbrush size={14} /> Save Style to Brand Kit
        </button>

        {/* Interactive Transcript Segments List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: 0 }}>
            TRANSCRIPT PHRASES ({captionItems.length})
          </h4>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '2px 8px' }}
            onClick={handleAddManualCaption}
          >
            + Add Phrase
          </button>
        </div>

        {captionItems.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            No captions on timeline yet. Click "Auto Generate Captions" or "+ Add Phrase" above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
            {captionItems.map((cap) => {
              const isSelected = selectedClipId === cap.id || editState.selection.includes(cap.id);
              const currentContent = resolveTextContent(cap);

              return (
                <div
                  key={cap.id}
                  className="card hover-border"
                  style={{
                    padding: '0.75rem',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-surface)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-neo-raised-sm)'
                  }}
                  onClick={() => selectSingle(cap.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <button
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(cap.start);
                      }}
                      title="Seek playhead to phrase start"
                    >
                      ⏱️ {formatTime(cap.start)} - {formatTime(cap.end)}
                    </button>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'DELETE_ITEM', payload: { id: cap.id } });
                      }}
                      title="Delete phrase"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <textarea
                    value={currentContent}
                    onChange={(e) => {
                      const newText = e.target.value;
                      updateCaption(cap.id, { text: newText });
                      dispatch({
                        type: 'UPDATE_PROPERTIES',
                        payload: {
                          id: cap.id,
                          properties: {
                            ...(cap.properties || {}),
                            content: newText,
                            text: newText
                          }
                        }
                      });
                    }}
                    rows={2}
                    className="form-control"
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      resize: 'none',
                      outline: 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'elements') {
    const magicStyles = [
      {
        id: 'studio_clarity',
        name: '⚡ 4K Studio Clarity',
        tag: 'Clean Pro',
        desc: 'High-key studio clarity, voice isolation & transparent kinetic captions.',
        lut: 'studio_enhance',
        sub: 'kinetic',
        subColor: '#ffffff'
      },
      {
        id: 'hormozi_authority',
        name: '🟡 Alex Hormozi Authority',
        tag: 'High Retention',
        desc: 'Alex Hormozi contrast, yellow highlighter captions & vocal boost.',
        lut: 'studio_commercial',
        sub: 'hormozi',
        subColor: '#fbbf24'
      },
      {
        id: 'abdaal_clean',
        name: '☕ Ali Abdaal Aesthetic',
        tag: 'Warm Golden',
        desc: 'Warm Kodak Portra golden skin tone, clean minimal captions.',
        lut: 'kodak_portra',
        sub: 'minimal',
        subColor: '#38bdf8'
      },
      {
        id: 'netflix_cinema',
        name: '🎬 Netflix Cinematic Story',
        tag: 'Cinema Depth',
        desc: 'Netflix moody drama LUT, subtle shadows & editorial captions.',
        lut: 'cinematic_moody',
        sub: 'minimal',
        subColor: '#ffffff'
      }
    ];

    const applyMagicStyle = (preset: any) => {
      setSelectedLutId(preset.lut);
      setCaptionStyle(s => ({ ...s, preset: preset.sub, color: preset.subColor }));
      showToast(`Applied ${preset.name} preset`);
    };

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        {/* Segmented Sub-Tab Switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', background: 'var(--bg-surface-low)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {(['visual', 'stickers', 'presets', 'templates'] as const).map(tab => (
            <button
              key={tab}
              className={`btn ${elementsTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 8px', fontSize: '0.75rem', textTransform: 'capitalize', flex: 1, fontWeight: elementsTab === tab ? 600 : 400 }}
              onClick={() => setElementsTab(tab)}
            >
              {tab === 'visual' ? '🎨 AI Visuals' : tab === 'stickers' ? '✨ Stickers' : tab === 'presets' ? '⚡ Presets' : '📐 Templates'}
            </button>
          ))}
        </div>

        {elementsTab === 'visual' && (
          <VisualDeck />
        )}

        {elementsTab === 'stickers' && (
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Graphic Elements & Stickers</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {mockGraphicElements.map(el => (
                <div
                  key={el.id}
                  className="card hover-border"
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-low)',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    const newItem = {
                      id: `overlay-${crypto.randomUUID()}`,
                      trackId: 'track-text-1',
                      type: 'overlay' as const,
                      start: currentTime,
                      end: Math.min(timelineDuration > 0 ? timelineDuration : 15, currentTime + 3.0),
                      label: `${el.symbol} ${el.name}`,
                      content: el.symbol,
                      properties: {
                        x: 0,
                        y: 0,
                        scale: 120,
                        opacity: 100,
                        rotation: 0,
                        color: el.color,
                        fontSize: 48,
                        zIndex: 15
                      }
                    };
                    dispatch({ type: 'ADD_ITEM', payload: newItem });
                    selectSingle(newItem.id);
                    showToast(`Added ${el.name} overlay`);
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{el.symbol}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', textAlign: 'center' }}>{el.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {elementsTab === 'presets' && (
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>1-Click Magic Presets</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {magicStyles.map((style) => (
                <div key={style.id} className="card hover-border" style={{ padding: '0.85rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', transition: 'all 0.2s' }} onClick={() => applyMagicStyle(style)} >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{style.name}</span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem', flexShrink: 0 }}>{style.tag}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{style.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {elementsTab === 'templates' && (
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Structural Templates</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              {Object.values(STRUCTURAL_TEMPLATES).map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="card hover-border"
                  style={{ padding: '0.85rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', transition: 'all 0.2s' }}
                  onClick={() => {
                    const totalDur = duration > 0 ? duration : (timelineDuration > 0 ? timelineDuration : 15);
                    const items = tmpl.generateItems(totalDur, 0);
                    items.forEach(item => {
                      dispatch({ type: 'ADD_ITEM', payload: item });
                    });
                    if (items.length > 0) {
                      selectSingle(items[0].id);
                      const maxEnd = Math.max(...items.map(i => i.end));
                      setDuration(Math.max(duration, maxEnd));
                    }
                    showToast(`Applied '${tmpl.name}' (${items.length} layers added to timeline)`);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{tmpl.name}</span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', fontWeight: 600 }}>{tmpl.badge}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{tmpl.description}</div>
                </div>
              ))}
            </div>

            {/* Custom Saved Templates */}
            {getCustomTemplates().length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>My Saved Templates</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {getCustomTemplates().map((ct) => (
                    <div
                      key={ct.id}
                      className="card hover-border"
                      style={{ padding: '0.85rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', transition: 'all 0.2s' }}
                      onClick={() => {
                        ct.items.forEach(item => {
                          const reIdItem = { ...item, id: `${item.type}-${crypto.randomUUID()}` };
                          dispatch({ type: 'ADD_ITEM', payload: reIdItem });
                        });
                        showToast(`Applied custom template '${ct.name}' (${ct.items.length} layers)`);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>{ct.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 600 }}>{ct.badge}</span>
                          <button
                            aria-label="Delete custom template"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomTemplate(ct.id);
                              showToast(`Deleted custom template '${ct.name}'`);
                            }}
                          >
                            <Trash2 size={13} color="var(--accent-rose)" />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{ct.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)', fontWeight: 600 }} 
              onClick={() => {
                const currentItems = editState.items;
                if (currentItems.length === 0) {
                  showToast('Add layers to timeline before saving as template');
                  return;
                }
                const tmplName = projectTitle && projectTitle !== 'Untitled Reel' ? projectTitle : `Template ${new Date().toLocaleDateString()}`;
                saveCustomTemplate(tmplName, currentItems);
                showToast(`Saved '${tmplName}' as reusable template!`);
              }}
            >
              <CheckCircle size={16} /> Save Current Settings as Template
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'text') {
    const textItems = editState.items.filter(i => i.type === 'text');

    const handleAddTitle = () => {
      const newItem = createTextTimelineItem('title', { startTime: currentTime, duration: 4.0 });
      dispatch({ type: 'ADD_ITEM', payload: newItem });
      selectSingle(newItem.id);
      setDuration(Math.max(duration, newItem.end));
      showToast('Added Main Title to timeline');
    };

    const handleAddLowerThird = () => {
      const newItem = createTextTimelineItem('lower_third', { startTime: currentTime, duration: 4.0 });
      dispatch({ type: 'ADD_ITEM', payload: newItem });
      selectSingle(newItem.id);
      setDuration(Math.max(duration, newItem.end));
      showToast('Added Lower Third to timeline');
    };

    const handleAddHook = (hookText: string) => {
      const newItem = createTextTimelineItem('standard', { content: hookText, startTime: currentTime, duration: 4.0 });
      dispatch({ type: 'ADD_ITEM', payload: newItem });
      selectSingle(newItem.id);
      setDuration(Math.max(duration, newItem.end));
      showToast('Added Hook as Text Overlay');
    };

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={handleAddTitle}>+ Add Title</button>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }} onClick={handleAddLowerThird}>+ Lower 3rd</button>
        </div>

        {textItems.length === 0 && (
          <div className="studio-empty" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No text overlays on timeline.</div>
        )}

        {textItems.map((txt) => {
          const textContent = resolveTextContent(txt);
          return (
            <div key={txt.id} style={{ background: 'var(--bg-surface-low)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <input
                value={textContent}
                onChange={e => {
                  dispatch({ type: 'UPDATE_PROPERTIES', payload: { id: txt.id, properties: { text: e.target.value } } });
                }}
                style={{ width: '100%', background: 'var(--bg-surface-lowest)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{formatTime(txt.start)} - {formatTime(txt.end)}</span>
                <button
                  onClick={() => {
                    dispatch({ type: 'DELETE_ITEM', payload: { id: txt.id } });
                    showToast('Deleted text overlay');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                >
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          );
        })}

        {/* AI Hooks Generator */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} /> Hooks</span>
            <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={loadHooks} disabled={aiLoading['hooks']}>{aiLoading['hooks'] ? '...' : 'Generate'}</button>
          </div>
          {suggestedHooks.length === 0 && !aiLoading['hooks'] && <div className="studio-muted" style={{fontSize:'0.8rem'}}>No hooks generated.</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suggestedHooks.map((h, i) => (
              <div key={i} style={{ background: 'var(--bg-surface-low)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid transparent' }} onClick={() => handleAddHook(h)}>
                {h}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTool === 'effects') {
    const handleApplyTransition = (eff: string) => {
      const targetId = editState.selection[0] || selectedClipId;
      const targetItem = editState.items.find(i => i.id === targetId);

      if (!targetItem) {
        showToast('Please select a clip on the timeline to apply transition.');
        return;
      }

      const transitionTypeMap: Record<string, 'fade_black' | 'dissolve' | 'crossfade' | 'none'> = {
        'Cut': 'none',
        'Swipe': 'dissolve',
        'Fade': 'fade_black',
        'Pop': 'crossfade'
      };

      const type = transitionTypeMap[eff] || 'crossfade';
      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: targetItem.id,
          properties: {
            transitionIn: type === 'none' ? undefined : { type, duration: 0.5 }
          }
        }
      });
      showToast(`Applied ${eff} transition to clip`);
    };

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ paddingRight: '4px' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Effect Presets</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          {['Smooth Zoom', 'Auto Crop', 'Blur BG', 'Skin Protect'].map(eff => (
            <button key={eff} className={`btn ${activeEffects.includes(eff) ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => toggleEffect(eff)}>
              {eff}
            </button>
          ))}
        </div>

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Studio LUTs</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {CINEMATIC_LUTS.map(lut => (
            <button key={lut.id} 
                    className={`btn ${selectedLutId === lut.id ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ padding: '0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
                    onClick={() => { setSelectedLutId(lut.id); showToast(`Applied ${lut.name}`); }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: lut.color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{lut.name.replace(/[^a-zA-Z0-9\s]/g, '')}</span>
              {selectedLutId === lut.id && <CheckCircle size={14} style={{ opacity: 0.8 }} />}
            </button>
          ))}
        </div>

        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Transitions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
          {['Cut', 'Swipe', 'Fade', 'Pop'].map(eff => (
            <button key={eff} className="btn btn-secondary" style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => handleApplyTransition(eff)}>{eff}</button>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'visual') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
        <VisualDeck />
      </div>
    );
  }

  if (activeTool === 'audio') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
        <GenerativeAudioDeck />
      </div>
    );
  }

  if (activeTool === 'legacy_audio_controls') {
    const selectedTargetId = editState.selection[0] || selectedClipId;
    const selectedTargetClip = editState.items.find(i => i.id === selectedTargetId && (i.type === 'video' || i.type === 'audio'));

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        {/* Selected Clip Volume & Fades Card */}
        {selectedTargetClip && (
          <div className="card hover-border" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--accent-primary)', boxShadow: 'var(--shadow-neo-raised-sm)', background: 'var(--bg-surface-low)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>Selected Clip Volume ({selectedTargetClip.label || selectedTargetClip.id})</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{selectedTargetClip.properties?.volume ?? 100}%</span>
            </div>
            <input
              aria-label="Clip Volume"
              type="range"
              min="0"
              max="200"
              step="5"
              value={selectedTargetClip.properties?.volume ?? 100}
              onChange={e => {
                dispatch({
                  type: 'UPDATE_PROPERTIES',
                  payload: {
                    id: selectedTargetClip.id,
                    properties: { volume: Number(e.target.value) }
                  }
                });
              }}
              style={{ width: '100%', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audio Fade In ({selectedTargetClip.properties?.fadeInDuration ?? 0}s)</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={selectedTargetClip.properties?.fadeInDuration ?? 0}
                  onChange={e => {
                    dispatch({
                      type: 'UPDATE_PROPERTIES',
                      payload: {
                        id: selectedTargetClip.id,
                        properties: { fadeInDuration: Number(e.target.value) }
                      }
                    });
                  }}
                  style={{ width: '50%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audio Fade Out ({selectedTargetClip.properties?.fadeOutDuration ?? 0}s)</span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={selectedTargetClip.properties?.fadeOutDuration ?? 0}
                  onChange={e => {
                    dispatch({
                      type: 'UPDATE_PROPERTIES',
                      payload: {
                        id: selectedTargetClip.id,
                        properties: { fadeOutDuration: Number(e.target.value) }
                      }
                    });
                  }}
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Keyframe Animation Engine Card */}
        {selectedTargetClip && (
          <div className="card hover-border" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--accent-cyan)', boxShadow: 'var(--shadow-neo-raised-sm)', background: 'var(--bg-surface-low)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1rem' }}>❖</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>Keyframe Animations</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  const clipTime = Number(Math.max(0, currentTime - selectedTargetClip.start).toFixed(2));
                  const keyframe = {
                    id: `kf-${crypto.randomUUID()}`,
                    time: clipTime,
                    properties: {
                      x: selectedTargetClip.properties?.x ?? 0,
                      y: selectedTargetClip.properties?.y ?? 0,
                      scale: selectedTargetClip.properties?.scale ?? 100,
                      opacity: selectedTargetClip.properties?.opacity ?? 100,
                      rotation: selectedTargetClip.properties?.rotation ?? 0
                    }
                  };
                  dispatch({
                    type: 'ADD_KEYFRAME',
                    payload: { itemId: selectedTargetClip.id, keyframe }
                  });
                  showToast(`Added keyframe at t=${clipTime}s`);
                }}
              >
                + Add Keyframe
              </button>
            </div>

            {(!selectedTargetClip.keyframes || selectedTargetClip.keyframes.length === 0) ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No keyframes. Move playhead and click "+ Add Keyframe" to animate scale, position, and opacity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {selectedTargetClip.keyframes.map((kf, idx) => (
                  <div
                    key={kf.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-base)',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => seekTo(selectedTargetClip.start + kf.time)}
                      title="Click to seek playhead to keyframe"
                    >
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>❖ #{idx + 1} ({kf.time}s)</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        x:{kf.properties.x ?? 0} y:{kf.properties.y ?? 0} s:{kf.properties.scale ?? 100}% o:{kf.properties.opacity ?? 100}%
                      </span>
                    </div>
                    <X
                      size={14}
                      style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                      onClick={() => {
                        dispatch({
                          type: 'DELETE_KEYFRAME',
                          payload: { itemId: selectedTargetClip.id, keyframeId: kf.id }
                        });
                        showToast(`Deleted keyframe #${idx + 1}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layer Hierarchy Card */}
        {selectedTargetClip && (
          <div className="card hover-border" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--accent-purple)', boxShadow: 'var(--shadow-neo-raised-sm)', background: 'var(--bg-surface-low)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>Layer Hierarchy</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-purple)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                Z-Index: {selectedTargetClip.properties?.zIndex ?? (selectedTargetClip.type === 'text' ? 20 : 10)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => dispatch({ type: 'REORDER_ITEM_LAYER', payload: { itemId: selectedTargetClip.id, direction: 'bring_to_front' } })}
                title="Bring To Front (Topmost)"
              >
                ⇈ Bring to Front
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => dispatch({ type: 'REORDER_ITEM_LAYER', payload: { itemId: selectedTargetClip.id, direction: 'bring_forward' } })}
                title="Bring Forward (+1 Layer)"
              >
                ↑ Bring Forward
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => dispatch({ type: 'REORDER_ITEM_LAYER', payload: { itemId: selectedTargetClip.id, direction: 'send_backward' } })}
                title="Send Backward (-1 Layer)"
              >
                ↓ Send Backward
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => dispatch({ type: 'REORDER_ITEM_LAYER', payload: { itemId: selectedTargetClip.id, direction: 'send_to_back' } })}
                title="Send To Back (Bottommost)"
              >
                ⇊ Send to Back
              </button>
            </div>
          </div>
        )}

        <div className="card hover-border" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Primary Audio Master</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{audioSettings.primaryVol}%</span>
          </div>
          <input
            aria-label="Primary audio volume"
            type="range"
            min="0"
            max="100"
            value={Math.min(audioSettings.primaryVol, 100)}
            onChange={e => setAudioSettings(s => ({...s, primaryVol: Number(e.target.value)}))}
            style={{ width: '100%', marginBottom: '0.35rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '1.25rem' }}>
            <span>Mute</span>
            <span>Full volume</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div>
                <div>Voice Cleanup</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>80Hz Highpass • 3kHz Presence EQ • Dynamics Compressor</div>
              </div>
              <input type="checkbox" checked={audioSettings.voiceCleanup} onChange={e => setAudioSettings(s => ({...s, voiceCleanup: e.target.checked}))} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div>
                <div>Background Denoise</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Adaptive Spectral Denoising (Export Enhanced)</div>
              </div>
              <input type="checkbox" checked={audioSettings.noiseReduction} onChange={e => setAudioSettings(s => ({...s, noiseReduction: e.target.checked}))} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div>
                <div>Auto Ducking</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speech-Reactive Sidechain Compression</div>
              </div>
              <input type="checkbox" checked={audioSettings.autoDuck} onChange={e => setAudioSettings(s => ({...s, autoDuck: e.target.checked}))} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
            </label>
          </div>
        </div>

        {/* AI Silence Removal Card */}
        <div className="card hover-border" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Scissors size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>AI Silence Removal (Jump-Cut)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min Duration ({silenceState.minDuration}s)</span>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={silenceState.minDuration}
                onChange={e => setSilenceState(s => ({ ...s, minDuration: Number(e.target.value) }))}
                style={{ width: '50%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speech Padding ({silenceState.padding}s)</span>
              <input
                type="range"
                min="0.02"
                max="0.20"
                step="0.02"
                value={silenceState.padding}
                onChange={e => setSilenceState(s => ({ ...s, padding: Number(e.target.value) }))}
                style={{ width: '50%' }}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleAnalyzeSilence}
            disabled={silenceState.status === 'analyzing'}
          >
            {silenceState.status === 'analyzing' ? (
              <>Analyzing Audio...</>
            ) : (
              <><Zap size={14} /> Analyze & Remove Silence</>
            )}
          </button>
        </div>

        {/* Silence Cut Preview Modal */}
        {silenceState.status === 'plan_ready' && silenceState.plan && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Scissors size={18} style={{ color: 'var(--accent-primary)' }} /> AI Silence Removal Preview
                </h3>
                <button className="btn btn-secondary" style={{ padding: '4px', border: 'none' }} onClick={() => setSilenceState(s => ({ ...s, status: 'idle', plan: null }))}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Silences Detected:</span>
                  <span style={{ fontWeight: 600 }}>{silenceState.plan.shiftMap.cutIntervals.length} gaps</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Time Saved:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>-{silenceState.plan.totalTimeSaved}s</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Original Duration:</span>
                  <span>{formatTime(silenceState.plan.originalDuration)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>New Composition Duration:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatTime(silenceState.plan.newDuration)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Affected Timeline Items:</span>
                  <span>{silenceState.plan.itemActions.length} clips</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => setSilenceState(s => ({ ...s, status: 'idle', plan: null }))}
                >
                  Cancel (0 Cuts)
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
                  onClick={() => {
                    if (silenceState.plan) {
                      dispatch({ type: 'APPLY_SILENCE_CUT_PLAN', payload: silenceState.plan });
                      showToast(`Removed ${silenceState.plan.shiftMap.cutIntervals.length} silence gaps (${silenceState.plan.totalTimeSaved}s saved)`);
                      setSilenceState(s => ({ ...s, status: 'idle', plan: null }));
                    }
                  }}
                >
                  Apply Cuts (1 Undo)
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>BGM Tracks</h4>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vol: {audioSettings.bgmVol}%</span>
        </div>
        <input
          aria-label="BGM volume"
          type="range"
          min="0"
          max="100"
          value={audioSettings.bgmVol}
          onChange={e => setAudioSettings(s => ({...s, bgmVol: Number(e.target.value)}))}
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {mockMusic.map(m => {
            const hasPreviewSource = Boolean(m.url);
            return (
            <div key={m.id} className="card hover-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', cursor: hasPreviewSource ? 'pointer' : 'default', border: selectedBgmId === m.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)', transition: 'all 0.2s', opacity: hasPreviewSource ? 1 : 0.72 }} onClick={() => { if (!hasPreviewSource) { showToast('BGM preview source pending'); return; } setSelectedBgmId(m.id); 
    const [mins, secs] = m.duration.split(':').map(Number);
    const dur = (mins * 60) + secs;
    dispatch({ type: 'ADD_ITEM', payload: { id: `bgm-${m.id}`, trackId: 'track-bgm-1', type: 'audio', start: 0, end: dur, label: m.title, assetId: m.url, properties: {} } });
    showToast(`Selected ${m.title}`); }} >
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)' }}>{m.title}</span>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{hasPreviewSource ? m.duration : 'Source pending'}</span>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTool === 'draw') {
    const drawColors = ['#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ffffff', '#000000'];
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <div className="card hover-border" style={{ padding: '1rem', borderRadius: '10px', border: '1px solid var(--accent-rose)', boxShadow: 'var(--shadow-neo-raised-sm)', background: 'var(--bg-surface-low)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Pencil size={18} style={{ color: 'var(--accent-rose)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Canvas Drawing Brush</span>
          </div>

          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>
            Brush Color
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
            {drawColors.map(c => (
              <div
                key={c}
                onClick={() => setDrawColor(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: c,
                  border: drawColor === c ? '2px solid var(--text-main)' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'transform 0.1s'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stroke Size</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-rose)' }}>{drawWidth}px</span>
          </div>
          <input
            type="range"
            min="2"
            max="24"
            step="1"
            value={drawWidth}
            onChange={e => setDrawWidth(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '1.25rem' }}
          />

          <div style={{
            background: 'var(--bg-surface-lowest)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}>
            ✏️ <strong>Live Canvas Drawing Active:</strong> Click and drag your mouse or stylus directly over the video canvas to draw in real time.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
              onClick={() => {
                const sampleStrokePoints = [
                  { x: 200, y: 400 }, { x: 400, y: 600 }, { x: 600, y: 400 }, { x: 800, y: 600 }
                ];
                const newItem = {
                  id: `draw-${crypto.randomUUID()}`,
                  trackId: 'track-text-1',
                  type: 'overlay' as const,
                  start: currentTime,
                  end: Math.min(timelineDuration > 0 ? timelineDuration : 15, currentTime + 4.0),
                  label: `✏️ Freehand Drawing`,
                  content: 'drawing',
                  properties: {
                    x: 0,
                    y: 0,
                    scale: 100,
                    opacity: 100,
                    rotation: 0,
                    strokePoints: sampleStrokePoints,
                    strokeColor: drawColor,
                    strokeWidth: drawWidth,
                    zIndex: 25
                  }
                };
                dispatch({ type: 'ADD_ITEM', payload: newItem });
                selectSingle(newItem.id);
                showToast('Added Freehand Drawing Overlay to Timeline');
              }}
            >
              ✏️ Add Preset Drawing Overlay
            </button>

            {(() => {
              const drawingClips = editState.items.filter(i => i.type === 'overlay' && (i.properties?.strokePoints?.length ?? 0) > 0);
              if (drawingClips.length === 0) return null;
              return (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.78rem', color: 'var(--accent-rose)' }}
                  onClick={() => {
                    drawingClips.forEach(clip => dispatch({ type: 'DELETE_ITEM', payload: { id: clip.id } }));
                    showToast(`Cleared ${drawingClips.length} drawing overlay(s)`);
                  }}
                >
                  🗑️ Clear All Drawings ({drawingClips.length})
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  if (activeTool === 'brand') {
    const currentLogoUrl = typeof brandKit.watermark === 'object' ? brandKit.watermark?.logoUrl : undefined;

    const handleLogoFileChange = (file: File) => {
      const allowedMime = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!allowedMime.includes(file.type)) {
        showToast('Invalid file format. Please upload PNG, JPEG, SVG, or WebP.');
        return;
      }
      const MAX_SIZE_MB = 5;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast(`Logo file exceeds ${MAX_SIZE_MB}MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setBrandKit(s => ({
          ...s,
          watermark: {
            ...(typeof s.watermark === 'object' ? s.watermark : DEFAULT_BRAND_KITS.minimal_neo.watermark),
            logoUrl
          }
        }));
        showToast('Brand logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <input
          type="file"
          ref={logoInputRef}
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleLogoFileChange(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        <div className="card hover-border" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand Kit Preset</h4>
          <select className="form-select" value={brandKit.id || 'minimal_neo'} onChange={e => setBrandKit(DEFAULT_BRAND_KITS[e.target.value] || DEFAULT_BRAND_KITS.minimal_neo)} style={{ marginBottom: '1.5rem', width: '100%', fontSize: '0.85rem' }}>
            {Object.values(DEFAULT_BRAND_KITS).map(kit => (
              <option key={kit.id} value={kit.id}>{kit.name}</option>
            ))}
          </select>

          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand Colors</h4>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
             {[brandKit.colors?.primary || '#0ea5e9', brandKit.colors?.secondary || '#6366f1', brandKit.colors?.accent || '#f43f5e', '#000000', '#ffffff'].map(c => (
               <div key={c} onClick={() => setBrandKit(s => ({ ...s, colors: { ...s.colors, primary: c } }))} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: brandKit.colors?.primary === c ? '2px solid var(--text-main)' : '2px solid transparent', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.1s' }} className="hover-scale" />
             ))}
          </div>
          
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Typography</h4>
          <select className="form-select" value={brandKit.primaryFont?.family || 'Inter'} onChange={e => setBrandKit(s => ({ ...s, primaryFont: { ...s.primaryFont, family: e.target.value } }))} style={{ marginBottom: '1.5rem', width: '100%', fontSize: '0.85rem' }}>
            <option value="Inter">Inter Sans</option>
            <option value="Impact">Impact Heavy</option>
            <option value="Playfair Display">Playfair Serif</option>
            <option value="Orbitron">Orbitron Cyber</option>
            <option value="Montserrat">Montserrat Bold</option>
          </select>

          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watermark Logo</h4>
          {currentLogoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', padding: '8px', background: 'var(--bg-surface-low)', borderRadius: '6px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentLogoUrl} alt="Brand Logo" style={{ height: '32px', maxWidth: '80px', objectFit: 'contain', background: '#000', borderRadius: '4px', padding: '2px' }} />
              <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custom Logo Active</div>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 8px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                onClick={() => {
                  setBrandKit(s => ({
                    ...s,
                    watermark: {
                      ...(typeof s.watermark === 'object' ? s.watermark : DEFAULT_BRAND_KITS.minimal_neo.watermark),
                      logoUrl: undefined
                    }
                  }));
                  showToast('Removed custom logo');
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.65rem', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onClick={() => logoInputRef.current?.click()}
            >
              <Upload size={14} /> Upload Brand Logo (PNG/SVG, max 5MB)
            </button>
          )}

          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watermark Position</h4>
          <select className="form-select" value={typeof brandKit.watermark === 'object' ? brandKit.watermark?.position : 'bottom-right'} onChange={e => setBrandKit(s => ({ ...s, watermark: { ...(typeof s.watermark === 'object' ? s.watermark : DEFAULT_BRAND_KITS.minimal_neo.watermark), position: e.target.value as any } }))} style={{ width: '100%', fontSize: '0.85rem' }}>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="center">Center</option>
          </select>
        </div>
        
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontWeight: 600, boxShadow: 'var(--shadow-glow)' }} onClick={() => showToast('Brand Kit applied to project')}>Apply Brand Style</button>
      </div>
    );
  }

  if (activeTool === 'settings') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
        <label className="studio-field">
          Project Title
          <input type="text" className="form-input" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
        </label>
        <div className="card hover-border" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Auto-save Status</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 600 }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Last Export</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>2 hours ago</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Platform Preset</span>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{platformPresets[platformPreset]?.label || 'Custom'}</span>
          </div>
        </div>
        <div className="card hover-border" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>DB Connection</span>
            <span style={{ fontSize: '0.85rem', color: isSupabaseConfigured() ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 600 }}>
              {isSupabaseConfigured() ? 'Connected' : 'Demo Mode'}
            </span>
          </div>
        </div>
        {showResetConfirm ? (
          <div className="card" style={{ padding: '1rem', marginTop: '1.5rem', border: '1px solid var(--accent-rose)', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '6px' }}>⚠️ Confirm Project Reset?</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
              This will clear the current timeline, remove temporary media, and restore the default state.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', background: 'var(--accent-rose)', border: 'none' }} onClick={() => { setShowResetConfirm(false); resetDemo(); }}>
                Yes, Reset
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', color: 'var(--accent-rose)' }} onClick={() => setShowResetConfirm(true)}>
            <RotateCcw size={16} style={{marginRight: '6px'}}/> Reset Demo Project
          </button>
        )}
      </div>
    );
  }

  if (activeTool === 'publish') {
    return <PublishingDeck />;
  }

  return (
    <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      <div className="studio-empty" style={{ padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '1rem', opacity: 0.5 }}><SlidersHorizontal size={32} /></div>
        Settings tools are active. Select a track in the timeline to adjust properties.
      </div>
    </div>
  );
}


