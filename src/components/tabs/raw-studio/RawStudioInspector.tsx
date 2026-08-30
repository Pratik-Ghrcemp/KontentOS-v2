import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, RefreshCw, CheckCircle, Copy, Upload, FileVideo, Music2,
  Sparkles, Type, Trash2, Zap, Hash, RotateCcw, SlidersHorizontal, Plus, Search, Scissors, X, Layers, Pencil
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { platformPresets } from '@/lib/rendering/presets';
import { formatTime, isPlayablePath } from './utils';
import { mockMusic, mockGraphicElements } from './mock-data';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTimelineItemFromAsset } from '@/lib/editing/factory';
import { createTextTimelineItem, createCaptionTimelineItems } from '@/lib/editing/text-factory';
import { DEFAULT_BRAND_KITS } from '@/lib/editing/brand-kit';
import { filterAssets } from '@/lib/editing/assets/filter';
import { 
  detectSilenceIntervals, 
  extractPeaksFromAudioBuffer, 
  generateSilenceCutPlan, 
  SilenceRemovalEditPlan,
  generateFallbackPeaks
} from '@/lib/editing/audio';

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
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={handleExport} disabled={!activeAsset}>
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

  if (selectedClipId) {
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

        <div className="studio-asset-list">
          {filteredAssets.length === 0 && <div className="studio-empty" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No matching assets found.</div>}
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`studio-asset-row ${activeAsset?.id === asset.id ? 'active' : ''}`}
              style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0.75rem', background: activeAsset?.id === asset.id ? 'var(--bg-surface-high)' : 'var(--bg-surface-low)', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => setActiveAsset(asset)}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(asset))}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.projects?.title || (asset as any).title || asset.fileName || 'Media'}
                </span>
                {asset.asset_type === 'audio' ? <Music2 size={14} color="var(--text-muted)"/> : <FileVideo size={14} color="var(--text-muted)"/>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatTime(Number(asset.duration_seconds) || 0)}</span>
                <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={(e) => { 
                  e.stopPropagation(); 
                  const newClip = createTimelineItemFromAsset(asset, { startTime: currentTime });
                  dispatch({ type: 'ADD_ITEM', payload: newClip });
                  selectSingle(newClip.id);
                  setDuration(Math.max(duration, newClip.end));
                  showToast('Added asset to timeline'); 
                }}>+ Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTool === 'captions') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '0.5rem 1rem', background: 'var(--bg-main)', height: '100%', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Captions</h2>
          <div style={{ width: '38px', height: '22px', background: 'var(--accent-primary)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
             <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* Auto Generate Button */}
        <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(99,102,241,0.2)', cursor: 'pointer', border: 'none' }} onClick={handleGenerateCaptions} disabled={aiLoading['captions']}>
          <span style={{ fontSize: '18px', fontWeight: 400 }}>+</span> Auto Generate Captions
        </button>
        
        {/* Style & Appearance */}
        <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>STYLE & APPEARANCE</h4>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <select className="form-select" style={{ flex: 2, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.85rem', outline: 'none' }}>
              <option>Poppins</option>
            </select>
            <select className="form-select" style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 10px', fontSize: '0.85rem', outline: 'none' }}>
              <option>Bold</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px' }}>
               <span style={{ padding: '0 8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Aa</span>
               <span style={{ padding: '0 8px', fontSize: '0.9rem', fontWeight: 500 }}>48</span>
               <div style={{ flex: 1 }} />
               <button style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>-</button>
               <span style={{ color: 'var(--border-subtle)', fontSize: '0.8rem' }}>~</span>
               <button style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1rem' }}>+</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '4px' }}>
              <button style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)' }}><span style={{fontSize: '14px'}}>≡</span></button>
              <button style={{ background: 'var(--bg-surface-low)', border: 'none', padding: '6px 10px', cursor: 'pointer', color: 'var(--accent-primary)', borderRadius: '6px' }}><span style={{fontSize: '14px', fontWeight: 'bold'}}>≡</span></button>
              <button style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)' }}><span style={{fontSize: '14px'}}>≡</span></button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-base)', borderRadius: '24px', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
            {['#ffffff', '#000000', '#facc15', '#ec4899', '#06b6d4'].map((color, i) => (
              <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, border: '1px solid var(--border-subtle)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
            ))}
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'transparent', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <span style={{ fontSize: '12px' }}>✒️</span>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, margin: 0 }}>AI SUGGESTIONS</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>See all</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.85rem', border: '1px solid var(--border-subtle)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-surface)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '1.3rem' }}>🔥</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Gradient & Highlighted Text</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Make your key words pop</div>
            </div>
          </div>
          <div style={{ padding: '0.85rem', border: '1px solid var(--border-subtle)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-surface)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '1.3rem' }}>✨</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Trending Hashtag Style</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Boost engagement instantly</div>
            </div>
          </div>
          <div style={{ padding: '0.85rem', border: '1px solid var(--border-subtle)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-surface)', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '1.3rem' }}>💬</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Dynamic Text Blocks</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perfect for short videos</div>
            </div>
          </div>
        </div>

        {/* Brand Kit */}
        <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>SAVE STYLE TO BRAND KIT</h4>
        <button style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1px dashed var(--text-muted)', background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ fontSize: '18px', fontWeight: 400 }}>+</span> Add to Brand Kit
        </button>
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
      <div className="studio-panel-stack animate-fade-in" style={{ paddingRight: '4px' }}>
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

         <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Structural Templates</h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
           {[
             { name: "Viral Hook-Body-CTA", desc: "Calibrated 3-part layout for high retention." },
             { name: "Educational Breakdown", desc: "Optimized for step-by-step tutorials." },
             { name: "Product Showcase / Demo", desc: "Highlight features with a strong CTA." },
             { name: "Quick Tips / Myth Buster", desc: "Fast-paced myth vs reality style." }
           ].map((tmpl, idx) => (
             <div key={idx} className="card hover-border" style={{ padding: '0.85rem', cursor: 'pointer', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-neo-raised-sm)', transition: 'all 0.2s' }} onClick={() => showToast(`Applied ${tmpl.name} template`)} >
               <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '2px' }}>{tmpl.name}</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tmpl.desc}</div>
             </div>
           ))}
         </div>
         
         <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-glow)', fontWeight: 600 }} onClick={() => showToast('Current settings saved as template!')}>
           <CheckCircle size={16} /> Save Current Settings as Template
         </button>
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
          const textContent = txt.label || txt.properties?.text || 'Text Overlay';
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

  if (activeTool === 'audio') {
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
              Voice Cleanup <input type="checkbox" checked={audioSettings.voiceCleanup} onChange={e => setAudioSettings(s => ({...s, voiceCleanup: e.target.checked}))} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              Auto Ducking (Speech Reactive) <input type="checkbox" checked={audioSettings.autoDuck} onChange={e => setAudioSettings(s => ({...s, autoDuck: e.target.checked}))} style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }} />
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

  if (activeTool === 'elements') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
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
            style={{ width: '100%', marginBottom: '1rem' }}
          />

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, background: 'var(--accent-rose)', border: 'none' }}
            onClick={() => {
              const sampleStrokePoints = [
                { x: -60, y: -20 }, { x: -20, y: 30 }, { x: 20, y: -30 }, { x: 60, y: 20 }
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
                  zIndex: 15
                }
              };
              dispatch({ type: 'ADD_ITEM', payload: newItem });
              selectSingle(newItem.id);
              showToast('Added Freehand Drawing Overlay to Timeline');
            }}
          >
            ✏️ Add Preset Drawing Overlay
          </button>
        </div>
      </div>
    );
  }

  if (activeTool === 'brand') {
    return (
      <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
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
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem', color: 'var(--accent-rose)' }} onClick={resetDemo}>
          <RotateCcw size={16} style={{marginRight: '6px'}}/> Reset Demo Project
        </button>
      </div>
    );
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


