import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Grid3X3, Image as ImageIcon, Pause, Play, ChevronLeft, ChevronRight, Maximize, RotateCw, Layers } from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { TimelineItem } from '@/lib/editing/types';
import { 
  getCornerResizeDelta, 
  calculatePointerAngle, 
  calculateNormalizedAngleDelta, 
  getGroupBounds,
  calculateResizedGroupBounds,
  scalePointRelativeToBounds,
  rotatePointAroundCenter,
  getSelectionIntersection,
  Point,
  BoundingBox,
  CornerQuadrant 
} from '@/lib/editing/geometry';
import { platformPresets } from '@/lib/rendering/presets';
import { formatTime, isPlayablePath } from './utils';
import { mockMusic } from './mock-data';
import { calculateObjectAlignment } from '@/lib/editing/geometry/alignment';
import { calculateEffectiveVolume, calculateDuckingGain, calculateFadeGain } from '@/lib/editing/audio';
import { generateCssFilter } from '@/lib/editing/effects';
import { evaluateInterpolatedProperties } from '@/lib/editing/keyframes';

export function VideoPreview() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [videoScale, setVideoScale] = React.useState(1);
  const [isHoveringVideo, setIsHoveringVideo] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean } | null>(null);

  const toggleFullscreen = () => {
    if (!frameRef.current) return;
    if (!document.fullscreenElement) {
      frameRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const [marqueeState, setMarqueeState] = useState<{
    start: Point;
    current: Point;
    previewIds: string[];
    additive: boolean;
    isActive: boolean;
  } | null>(null);

  const {
    activeAsset,
    assets,
    previewZoom,
    setPreviewZoom,
    showSafeGuides,
    setShowSafeGuides,
    videoRef,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    captionStyle,
    activeCaption,
    editState,
    dispatch,
    brandKit,
    activeEffects,
    audioSettings,
    currentTime,
    timelineDuration,
    togglePlay,
    skip,
    isPlaying,
    activeTool,
    selectedClipId,
    setSelectedClipId,
    selectSingle,
    toggleSelection,
    selectMultiple,
    clearSelection,
    platformPreset,
    selectedLutId,
    selectedBgmId
  } = useRawStudio();

  const effectiveZoom = previewZoom === 'fit' || previewZoom === 'fill' ? 1 : (Number(previewZoom) / 100 || 1);

  const handleVideoCornerDrag = (e: React.PointerEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeVideoItem) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialScale = activeVideoItem.properties?.scale ?? 100;
    let currentScale = initialScale;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      const canvasDx = rawDx / effectiveZoom;
      const canvasDy = rawDy / effectiveZoom;
      const scaleDelta = getCornerResizeDelta(corner as CornerQuadrant, canvasDx, canvasDy) * 0.35;
      currentScale = Math.min(Math.max(Math.round(initialScale + scaleDelta), 10), 300);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: activeVideoItem.id,
          properties: { scale: currentScale }
        },
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: activeVideoItem.id,
          properties: { scale: currentScale }
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleTextCornerDrag = (e: React.PointerEvent, textItem: TimelineItem, corner: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialFontSize = textItem.properties?.fontSize ?? 32;
    let currentSize = initialFontSize;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      const canvasDx = rawDx / effectiveZoom;
      const canvasDy = rawDy / effectiveZoom;
      const sizeDelta = getCornerResizeDelta(corner as CornerQuadrant, canvasDx, canvasDy) * 0.25;
      currentSize = Math.min(Math.max(Math.round(initialFontSize + sizeDelta), 12), 120);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: textItem.id,
          properties: { fontSize: currentSize }
        },
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: textItem.id,
          properties: { fontSize: currentSize }
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleTextPointerDown = (e: React.PointerEvent, textItem: TimelineItem) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const isShift = e.shiftKey;

    const isTargetSelected = editState.selection.includes(textItem.id);
    const targetIds = isTargetSelected && editState.selection.length > 0
      ? editState.selection
      : [textItem.id];

    const initialPositions = targetIds.map(id => {
      const item = editState.items.find(i => i.id === id);
      return { id, x: item?.properties?.x ?? 0, y: item?.properties?.y ?? 0 };
    });

    // Collect coordinates of all OTHER active visual elements for smart alignment
    const otherElements: Array<{ x: number; y: number }> = [];
    activeTexts.forEach(item => {
      if (!targetIds.includes(item.id)) {
        const props = evaluateInterpolatedProperties(item, currentTime);
        otherElements.push({ x: props.x || 0, y: props.y || 0 });
      }
    });
    if (activeVideoItem && !targetIds.includes(activeVideoItem.id)) {
      const vProps = evaluateInterpolatedProperties(activeVideoItem, currentTime);
      otherElements.push({ x: vProps.x || 0, y: vProps.y || 0 });
    }

    let hasDragged = false;
    let currentDx = 0;
    let currentDy = 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      currentDx = rawDx / effectiveZoom;
      currentDy = rawDy / effectiveZoom;

      if (Math.hypot(rawDx, rawDy) > 5) {
        hasDragged = true;

        let snapX = false;
        let snapY = false;

        const batchPayload = initialPositions.map(pos => {
          const rawTargetX = Math.round(pos.x + currentDx);
          const rawTargetY = Math.round(pos.y + currentDy);

          const alignResult = calculateObjectAlignment(rawTargetX, rawTargetY, otherElements, 12);
          if (alignResult.snappedX) snapX = true;
          if (alignResult.snappedY) snapY = true;

          return { id: pos.id, properties: { x: alignResult.x, y: alignResult.y } };
        });

        setSnapGuides({ x: snapX, y: snapY });

        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: batchPayload,
          meta: { isTransient: true }
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setSnapGuides(null);

      if (hasDragged) {
        const batchPayload = initialPositions.map(pos => {
          const rawTargetX = Math.round(pos.x + currentDx);
          const rawTargetY = Math.round(pos.y + currentDy);

          const alignResult = calculateObjectAlignment(rawTargetX, rawTargetY, otherElements, 12);

          return { id: pos.id, properties: { x: alignResult.x, y: alignResult.y } };
        });

        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: batchPayload
        });
      } else {
        if (isShift) {
          toggleSelection(textItem.id);
        } else {
          selectSingle(textItem.id);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleVideoDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!activeVideoItem) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const isShift = e.shiftKey;

    const isTargetSelected = editState.selection.includes(activeVideoItem.id);
    const targetIds = isTargetSelected && editState.selection.length > 0
      ? editState.selection
      : [activeVideoItem.id];

    const initialPositions = targetIds.map(id => {
      const item = editState.items.find(i => i.id === id);
      return { id, x: item?.properties?.x ?? 0, y: item?.properties?.y ?? 0 };
    });

    let hasDragged = false;
    let currentDx = 0;
    let currentDy = 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      currentDx = rawDx / effectiveZoom;
      currentDy = rawDy / effectiveZoom;

      if (Math.hypot(rawDx, rawDy) > 5) {
        hasDragged = true;

        let snapX = false;
        let snapY = false;

        const batchPayload = initialPositions.map(pos => {
          let targetX = Math.round(pos.x + currentDx);
          let targetY = Math.round(pos.y + currentDy);

          if (Math.abs(targetX) < 12) {
            targetX = 0;
            snapX = true;
          }
          if (Math.abs(targetY) < 12) {
            targetY = 0;
            snapY = true;
          }

          return { id: pos.id, properties: { x: targetX, y: targetY } };
        });

        setSnapGuides({ x: snapX, y: snapY });

        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: batchPayload,
          meta: { isTransient: true }
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setSnapGuides(null);

      if (hasDragged) {
        const batchPayload = initialPositions.map(pos => {
          let targetX = Math.round(pos.x + currentDx);
          let targetY = Math.round(pos.y + currentDy);

          if (Math.abs(targetX) < 12) targetX = 0;
          if (Math.abs(targetY) < 12) targetY = 0;

          return { id: pos.id, properties: { x: targetX, y: targetY } };
        });

        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: batchPayload
        });
      } else if (Math.hypot(currentDx * effectiveZoom, currentDy * effectiveZoom) <= 5) {
        if (activeTool === 'select' && activeVideoItem) {
          if (isShift) {
            toggleSelection(activeVideoItem.id);
          } else {
            selectSingle(activeVideoItem.id);
          }
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleRotationDrag = (e: React.PointerEvent, targetItem: TimelineItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetItem) return;

    const handleContainer = e.currentTarget.parentElement;
    if (!handleContainer) return;
    const rect = handleContainer.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    const startAngle = calculatePointerAngle({ x: e.clientX, y: e.clientY }, center);
    const initialRotation = targetItem.properties?.rotation ?? 0;
    let currentRotation = initialRotation;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = calculatePointerAngle({ x: moveEvent.clientX, y: moveEvent.clientY }, center);
      currentRotation = calculateNormalizedAngleDelta(startAngle, currentAngle, initialRotation);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: targetItem.id,
          properties: { rotation: currentRotation }
        },
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      dispatch({
        type: 'UPDATE_PROPERTIES',
        payload: {
          id: targetItem.id,
          properties: { rotation: currentRotation }
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleGroupDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const initialPositions = editState.selection.map(id => {
      const item = editState.items.find(i => i.id === id);
      return { id, x: item?.properties?.x ?? 0, y: item?.properties?.y ?? 0 };
    });

    let currentDx = 0;
    let currentDy = 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      currentDx = rawDx / effectiveZoom;
      currentDy = rawDy / effectiveZoom;

      const batchPayload = initialPositions.map(pos => ({
        id: pos.id,
        properties: { x: Math.round(pos.x + currentDx), y: Math.round(pos.y + currentDy) }
      }));

      dispatch({
        type: 'BATCH_UPDATE_PROPERTIES',
        payload: batchPayload,
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      const batchPayload = initialPositions.map(pos => ({
        id: pos.id,
        properties: { x: Math.round(pos.x + currentDx), y: Math.round(pos.y + currentDy) }
      }));

      dispatch({
        type: 'BATCH_UPDATE_PROPERTIES',
        payload: batchPayload
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleGroupCornerDrag = (e: React.PointerEvent, corner: CornerQuadrant) => {
    e.preventDefault();
    e.stopPropagation();
    if (!groupBounds || editState.selection.length <= 1) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialGroupBounds = { ...groupBounds };

    // Capture immutable snapshot of initial item transforms
    const initialItems = editState.selection.map(id => {
      const item = editState.items.find(i => i.id === id);
      return {
        id,
        type: item?.type,
        x: item?.properties?.x ?? 0,
        y: item?.properties?.y ?? 0,
        scale: item?.properties?.scale ?? 100,
        fontSize: item?.properties?.fontSize ?? 32
      };
    });

    let currentBatchPayload: Array<{ id: string; properties: Record<string, any> }> = [];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rawDx = moveEvent.clientX - startX;
      const rawDy = moveEvent.clientY - startY;
      const canvasDx = rawDx / effectiveZoom;
      const canvasDy = rawDy / effectiveZoom;

      const newGroupBounds = calculateResizedGroupBounds(initialGroupBounds, corner, canvasDx, canvasDy);
      const groupScaleX = newGroupBounds.width / initialGroupBounds.width;
      const groupScaleY = newGroupBounds.height / initialGroupBounds.height;
      const groupScale = (groupScaleX + groupScaleY) / 2; // Uniform aspect-ratio scale

      currentBatchPayload = initialItems.map(init => {
        const newPos = scalePointRelativeToBounds({ x: init.x, y: init.y }, initialGroupBounds, newGroupBounds);
        const props: Record<string, any> = {
          x: Math.round(newPos.x),
          y: Math.round(newPos.y)
        };

        if (init.type === 'video') {
          props.scale = Math.min(Math.max(Math.round(init.scale * groupScale), 10), 400);
        } else if (init.type === 'text') {
          props.fontSize = Math.min(Math.max(Math.round(init.fontSize * groupScale), 10), 180);
        }

        return { id: init.id, properties: props };
      });

      dispatch({
        type: 'BATCH_UPDATE_PROPERTIES',
        payload: currentBatchPayload,
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (currentBatchPayload.length > 0) {
        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: currentBatchPayload
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleGroupRotationDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!groupBounds || editState.selection.length <= 1) return;

    const handleContainer = e.currentTarget.parentElement;
    if (!handleContainer) return;
    const rect = handleContainer.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    const startAngle = calculatePointerAngle({ x: e.clientX, y: e.clientY }, center);
    const groupCenter = { x: groupBounds.centerX, y: groupBounds.centerY };

    // Capture immutable snapshot of initial item positions and rotations
    const initialItems = editState.selection.map(id => {
      const item = editState.items.find(i => i.id === id);
      return {
        id,
        x: item?.properties?.x ?? 0,
        y: item?.properties?.y ?? 0,
        rotation: item?.properties?.rotation ?? 0
      };
    });

    let currentBatchPayload: Array<{ id: string; properties: Record<string, any> }> = [];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = calculatePointerAngle({ x: moveEvent.clientX, y: moveEvent.clientY }, center);
      const deltaAngle = calculateNormalizedAngleDelta(startAngle, currentAngle, 0);

      currentBatchPayload = initialItems.map(init => {
        // 1. Rotate item center around group center
        const rotatedPos = rotatePointAroundCenter({ x: init.x, y: init.y }, groupCenter, deltaAngle);

        // 2. Accumulate individual item rotation angle
        const newRotation = calculateNormalizedAngleDelta(0, deltaAngle, init.rotation);

        return {
          id: init.id,
          properties: {
            x: Math.round(rotatedPos.x),
            y: Math.round(rotatedPos.y),
            rotation: newRotation
          }
        };
      });

      dispatch({
        type: 'BATCH_UPDATE_PROPERTIES',
        payload: currentBatchPayload,
        meta: { isTransient: true }
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (currentBatchPayload.length > 0) {
        dispatch({
          type: 'BATCH_UPDATE_PROPERTIES',
          payload: currentBatchPayload
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Sync Preview with Timeline (Evaluates interpolated keyframe properties live)
  const activeVideoItem = editState.items.find(i => i.type === 'video' && currentTime >= i.start && currentTime <= i.end);
  const activeVideoProps = activeVideoItem ? evaluateInterpolatedProperties(activeVideoItem, currentTime) : {};
  const activeTimelineAsset = activeVideoItem ? assets.find((a: any) => a.id === activeVideoItem.assetId) : null;
  const resolvedAsset = activeTimelineAsset || activeAsset;
  
  const videoSrc = resolvedAsset?.previewUrl || (isPlayablePath(resolvedAsset?.storage_path) ? resolvedAsset?.storage_path : '');

  const activeFilter = generateCssFilter(activeVideoItem?.properties, selectedLutId);
  const selectedBgmUrl = mockMusic.find(m => m.id === selectedBgmId)?.url || '';

  let transitionFactor = 1.0;
  if (activeVideoItem) {
    const transitionIn = activeVideoItem.properties?.transitionIn;
    const transitionOut = activeVideoItem.properties?.transitionOut;

    if (transitionIn?.duration && (currentTime - activeVideoItem.start) < transitionIn.duration) {
      transitionFactor = Math.max(0, (currentTime - activeVideoItem.start) / transitionIn.duration);
    } else if (transitionOut?.duration && (activeVideoItem.end - currentTime) < transitionOut.duration) {
      transitionFactor = Math.max(0, (activeVideoItem.end - currentTime) / transitionOut.duration);
    }
  }

  const videoItemX = activeVideoProps?.x ?? 0;
  const videoItemY = activeVideoProps?.y ?? 0;
  const videoItemOpacity = (((activeVideoProps?.opacity ?? 100) > 1 ? (activeVideoProps?.opacity ?? 100) / 100 : (activeVideoProps?.opacity ?? 1.0))) * transitionFactor;
  const videoItemScale = (activeVideoProps?.scale ?? 100) / 100;
  const videoItemRotation = activeVideoProps?.rotation ?? 0;

  // Sync Audio Volumes (Combines global primary volume, per-item volume, track mute, and BGM auto-ducking)
  useEffect(() => {
    const primaryTrack = editState.tracks.find(t => t.id === 'track-audio-1' || t.id === 'track-video-1');
    const isPrimaryMuted = Boolean(primaryTrack?.muted);
    const fadeGain = activeVideoItem
      ? calculateFadeGain(
          currentTime,
          activeVideoItem.start,
          activeVideoItem.end,
          activeVideoItem.properties?.fadeInDuration,
          activeVideoItem.properties?.fadeOutDuration
        )
      : 1.0;

    const videoVolumeProp = activeVideoItem?.properties?.volume ?? 100;
    const primaryGain = calculateEffectiveVolume(
      videoVolumeProp,
      audioSettings.primaryVol,
      isPrimaryMuted,
      1.0,
      fadeGain
    );

    if (videoRef.current) {
      videoRef.current.volume = primaryGain;
      videoRef.current.muted = isPrimaryMuted || primaryGain <= 0;
      const targetSpeed = activeVideoItem?.properties?.speed ?? 1.0;
      if (Math.abs(videoRef.current.playbackRate - targetSpeed) > 0.01) {
        videoRef.current.playbackRate = targetSpeed;
      }
    }

    if (audioRef.current) {
      const bgmTrack = editState.tracks.find(t => t.id === 'track-bgm-1');
      const isBgmMuted = Boolean(bgmTrack?.muted);

      const primaryClips = editState.items.filter(i => (i.type === 'video' || i.type === 'audio') && i.trackId !== 'track-bgm-1');
      const duckingGain = audioSettings.autoDuck 
        ? calculateDuckingGain(currentTime, primaryClips)
        : 1.0;

      const bgmGain = calculateEffectiveVolume(
        100,
        audioSettings.bgmVol,
        isBgmMuted,
        duckingGain
      );

      audioRef.current.volume = bgmGain;
      audioRef.current.muted = isBgmMuted || bgmGain <= 0;
    }
  }, [currentTime, audioSettings, editState, activeVideoItem, videoRef, audioRef]);

  // Sync BGM Playback state with Video
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Handle Seek for BGM
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Object-fit decision: Default is 'cover' (as specified in specification diagram) unless explicitly set to 'fit'
  const videoObjectFit = previewZoom === 'fit' ? 'contain' : 'cover';

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'select') return;
    const canvasElement = e.currentTarget;
    if (e.target !== canvasElement && e.target !== frameRef.current) return;

    e.preventDefault();
    const rect = canvasElement.getBoundingClientRect();
    const canvasCenterX = rect.width / 2;
    const canvasCenterY = rect.height / 2;

    const startX = (e.clientX - rect.left - canvasCenterX) / effectiveZoom;
    const startY = (e.clientY - rect.top - canvasCenterY) / effectiveZoom;
    const isAdditive = e.shiftKey;

    let isMarqueeActive = false;
    let finalPreviewIds: string[] = [];

    const activeCanvasItems = editState.items.filter(item => currentTime >= item.start && currentTime <= item.end);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentX = (moveEvent.clientX - rect.left - canvasCenterX) / effectiveZoom;
      const currentY = (moveEvent.clientY - rect.top - canvasCenterY) / effectiveZoom;

      const rawDx = Math.abs(moveEvent.clientX - e.clientX);
      const rawDy = Math.abs(moveEvent.clientY - e.clientY);

      // Drag threshold (4px) prevents accidental marquee on static clicks
      if (rawDx > 4 || rawDy > 4) {
        isMarqueeActive = true;
      }

      if (isMarqueeActive) {
        const minX = Math.min(startX, currentX);
        const minY = Math.min(startY, currentY);
        const maxX = Math.max(startX, currentX);
        const maxY = Math.max(startY, currentY);

        const marqueeBox: BoundingBox = {
          minX,
          minY,
          maxX,
          maxY,
          width: Math.max(maxX - minX, 1),
          height: Math.max(maxY - minY, 1),
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
        };

        finalPreviewIds = getSelectionIntersection(marqueeBox, activeCanvasItems);

        setMarqueeState({
          start: { x: startX, y: startY },
          current: { x: currentX, y: currentY },
          previewIds: finalPreviewIds,
          additive: isAdditive,
          isActive: true
        });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (isMarqueeActive) {
        const committedSelection = isAdditive
          ? Array.from(new Set([...editState.selection, ...finalPreviewIds]))
          : finalPreviewIds;
        selectMultiple(committedSelection);
      } else {
        // Static click on empty space deselects
        clearSelection();
      }

      setMarqueeState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const activeTexts = editState.items.filter((item) => (item.type === 'text' || item.type === 'overlay') && currentTime >= item.start && currentTime <= item.end);
  const activeCaptionItem = editState.items.find((item) => item.type === 'caption' && currentTime >= item.start && currentTime <= item.end);

  const isVideoSelected = Boolean(activeVideoItem && editState.selection.includes(activeVideoItem.id));
  const isSingleVideoSelected = isVideoSelected && editState.selection.length === 1;

  // Calculate Combined Group Bounding Box Geometry for Multi-Selection
  const activeSelectedItems = editState.items.filter(item => 
    editState.selection.includes(item.id) && currentTime >= item.start && currentTime <= item.end
  );

  const groupBounds = editState.selection.length > 1 ? getGroupBounds(activeSelectedItems) : null;
  const hasGroupSelection = Boolean(groupBounds && editState.selection.length > 1);
  const groupMinX = groupBounds?.minX ?? 0;
  const groupMinY = groupBounds?.minY ?? 0;
  const groupWidth = groupBounds?.width ?? 0;
  const groupHeight = groupBounds?.height ?? 0;

  return (
    <div className="studio-preview-column" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', position: 'relative', padding: '0.4rem 0.75rem', overflow: 'hidden', width: '100%' }}>
      
      {/* Hidden BGM Audio Element */}
      {selectedBgmUrl && (
        <audio ref={audioRef} src={selectedBgmUrl} loop />
      )}

      {/* Top Platform Controls */}
      <div style={{ zIndex: 10, display: 'flex', gap: '1rem', background: 'var(--bg-surface)', padding: '0.3rem 0.85rem', borderRadius: '20px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', marginBottom: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Smartphone size={14} /> {platformPresets[platformPreset]?.label || 'Custom'}
        </span>
        <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
        <button onClick={() => setShowSafeGuides(!showSafeGuides)} style={{ background: 'transparent', border: 'none', color: showSafeGuides ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
          <Grid3X3 size={14} /> Safe Zones
        </button>
      </div>

      {/* PREVIEW AREA CONTAINER - Absolute Full Cover Spec */}
      <div 
        ref={frameRef}
        className="studio-preview-frame" 
        onPointerDown={handleCanvasPointerDown}
        style={{ 
          width: '100%', 
          flex: 1, 
          minHeight: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#070a11', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          position: 'relative', 
          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.15)', 
          border: '1px solid var(--border-subtle)',
          padding: 0
        }}
      >
        {/* COMPOSITION CANVAS CONTAINER - Full Width & Height Fill (No Letterboxing/Pillarboxing) */}
        <div 
          className="studio-canvas" 
          onPointerDown={handleCanvasPointerDown}
          style={{ 
            position: 'absolute',
            inset: 0,
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', 
            background: '#000', 
            transform: `scale(${previewZoom === 'fit' || previewZoom === 'fill' ? 1 : Number(previewZoom) / 100})`, 
            transition: 'transform 0.2s ease' 
          }}
        >
          {/* SOURCE VIDEO - object-fit: cover */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="studio-video"
              playsInline
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: videoObjectFit, 
                filter: activeFilter, 
                opacity: videoItemOpacity,
                transform: `translate(${videoItemX}px, ${videoItemY}px) rotate(${videoItemRotation}deg) scale(${videoScale * videoItemScale})`, 
                zIndex: activeVideoProps?.zIndex ?? 5,
                cursor: activeTool === 'select' ? 'pointer' : 'grab', 
                pointerEvents: 'auto', 
                transition: 'transform 0.05s linear, opacity 0.15s ease' 
              }}
              onPointerDown={handleVideoDragStart}
              onPointerEnter={() => setIsHoveringVideo(true)}
              onPointerLeave={() => setIsHoveringVideo(false)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => {
                const loadedDuration = event.currentTarget.duration;
                if (Number.isFinite(loadedDuration) && loadedDuration > 0) {
                  setDuration(loadedDuration);
                }
                setCurrentTime(event.currentTarget.currentTime || 0);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <div className="studio-video-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ImageIcon size={32} color="var(--accent-primary)" />
              </div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Drop or Select Media to Start</strong>
              <span style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--text-muted)', maxWidth: '220px' }}>Upload MP4 or MKV from the Assets panel to begin editing</span>
            </div>
          )}

          {/* Hover Outline (Subtle visual cue when hovering an unselected video) */}
          {videoSrc && isHoveringVideo && !isVideoSelected && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', transform: `translate(${videoItemX}px, ${videoItemY}px) rotate(${videoItemRotation}deg) scale(${videoScale * videoItemScale})`, opacity: videoItemOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '100%', border: '1.5px dashed rgba(99, 102, 241, 0.5)', position: 'relative' }} />
            </div>
          )}

          {/* Persistent Video Selection Bounding Box with Corner Handles & Rotation Handle Stem */}
          {videoSrc && isVideoSelected && activeVideoItem && (
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', transform: `translate(${videoItemX}px, ${videoItemY}px) rotate(${videoItemRotation}deg) scale(${videoScale * videoItemScale})`, opacity: videoItemOpacity, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15 }}>
               <div style={{ width: '100%', height: '100%', border: '2px solid var(--accent-primary)', boxShadow: '0 0 16px rgba(99, 102, 241, 0.25)', position: 'relative' }}>
                 {isSingleVideoSelected && (
                   <>
                     {/* Corner Handles */}
                     <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleVideoCornerDrag(e, 'top-left')} />
                     <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleVideoCornerDrag(e, 'top-right')} />
                     <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleVideoCornerDrag(e, 'bottom-left')} />
                     <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleVideoCornerDrag(e, 'bottom-right')} />
                     
                     {/* Top Rotation Handle Stem */}
                     <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '16px', background: 'var(--accent-primary)', pointerEvents: 'none' }} />
                     <div
                       style={{ position: 'absolute', top: '-34px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'grab', pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                       onPointerDown={(e) => handleRotationDrag(e, activeVideoItem)}
                       title={`Rotation: ${videoItemRotation}°`}
                     >
                       <RotateCw size={9} color="var(--accent-primary)" />
                     </div>
                   </>
                 )}
               </div>
             </div>
          )}

          {/* Safe Area Overlay */}
          {showSafeGuides && (
            <div style={{ position: 'absolute', inset: '10% 10% 20% 10%', border: '2px dashed rgba(255,255,255,0.4)', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Safe Area</span>
            </div>
          )}

          {/* Text Overlays with Persistent Selection Outline & Rotation Handle Stem */}
          {activeTexts.map((textItem) => {
            const isSelected = editState.selection.includes(textItem.id);
            const isSingleTextSelected = isSelected && editState.selection.length === 1;
            const props = evaluateInterpolatedProperties(textItem, currentTime);
            const textRot = props.rotation || 0;
            const textOpacity = typeof props.opacity === 'number' ? (props.opacity > 1 ? props.opacity / 100 : props.opacity) : 1.0;
            return (
              <div
                key={textItem.id}
                onPointerDown={(e) => handleTextPointerDown(e, textItem)}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${props.x || 0}px)`,
                  top: `calc(50% + ${props.y || 0}px)`,
                  transform: `translate(-50%, -50%) rotate(${textRot}deg)`,
                  opacity: textOpacity,
                  color: props.color || '#ffffff',
                  fontSize: `${props.fontSize || 32}px`,
                  fontWeight: 700,
                  cursor: activeTool === 'select' ? 'grab' : 'default',
                  border: isSelected ? '2px solid var(--accent-primary)' : '1px dashed transparent',
                  boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.35)' : 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  userSelect: 'none',
                  zIndex: props.zIndex ?? 20
                }}
              >
                {props.strokePoints && Array.isArray(props.strokePoints) && props.strokePoints.length > 0 ? (
                  <svg style={{ width: '160px', height: '100px', overflow: 'visible', pointerEvents: 'none' }}>
                    <path
                      d={`M ${props.strokePoints.map((pt: any) => `${pt.x + 80} ${pt.y + 50}`).join(' L ')}`}
                      stroke={props.strokeColor || '#ef4444'}
                      strokeWidth={props.strokeWidth || 6}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  textItem.content || textItem.label || 'Text Overlay'
                )}
                {isSingleTextSelected && (
                  <>
                    <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '10px', height: '10px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleTextCornerDrag(e, textItem, 'top-left')} />
                    <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '10px', height: '10px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleTextCornerDrag(e, textItem, 'top-right')} />
                    <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '10px', height: '10px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleTextCornerDrag(e, textItem, 'bottom-left')} />
                    <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '10px', height: '10px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleTextCornerDrag(e, textItem, 'bottom-right')} />
                    
                    {/* Top Rotation Handle Stem for Text */}
                    <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '12px', background: 'var(--accent-primary)', pointerEvents: 'none' }} />
                    <div
                      style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', width: '14px', height: '14px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'grab', pointerEvents: 'auto', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onPointerDown={(e) => handleRotationDrag(e, textItem)}
                      title={`Rotation: ${textRot}°`}
                    >
                      <RotateCw size={8} color="var(--accent-primary)" />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* ONE COMBINED GROUP BOUNDING BOX for Multi-Selection with 4 Group Corner Resize Handles */}
          {hasGroupSelection && groupBounds && (
            <div
              onPointerDown={handleGroupDragStart}
              style={{
                position: 'absolute',
                left: `calc(50% + ${groupMinX}px)`,
                top: `calc(50% + ${groupMinY}px)`,
                width: `${groupWidth}px`,
                height: `${groupHeight}px`,
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
                borderRadius: '4px',
                pointerEvents: 'auto',
                cursor: 'grab',
                zIndex: 30
              }}
            >
              <div style={{ position: 'absolute', top: '-26px', left: '0', background: 'var(--accent-primary)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', userSelect: 'none' }}>
                <Layers size={11} /> Group Selection ({editState.selection.length} items)
              </div>

              {/* Group Corner Resize Handles */}
              <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleGroupCornerDrag(e, 'top-left')} />
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleGroupCornerDrag(e, 'top-right')} />
              <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nesw-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleGroupCornerDrag(e, 'bottom-left')} />
              <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'nwse-resize', pointerEvents: 'auto' }} onPointerDown={(e) => handleGroupCornerDrag(e, 'bottom-right')} />

              {/* Group Top Rotation Handle Stem */}
              <div style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '16px', background: 'var(--accent-primary)', pointerEvents: 'none' }} />
              <div
                style={{ position: 'absolute', top: '-34px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '16px', background: '#fff', border: '2px solid var(--accent-primary)', borderRadius: '50%', cursor: 'grab', pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={handleGroupRotationDrag}
                title="Group Rotation"
              >
                <RotateCw size={9} color="var(--accent-primary)" />
              </div>
            </div>
          )}

          {/* Marquee Rubberband Selection Box */}
          {marqueeState && marqueeState.isActive && (
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${Math.min(marqueeState.start.x, marqueeState.current.x)}px)`,
                top: `calc(50% + ${Math.min(marqueeState.start.y, marqueeState.current.y)}px)`,
                width: `${Math.abs(marqueeState.current.x - marqueeState.start.x)}px`,
                height: `${Math.abs(marqueeState.current.y - marqueeState.start.y)}px`,
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1.5px dashed var(--accent-primary)',
                boxShadow: '0 0 14px rgba(99, 102, 241, 0.25)',
                borderRadius: '3px',
                pointerEvents: 'none',
                zIndex: 35
              }}
            >
              <div style={{ position: 'absolute', top: '-22px', left: '0', background: 'var(--accent-primary)', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '3px', whiteSpace: 'nowrap', fontWeight: 600, userSelect: 'none' }}>
                Marquee ({marqueeState.previewIds.length} selected)
              </div>
            </div>
          )}

          {/* Subtitle Overlay */}
          {captionStyle.burnIn && (
            <div className="studio-subtitle-overlay" style={{ position: 'absolute', bottom: captionStyle.position === 'bottom' ? '20%' : captionStyle.position === 'top' ? '80%' : '50%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', padding: '0 2rem', transform: 'translateY(50%)' }}>
              {(activeCaptionItem || activeCaption) && (
                <div style={{ display: 'inline-block', background: (activeCaptionItem?.properties?.preset || captionStyle.preset) === 'minimal' ? 'transparent' : 'rgba(0,0,0,0.6)', backdropFilter: (activeCaptionItem?.properties?.preset || captionStyle.preset) === 'minimal' ? 'none' : 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '8px', border: (activeCaptionItem?.properties?.preset || captionStyle.preset) === 'minimal' ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ color: activeCaptionItem?.properties?.color || captionStyle.color, fontFamily: brandKit.primaryFont?.family || 'Inter', fontSize: `${captionStyle.size}rem`, fontWeight: (activeCaptionItem?.properties?.preset || captionStyle.preset) === 'minimal' ? 500 : 800, textTransform: (activeCaptionItem?.properties?.preset || captionStyle.preset) === 'minimal' ? 'none' : 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {activeCaptionItem?.content || activeCaptionItem?.label || activeCaption?.text}
                  </span>
                </div>
              )}
            </div>
          )}

          {brandKit && (
            <div style={{
              position: 'absolute',
              zIndex: 25,
              pointerEvents: 'none',
              opacity: typeof brandKit.watermark === 'object' ? brandKit.watermark?.opacity ?? 0.8 : 0.8,
              ...(typeof brandKit.watermark === 'object' && brandKit.watermark?.position === 'top-left' ? { top: '16px', left: '16px' } :
                 typeof brandKit.watermark === 'object' && brandKit.watermark?.position === 'top-right' ? { top: '16px', right: '16px' } :
                 typeof brandKit.watermark === 'object' && brandKit.watermark?.position === 'bottom-left' ? { bottom: '16px', left: '16px' } :
                 { bottom: '16px', right: '16px' })
            }}>
              {typeof brandKit.watermark === 'object' && brandKit.watermark?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandKit.watermark.logoUrl} alt="Watermark" style={{ height: '24px', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: '#fff', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '0.3rem 0.65rem', fontFamily: brandKit.primaryFont?.family || 'Inter', fontSize: '0.7rem', fontWeight: 700, backdropFilter: 'blur(8px)' }}>
                  {brandKit.name || 'Made with KontentOS'}
                </span>
              )}
            </div>
          )}

          {/* Dynamic Center Alignment Guidelines Overlay */}
          {snapGuides?.x && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1.5px', borderLeft: '1.5px dashed var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)', pointerEvents: 'none', zIndex: 40 }} />
          )}
          {snapGuides?.y && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1.5px', borderTop: '1.5px dashed var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)', pointerEvents: 'none', zIndex: 40 }} />
          )}

        </div>
      </div>

      {/* Bottom Playback Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0, marginTop: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--bg-surface)', padding: '0.35rem 1.25rem', borderRadius: '30px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {formatTime(currentTime)} <span style={{color: 'var(--text-muted)', fontWeight: 400}}>/ {timelineDuration > 0 ? formatTime(timelineDuration) : '--:--'}</span>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => skip(-5)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronLeft size={18}/></button>
            <button onClick={togglePlay} style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)' }}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
            </button>
            <button onClick={() => skip(5)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><ChevronRight size={18}/></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
            <select value={previewZoom} onChange={(e) => setPreviewZoom(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                <option value="fit">Fit</option>
                <option value="fill">Fill</option>
                <option value="150">150%</option>
                <option value="100">100%</option>
                <option value="90">90%</option>
                <option value="75">75%</option>
                <option value="50">50%</option>
              </select>
            <button onClick={toggleFullscreen} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }} title="Toggle Fullscreen Preview (Esc to exit)">
              <Maximize size={16} color={isFullscreen ? 'var(--accent-primary)' : 'currentColor'} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
