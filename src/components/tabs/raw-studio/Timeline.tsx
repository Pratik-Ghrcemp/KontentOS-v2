import React, { useCallback, useRef, useState } from 'react';
import { 
  Split, Trash2, ZoomIn, ZoomOut, MonitorPlay, Music2, Type, Lock, VolumeX, ChevronDown, Bookmark, X 
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { formatTime } from './utils';
import { calculateSnap } from '@/lib/editing/engine';
import { mockMusic } from './mock-data';
import { createTimelineItemFromAsset } from '@/lib/editing/factory';
import { calculateTrimLeft, calculateTrimRight } from '@/lib/editing/timeline';
import { generateFallbackPeaks } from '@/lib/editing/audio';
import { StudioAsset } from './types';

const parseDurationSeconds = (duration: string) => {
  const [minutes, seconds] = duration.split(':').map(Number);
  return ((minutes || 0) * 60) + (seconds || 0);
};

export function Timeline() {
  const {
    isPlaying,
    currentTime,
    seekTo,
    timelineZoom,
    timelineHeight,
    setTimelineZoom,
    timelineDuration,
    audioSettings,
    selectedBgmId,
    editState,
    dispatch,
    selectedClipId,
    setSelectedClipId,
    selectSingle,
    toggleSelection,
    clearSelection,
    splitSelectedClip,
    deleteSelectedClip,
  } = useRawStudio();
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [activeSnapTime, setActiveSnapTime] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null);
  const [clipboardClip, setClipboardClip] = useState<any | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const selectedBgm = mockMusic.find((track) => track.id === selectedBgmId);
  const bgmClip = selectedBgm
    ? {
        id: `bgm-${selectedBgm.id}`,
        start: 0,
        end: Math.min(parseDurationSeconds(selectedBgm.duration), timelineDuration),
        label: selectedBgm.title,
      }
    : { id: 'a2-empty', start: 0, end: 0, label: 'Select BGM from Audio' };

  const handleClipInteraction = (e: React.PointerEvent, clipId: string, action: 'move' | 'trim-left' | 'trim-right', start: number, end: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey) {
      toggleSelection(clipId);
    } else if (!editState.selection.includes(clipId)) {
      selectSingle(clipId);
    }
    
    if (timelineDuration <= 0 || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pixelsPerSecond = rect.width / timelineDuration;
    
    const startX = e.clientX;
    const initialStart = start;
    const initialEnd = end;

    let latestAction: { type: 'MOVE_ITEM' | 'TRIM_ITEM'; payload: any } | null = null;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dt = dx / pixelsPerSecond;
      
      let newStart = initialStart;
      let newEnd = initialEnd;
      
      if (action === 'move') {
        newStart = Math.max(0, initialStart + dt);
        newEnd = newStart + (initialEnd - initialStart);
        
        const snapStart = calculateSnap(newStart, editState, clipId, 0.25, currentTime);
        const snapEnd = calculateSnap(newEnd, editState, clipId, 0.25, currentTime);
        
        if (snapStart.snapped && (!snapEnd.snapped || snapStart.distance < snapEnd.distance)) {
           newStart = snapStart.time;
           newEnd = newStart + (initialEnd - initialStart);
           setActiveSnapTime(snapStart.time);
        } else if (snapEnd.snapped) {
           newEnd = snapEnd.time;
           newStart = newEnd - (initialEnd - initialStart);
           setActiveSnapTime(snapEnd.time);
        } else {
           setActiveSnapTime(null);
        }
        latestAction = { type: 'MOVE_ITEM', payload: { id: clipId, newStart, newEnd } };
        dispatch({ type: 'MOVE_ITEM', payload: { id: clipId, newStart, newEnd }, meta: { isTransient: true } });
      } else if (action === 'trim-left') {
        const item = editState.items.find(i => i.id === clipId);
        if (item) {
          const rawTrim = calculateTrimLeft(item, initialStart + dt);
          let trimmedStart = rawTrim.start;
          const snap = calculateSnap(trimmedStart, editState, clipId, 0.25, currentTime);
          if (snap.snapped) {
            trimmedStart = snap.time;
            setActiveSnapTime(snap.time);
          } else {
            setActiveSnapTime(null);
          }
          latestAction = { type: 'TRIM_ITEM', payload: { id: clipId, newStart: trimmedStart, newEnd: item.end, newSourceIn: rawTrim.sourceIn } };
          dispatch({ 
            type: 'TRIM_ITEM', 
            payload: { id: clipId, newStart: trimmedStart, newEnd: item.end, newSourceIn: rawTrim.sourceIn },
            meta: { isTransient: true }
          });
        }
      } else if (action === 'trim-right') {
        const item = editState.items.find(i => i.id === clipId);
        if (item) {
          const rawTrim = calculateTrimRight(item, initialEnd + dt);
          let trimmedEnd = rawTrim.end;
          const snap = calculateSnap(trimmedEnd, editState, clipId, 0.25, currentTime);
          if (snap.snapped) {
            trimmedEnd = snap.time;
            setActiveSnapTime(snap.time);
          } else {
            setActiveSnapTime(null);
          }
          latestAction = { type: 'TRIM_ITEM', payload: { id: clipId, newStart: item.start, newEnd: trimmedEnd, newSourceOut: rawTrim.sourceOut } };
          dispatch({ 
            type: 'TRIM_ITEM', 
            payload: { id: clipId, newStart: item.start, newEnd: trimmedEnd, newSourceOut: rawTrim.sourceOut },
            meta: { isTransient: true }
          });
        }
      }
    };

    const handleUp = () => {
      setActiveSnapTime(null);
      if (latestAction) {
        dispatch({ type: latestAction.type, payload: latestAction.payload });
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleAddMarker = useCallback(() => {
    const time = Number(currentTime.toFixed(3));
    const currentMarkers = editState.markers || [];
    if (currentMarkers.some(m => Math.abs(m.time - time) < 0.1)) {
      return;
    }
    const marker = {
      id: `marker-${crypto.randomUUID()}`,
      time,
      label: `Marker ${currentMarkers.length + 1}`,
      color: 'var(--accent-amber)'
    };
    dispatch({ type: 'ADD_MARKER', payload: marker });
  }, [currentTime, editState.markers, dispatch]);

  const seekFromPointer = useCallback((clientX: number) => {
    if (!timelineRef.current || timelineDuration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    let targetTime = ratio * timelineDuration;

    // Playhead Snapping to Markers
    const markers = editState.markers || [];
    const snapMarker = markers.find(m => Math.abs(m.time - targetTime) < 0.15);
    if (snapMarker) {
      targetTime = snapMarker.time;
    }

    seekTo(targetTime);
  }, [seekTo, timelineDuration, editState.markers]);

  // Alt + Scroll to Zoom Timeline
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey && timelineRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const newZoom = timelineZoom + (e.deltaY < 0 ? 10 : -10);
        setTimelineZoom(Math.min(Math.max(newZoom, 0), 500));
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [setTimelineZoom, timelineZoom]);

  React.useEffect(() => {
    if (!isScrubbing) return;

    const handlePointerMove = (event: PointerEvent) => seekFromPointer(event.clientX);
    const stopScrubbing = () => setIsScrubbing(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopScrubbing);
    window.addEventListener('pointercancel', stopScrubbing);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopScrubbing);
      window.removeEventListener('pointercancel', stopScrubbing);
    };
  }, [isScrubbing, seekFromPointer]);

  // Auto-scroll timeline when playing
  React.useEffect(() => {
    if (timelineDuration <= 0 || isScrubbing || !timelineRef.current) return;
    
    const interval = setInterval(() => {
      if (!timelineRef.current) return;
      const container = timelineRef.current.parentElement;
      if (!container) return;
      
      const playheadX = (currentTime / timelineDuration) * timelineRef.current.scrollWidth;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      if (playheadX > scrollLeft + containerWidth - 50) {
        container.scrollTo({ left: playheadX - containerWidth / 2, behavior: 'smooth' });
      }
      else if (playheadX < scrollLeft) {
        container.scrollTo({ left: playheadX - 50, behavior: 'smooth' });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTime, timelineDuration, isScrubbing]);

  // Keyboard Shortcuts 'S' for Split, 'M' for Marker
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable = (document.activeElement as HTMLElement)?.isContentEditable;
      if (activeTag === 'input' || activeTag === 'textarea' || isEditable) return;

      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitSelectedClip();
      }

      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleAddMarker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [splitSelectedClip, handleAddMarker]);

  return (
    <section className="studio-timeline" style={{ height: `${timelineHeight}px`, minHeight: '160px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      
      {/* Timeline Tools */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 }}>
         <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
           <button className="btn btn-secondary" disabled={!selectedClipId} style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', opacity: selectedClipId ? 1 : 0.5, cursor: selectedClipId ? 'pointer' : 'not-allowed', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }} onClick={splitSelectedClip} title="Split at playhead (Shortcut: S)"><Split size={14}/> Split (S)</button>
           <button className="btn btn-secondary" disabled={!selectedClipId} style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', opacity: selectedClipId ? 1 : 0.5, cursor: selectedClipId ? 'pointer' : 'not-allowed', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }} onClick={deleteSelectedClip}><Trash2 size={14}/> Delete</button>
           <button className="btn btn-secondary" disabled={!selectedClipId} style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', opacity: selectedClipId ? 1 : 0.5, cursor: selectedClipId ? 'pointer' : 'not-allowed', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }} onClick={() => { if (selectedClipId) dispatch({ type: 'DELETE_ITEM', payload: { id: selectedClipId, ripple: true } }); }} title="Ripple Delete & Shift Track Clips"><Trash2 size={14}/> Ripple Delete</button>
           <button className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }} onClick={handleAddMarker} title="Add Marker at playhead (Shortcut: M)"><Bookmark size={14}/> Add Marker (M)</button>
         </div>

         <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
           <button className="btn" style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: '20px', padding: '0.4rem 1.25rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(99,102,241,0.3)' }} onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}>
             <span style={{ fontSize: '13px' }}>🖼️</span> Add Media <ChevronDown size={14} />
           </button>
         </div>

         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
           <ZoomOut size={15} color="var(--text-muted)" />
           <input type="range" style={{ width: '90px', accentColor: 'var(--accent-primary)' }} value={timelineZoom} onChange={e => setTimelineZoom(Number(e.target.value))}/>
           <ZoomIn size={15} color="var(--text-muted)" />
         </div>
      </div>

      {/* Tracks */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
        <div className="studio-time-header" style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'calc(160px + 1.5rem)', paddingRight: '1.5rem', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'monospace', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.2rem' }}>
          <span>00:00.0</span>
          <span>{timelineDuration > 0 ? formatTime(timelineDuration / 2) : '--:--'}</span>
          <span>{timelineDuration > 0 ? formatTime(timelineDuration) : '--:--'}</span>
        </div>
        
        <div style={{ position: 'relative', padding: '0 1.5rem', width: `${100 + timelineZoom}%`, minWidth: '100%' }}>
          {/* Playhead & Markers Overlay */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 'calc(160px + 1.5rem)', right: '1.5rem', pointerEvents: 'none', zIndex: 20 }}>
            {/* Timeline Markers */}
            {(editState.markers || []).map((marker) => {
              const leftPos = timelineDuration > 0 ? (marker.time / timelineDuration) * 100 : 0;
              return (
                <div
                  key={marker.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${leftPos}%`,
                    pointerEvents: 'auto',
                    zIndex: 22
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-10px',
                      background: marker.color || 'var(--accent-amber)',
                      color: '#000',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px 4px 4px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(marker.time);
                    }}
                    title={`${marker.label} (${formatTime(marker.time)}) - Click to seek, right-click to delete`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      dispatch({ type: 'DELETE_MARKER', payload: { id: marker.id } });
                    }}
                  >
                    <Bookmark size={10} fill="#000" />
                    <span>{marker.label}</span>
                    <X
                      size={10}
                      style={{ cursor: 'pointer', marginLeft: '2px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'DELETE_MARKER', payload: { id: marker.id } });
                      }}
                    />
                  </div>
                  <div style={{ position: 'absolute', top: '16px', bottom: 0, left: '0', width: '1px', borderLeft: '1px dashed var(--accent-amber)', opacity: 0.7 }} />
                </div>
              );
            })}

            {/* Crisp Glowing Playhead Line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${timelineDuration > 0 ? (currentTime / timelineDuration) * 100 : 0}%`, width: '2px', background: 'var(--accent-primary)', boxShadow: '0 0 6px rgba(99,102,241,0.6)', zIndex: 25 }}>
               <div data-testid="timeline-playhead-handle" style={{ position: 'absolute', top: '-8px', left: '-5px', width: '12px', height: '12px', background: 'var(--accent-primary)', border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', pointerEvents: 'auto', cursor: timelineDuration > 0 ? 'ew-resize' : 'not-allowed' }} onPointerDown={(event) => { event.stopPropagation(); setIsScrubbing(true); seekFromPointer(event.clientX); }} />
            </div>

            {/* Active Magnetic Snap Line */}
            {activeSnapTime !== null && timelineDuration > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${(activeSnapTime / timelineDuration) * 100}%`,
                  width: '2px',
                  background: 'var(--accent-purple)',
                  boxShadow: '0 0 10px var(--accent-purple)',
                  zIndex: 26,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {editState.tracks.map((track) => {
              const TrackIcon = track.type === 'video' ? MonitorPlay : track.type === 'audio' ? Music2 : Type;
              const trackClips = editState.items.filter(i => i.trackId === track.id);
              const state = { locked: track.locked, muted: track.muted };
            return (
              <div key={track.label} style={{ display: 'flex', marginBottom: '6px', height: '38px', background: 'var(--bg-surface-lowest)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                {/* Track Header */}
                <div style={{ position: 'sticky', left: 0, width: '160px', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-surface-low)', zIndex: 10 }}>
                  <TrackIcon size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-main)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.label}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span onClick={() => dispatch({ type: 'TOGGLE_TRACK_LOCK', payload: { id: track.id } })} style={{ cursor: 'pointer', opacity: state?.locked ? 1 : 0.5 }}><Lock size={12} color={state?.locked ? 'var(--accent-primary)' : 'var(--text-muted)'} /></span>
                    <span onClick={() => dispatch({ type: 'TOGGLE_TRACK_MUTE', payload: { id: track.id } })} style={{ cursor: 'pointer', opacity: state?.muted ? 1 : 0.5 }}><VolumeX size={12} color={state?.muted ? 'var(--accent-primary)' : 'var(--text-muted)'} /></span>
                  </div>
                </div>
                {/* Track Lane */}
                <div 
                  ref={track.label === 'Video 1' ? timelineRef : undefined}
                  data-testid={track.label === 'Video 1' ? 'timeline-video-lane' : undefined}
                  style={{ flex: 1, position: 'relative', cursor: timelineDuration > 0 ? 'ew-resize' : 'not-allowed', opacity: state?.locked ? 0.5 : 1 }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (state?.locked) return;
                    const rawData = e.dataTransfer.getData('application/json');
                    if (!rawData) return;
                    try {
                      const asset: StudioAsset = JSON.parse(rawData);
                      const trackRect = e.currentTarget.getBoundingClientRect();
                      const dropRatio = Math.min(Math.max((e.clientX - trackRect.left) / trackRect.width, 0), 1);
                      const dropTime = timelineDuration > 0 ? dropRatio * timelineDuration : currentTime;

                      const newClip = createTimelineItemFromAsset(asset, {
                        targetTrackId: track.id,
                        startTime: dropTime
                      });

                      dispatch({ type: 'ADD_ITEM', payload: newClip });
                      selectSingle(newClip.id);
                    } catch (err) {
                      console.warn('Could not parse dropped asset payload', err);
                    }
                  }}
                  onPointerDown={(event) => {
                    if (state?.locked || timelineDuration <= 0) return;
                    if (track.label === 'Video 1') {
                      setIsScrubbing(true);
                    }
                    const rect = event.currentTarget.getBoundingClientRect();
                    seekTo(((event.clientX - rect.left) / rect.width) * timelineDuration);
                    clearSelection();
                  }}
                  onMouseDown={(event) => {
                    if (state?.locked || timelineDuration <= 0) return;
                    if (track.label === 'Video 1') {
                      setIsScrubbing(true);
                    }
                    const rect = event.currentTarget.getBoundingClientRect();
                    seekTo(((event.clientX - rect.left) / rect.width) * timelineDuration);
                    setSelectedClipId(null);
                  }}
                >
                  {trackClips.map((clip: any) => {
                    const isSelected = editState.selection.includes(clip.id);
                    return (
                      <div
                        key={clip.id}
                        style={{ 
                          position: 'absolute', top: '3px', bottom: '3px',
                          left: `${timelineDuration > 0 ? (clip.start / timelineDuration) * 100 : 0}%`,
                          width: `${timelineDuration > 0 ? Math.max(((clip.end - clip.start) / timelineDuration) * 100, 0.5) : 0}%`,
                          background: track.color, borderRadius: '4px', padding: '2px 6px',
                          fontSize: '0.7rem', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: 'flex', alignItems: 'center',
                          boxShadow: isSelected ? '0 0 0 2px var(--accent-primary)' : 'inset 0 0 0 1px rgba(255,255,255,0.25)',
                          cursor: 'pointer', opacity: track.label === 'Primary Audio' && audioSettings.voiceCleanup ? 0.8 : 1
                        }}
                        onPointerDown={(e) => handleClipInteraction(e, clip.id, 'move', clip.start, clip.end)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectSingle(clip.id);
                          setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id });
                        }}
                      >
                        <div 
                          onPointerDown={(e) => handleClipInteraction(e, clip.id, 'trim-left', clip.start, clip.end)}
                          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', background: isSelected ? 'rgba(255,255,255,0.7)' : 'transparent', zIndex: 10 }} 
                        />
                        {(clip.type === 'audio' || track.type === 'audio') && (
                          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none' }} preserveAspectRatio="none">
                            {generateFallbackPeaks(40).map((peak, idx) => (
                              <rect
                                key={idx}
                                x={`${(idx / 40) * 100}%`}
                                y={`${(1 - peak) * 50}%`}
                                width="2"
                                height={`${peak * 100}%`}
                                fill="#ffffff"
                              />
                            ))}
                          </svg>
                        )}
                        {(clip.keyframes && clip.keyframes.length > 0) && (
                          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6 }}>
                            {clip.keyframes.map((kf: any) => {
                              const clipDuration = clip.end - clip.start;
                              const kfLeft = clipDuration > 0 ? (kf.time / clipDuration) * 100 : 0;
                              return (
                                <span
                                  key={kf.id}
                                  style={{
                                    position: 'absolute',
                                    left: `${kfLeft}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '0.6rem',
                                    color: 'var(--accent-cyan)',
                                    textShadow: '0 0 4px #000',
                                    fontWeight: 800
                                  }}
                                  title={`Keyframe at t=${kf.time}s`}
                                >
                                  ❖
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <span style={{ padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', zIndex: 5 }}>{clip.label}</span>
                        <div 
                          onPointerDown={(e) => handleClipInteraction(e, clip.id, 'trim-right', clip.start, clip.end)}
                          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', background: isSelected ? 'rgba(255,255,255,0.7)' : 'transparent', zIndex: 10 }} 
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Clip Context Menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
            padding: '4px',
            minWidth: '150px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            fontSize: '0.8rem'
          }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '6px 12px' }} onClick={() => {
              const target = editState.items.find(i => i.id === contextMenu.clipId);
              if (target) setClipboardClip(target);
              setContextMenu(null);
            }}>Copy</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '6px 12px' }} onClick={() => {
              dispatch({ type: 'DUPLICATE_ITEM', payload: { id: contextMenu.clipId } });
              setContextMenu(null);
            }}>Duplicate</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '6px 12px' }} onClick={() => {
              dispatch({ type: 'SPLIT_ITEM', payload: { id: contextMenu.clipId, time: currentTime } });
              setContextMenu(null);
            }}>Split Playhead (S)</button>
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '6px 12px', color: 'var(--accent-rose)' }} onClick={() => {
              dispatch({ type: 'DELETE_ITEM', payload: { id: contextMenu.clipId, ripple: false } });
              setContextMenu(null);
            }}>Delete</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', border: 'none', padding: '6px 12px', color: 'var(--accent-amber)' }} onClick={() => {
              dispatch({ type: 'DELETE_ITEM', payload: { id: contextMenu.clipId, ripple: true } });
              setContextMenu(null);
            }}>Ripple Delete</button>
          </div>
        </>
      )}
    </section>
  );
}
