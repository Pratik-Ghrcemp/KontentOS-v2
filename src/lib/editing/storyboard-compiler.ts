import { StoryboardPlan, StoryboardBeat } from '@/lib/ai/storyboard-types';
import { TimelineItem } from './types';

export interface ApplyStoryboardPlan {
  newItems: TimelineItem[];
  totalDuration: number;
  clearExisting?: boolean;
  planTitle?: string;
}

export interface StoryboardCompileOptions {
  append?: boolean;
  includeHeadlines?: boolean;
  includeCaptions?: boolean;
  targetVideoTrackId?: string;
  targetTextTrackId?: string;
}

/**
 * Phase 22C: Compiles approved storyboard beats into concrete, editable timeline items.
 * 
 * Safety Guarantee: This is a pure transformation function that produces an atomic payload
 * for timelineReducer. It NEVER mutates timeline state directly.
 */
export function compileApprovedStoryboard(
  plan: StoryboardPlan,
  selectedBeatIds: Set<string>,
  currentTimelineItems: TimelineItem[] = [],
  options: StoryboardCompileOptions = {}
): ApplyStoryboardPlan {
  if (!plan || !Array.isArray(plan.beats) || plan.beats.length === 0) {
    return {
      newItems: [],
      totalDuration: 0,
      clearExisting: false
    };
  }

  const selectedBeats = plan.beats.filter(b => selectedBeatIds.has(b.id));
  if (selectedBeats.length === 0) {
    return {
      newItems: [],
      totalDuration: 0,
      clearExisting: false
    };
  }

  const videoTrackId = options.targetVideoTrackId || 'track-video-1';
  const textTrackId = options.targetTextTrackId || 'track-text-1';
  const includeHeadlines = options.includeHeadlines !== false;
  const includeCaptions = options.includeCaptions !== false;

  let baseTime = 0;
  if (options.append && currentTimelineItems.length > 0) {
    baseTime = Math.max(...currentTimelineItems.map(i => i.end), 0);
  }

  const newItems: TimelineItem[] = [];
  let currentTime = baseTime;

  for (let i = 0; i < selectedBeats.length; i++) {
    const beat = selectedBeats[i];
    const beatDuration = Math.max(0.5, beat.estimatedDuration);
    const start = Number(currentTime.toFixed(2));
    const end = Number((start + beatDuration).toFixed(2));

    // 1. Video placeholder scene item
    const videoItem: TimelineItem = {
      id: `sb-scene-${beat.id}-${Date.now().toString(36)}`,
      trackId: videoTrackId,
      type: 'video',
      start,
      end,
      sourceIn: 0,
      sourceOut: beatDuration,
      label: `🎬 [${beat.role.toUpperCase()}] ${beat.title}`,
      content: beat.visualIntent,
      properties: {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        role: beat.role,
        brollKeywords: beat.brollKeywords,
        visualIntent: beat.visualIntent,
        transitionType: beat.transitionType || 'cut',
        soundCue: beat.soundCue
      }
    };
    newItems.push(videoItem);

    // 2. Headline text overlay (if available)
    if (includeHeadlines && beat.suggestedHeadline && beat.suggestedHeadline.trim().length > 0) {
      const headlineDuration = Math.min(Math.max(2.0, beatDuration * 0.75), beatDuration);
      const textItem: TimelineItem = {
        id: `sb-head-${beat.id}-${Date.now().toString(36)}`,
        trackId: textTrackId,
        type: 'text',
        start,
        end: Number((start + headlineDuration).toFixed(2)),
        label: beat.suggestedHeadline,
        content: beat.suggestedHeadline,
        properties: {
          fontSize: 42,
          fontWeight: 'bold',
          color: '#f59e0b',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          x: 0,
          y: -0.3, // Upper third
          preset: 'kinetic',
          animation: 'fade_zoom'
        }
      };
      newItems.push(textItem);
    }

    // 3. Spoken dialogue caption block (if available)
    if (includeCaptions && beat.spokenText && beat.spokenText.trim().length > 0) {
      const captionItem: TimelineItem = {
        id: `sb-cap-${beat.id}-${Date.now().toString(36)}`,
        trackId: textTrackId,
        type: 'caption',
        start,
        end,
        label: beat.spokenText.length > 30 ? `${beat.spokenText.slice(0, 27)}...` : beat.spokenText,
        content: beat.spokenText,
        properties: {
          fontSize: 32,
          fontWeight: '600',
          color: '#ffffff',
          backgroundColor: 'transparent',
          x: 0,
          y: 0.35, // Lower third
          preset: 'hormozi',
          burnIn: true
        }
      };
      newItems.push(captionItem);
    }

    currentTime += beatDuration;
  }

  const calculatedTotalDuration = Number(currentTime.toFixed(2));

  return {
    newItems,
    totalDuration: calculatedTotalDuration,
    clearExisting: !options.append,
    planTitle: plan.title
  };
}
