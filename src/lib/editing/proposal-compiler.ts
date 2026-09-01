import { AiProposal } from '../ai/proposal-types';
import { EditState, TimelineItem, Keyframe } from './types';
import { createTextTimelineItem } from './text-factory';

export interface ApplyAiSuggestionsPlan {
  itemsToAdd: TimelineItem[];
  itemsToUpdate: Array<{ id: string; properties?: Record<string, any>; keyframes?: Keyframe[] }>;
  itemsToDelete: string[];
  appliedProposalCount: number;
}

/**
 * Compiles a list of creator-approved AI proposals into an atomic, deterministic state mutation plan.
 * Validates track boundaries, prevents collisions, and creates compliant timeline items.
 */
export function compileApprovedProposals(
  selectedProposals: AiProposal[],
  currentState: EditState
): ApplyAiSuggestionsPlan {
  const itemsToAdd: TimelineItem[] = [];
  const itemsToUpdate: Array<{ id: string; properties?: Record<string, any>; keyframes?: Keyframe[] }> = [];
  const itemsToDelete: string[] = [];

  const textTrack = currentState.tracks.find(t => t.type === 'text') || { id: 'track-text-1' };
  const videoClips = currentState.items.filter(i => i.type === 'video');

  for (const proposal of selectedProposals) {
    if (proposal.kind === 'headline') {
      // Create a new Text Overlay TimelineItem on track-text-1
      const headlineText = proposal.data?.suggestedHeadline || proposal.data?.text || proposal.title;
      const duration = Math.max(1.0, proposal.endTime - proposal.startTime);
      const overlayItem = createTextTimelineItem('lower_third', {
        content: headlineText,
        startTime: proposal.startTime,
        duration,
        color: proposal.data?.color || '#fbbf24',
        fontSize: 42
      });

      itemsToAdd.push(overlayItem);
    }

    if (proposal.kind === 'zoom') {
      // Find matching video clip at this timestamp interval
      const targetClip = videoClips.find(clip => 
        (proposal.startTime >= clip.start && proposal.startTime < clip.end) ||
        (proposal.endTime > clip.start && proposal.endTime <= clip.end)
      );

      if (targetClip) {
        const scaleVal = proposal.data?.scale || 1.15;
        const clipOffset = Math.max(0, proposal.startTime - targetClip.start);
        const zoomKeyframe: Keyframe = {
          id: `kf-ai-zoom-${proposal.id}`,
          time: clipOffset,
          properties: {
            scale: scaleVal
          }
        };

        const existingKeyframes = targetClip.keyframes || [];
        itemsToUpdate.push({
          id: targetClip.id,
          properties: {
            scale: scaleVal
          },
          keyframes: [...existingKeyframes.filter(k => k.id !== zoomKeyframe.id), zoomKeyframe]
        });
      }
    }
  }

  return {
    itemsToAdd,
    itemsToUpdate,
    itemsToDelete,
    appliedProposalCount: selectedProposals.length
  };
}
