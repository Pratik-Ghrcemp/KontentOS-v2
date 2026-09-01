import { VisualAssetProposal, AspectRatio, FitMode, KenBurnsConfig } from '../ai/visual/types';
import { TimelineItem, EditState, TrackType } from './types';

export interface VisualCompileOptions {
  enableKenBurns?: boolean;
  defaultPlacementMode?: 'overlay' | 'insert';
  trackVideoId?: string;
  trackTextId?: string;
}

export interface VisualCompileResult {
  newItems: TimelineItem[];
  updatedDuration: number;
  approvedProposalIds: string[];
}

/**
 * Pure generator for deterministic Ken Burns keyframes.
 */
export function generateKenBurnsKeyframes(
  kenBurns: KenBurnsConfig,
  duration: number
): Array<{ id: string; time: number; properties: { scale: number; x: number; y: number; opacity?: number } }> {
  const startScale = kenBurns.startScale || 100;
  const endScale = kenBurns.endScale || 115;
  const startX = kenBurns.startX || 0;
  const endX = kenBurns.endX || 0;
  const startY = kenBurns.startY || 0;
  const endY = kenBurns.endY || 0;

  return [
    {
      id: `kf-start-${Math.random().toString(36).substr(2, 9)}`,
      time: 0.0,
      properties: {
        scale: startScale,
        x: startX,
        y: startY,
        opacity: 100
      }
    },
    {
      id: `kf-end-${Math.random().toString(36).substr(2, 9)}`,
      time: Number(duration.toFixed(2)),
      properties: {
        scale: endScale,
        x: endX,
        y: endY,
        opacity: 100
      }
    }
  ];
}

/**
 * Pure compiler that converts approved visual proposals into canonical TimelineItem instances.
 */
export function compileApprovedVisualAssets(
  proposals: VisualAssetProposal[],
  editState: EditState,
  options: VisualCompileOptions = {}
): VisualCompileResult {
  const enableKenBurns = options.enableKenBurns ?? true;
  const trackVideoId = options.trackVideoId || 'track-video-1';
  const trackTextId = options.trackTextId || 'track-text-1';

  const newItems: TimelineItem[] = [];
  const approvedProposalIds: string[] = [];
  let maxEndTime = editState.duration;

  proposals.forEach((proposal, idx) => {
    const startTime = Number(proposal.suggestedStartTime ?? 0);
    const duration = Number(proposal.suggestedDuration ?? 4.0);
    const endTime = Number((startTime + duration).toFixed(2));

    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }

    const isTextTrack = proposal.type === 'kinetic_title';
    const trackId = isTextTrack ? trackTextId : trackVideoId;
    const type: TrackType = isTextTrack ? 'text' : 'video';

    // Build deterministic Ken Burns keyframes
    const keyframes = enableKenBurns ? generateKenBurnsKeyframes(proposal.kenBurns, duration) : [];

    const item: TimelineItem = {
      id: `visual-${proposal.type}-${idx + 1}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      trackId,
      type,
      start: startTime,
      end: endTime,
      sourceIn: 0,
      sourceOut: duration,
      label: proposal.title,
      content: proposal.title,
      assetId: proposal.sourcePathOrData,
      properties: {
        opacity: 100,
        scale: 100,
        x: 0,
        y: 0,
        rotation: 0,
        zIndex: isTextTrack ? 20 : 10,
        fitMode: proposal.fitMode || 'cover',
        aspectRatio: proposal.aspectRatio || '9:16',
        kenBurns: enableKenBurns ? proposal.kenBurns : undefined,
        keyframes: keyframes.length > 0 ? keyframes : undefined,
        sourceType: proposal.type,
        isProcedural: proposal.previewUrl?.startsWith('data:image/svg+xml')
      }
    };

    newItems.push(item);
    approvedProposalIds.push(proposal.id);
  });

  return {
    newItems,
    updatedDuration: Number(maxEndTime.toFixed(2)),
    approvedProposalIds
  };
}
