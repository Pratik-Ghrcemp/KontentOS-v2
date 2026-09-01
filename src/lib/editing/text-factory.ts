import { TimelineItem } from './types';
import { CaptionSegment } from '@/components/tabs/raw-studio/types';

export interface TextItemOptions {
  content?: string;
  startTime?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  x?: number;
  y?: number;
}

/**
 * Pure factory function to create a Text Overlay TimelineItem.
 */
export function createTextTimelineItem(
  type: 'title' | 'lower_third' | 'standard' = 'standard',
  options: TextItemOptions = {}
): TimelineItem {
  const clipId = `text-${crypto.randomUUID()}`;
  const start = Math.max(0, options.startTime ?? 0);
  const duration = options.duration ?? 3.0;
  const end = start + duration;

  let defaultContent = 'New Text';
  let defaultFontSize = 36;
  let defaultY = 0;

  if (type === 'title') {
    defaultContent = 'MAIN TITLE';
    defaultFontSize = 52;
    defaultY = -100;
  } else if (type === 'lower_third') {
    defaultContent = 'Speaker Name | Title';
    defaultFontSize = 28;
    defaultY = 220;
  }

  const content = options.content || defaultContent;
  const fontSize = options.fontSize || defaultFontSize;
  const color = options.color || '#ffffff';
  const fontFamily = options.fontFamily || 'Inter';
  const x = options.x ?? 0;
  const y = options.y ?? defaultY;

  return {
    id: clipId,
    trackId: 'track-text-1',
    type: 'text',
    start,
    end,
    sourceIn: 0,
    sourceOut: duration,
    label: content,
    content,
    properties: {
      text: content,
      x,
      y,
      scale: 100,
      rotation: 0,
      opacity: 100,
      fontSize,
      color,
      fontFamily,
      fontWeight: '600',
      alignment: 'center'
    }
  };
}

/**
 * Pure factory function to convert an array of CaptionSegments into Subtitle TimelineItems.
 */
export function createCaptionTimelineItems(
  segments: Array<{ id?: string; text: string; start_time: number; end_time: number; style?: string }>,
  preset = 'hormozi'
): TimelineItem[] {
  const isHormozi = preset === 'hormozi';
  const isNeon = preset === 'neon';
  const isMinimal = preset === 'minimal';

  const defaultColor = isHormozi ? '#facc15' : (isNeon ? '#06b6d4' : '#ffffff');
  const defaultFontSize = isHormozi ? 48 : (isNeon ? 44 : 36);
  const defaultBg = isNeon ? '#06b6d4' : '#000000';
  const defaultBgOpacity = isMinimal ? 0 : (isNeon ? 0.3 : (isHormozi ? 0.85 : 0.7));

  return segments.map((seg, idx) => ({
    id: `caption-${seg.id || idx}-${crypto.randomUUID()}`,
    trackId: 'track-text-1',
    type: 'caption',
    start: seg.start_time,
    end: seg.end_time,
    sourceIn: 0,
    sourceOut: Math.max(0.2, seg.end_time - seg.start_time),
    label: `Caption: ${seg.text.slice(0, 20)}`,
    content: seg.text,
    properties: {
      x: 0,
      y: 180,
      scale: 100,
      rotation: 0,
      opacity: 100,
      preset,
      fontSize: defaultFontSize,
      color: defaultColor,
      fontColor: defaultColor,
      backgroundColor: defaultBg,
      backgroundOpacity: defaultBgOpacity,
      highlightColor: '#f59e0b',
      fontFamily: 'Inter',
      fontWeight: '700'
    }
  }));
}
