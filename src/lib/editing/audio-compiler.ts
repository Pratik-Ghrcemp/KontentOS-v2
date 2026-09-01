import { EditState, TimelineItem, Keyframe } from './types';
import { GeneratedAudioAsset } from '../ai/audio/types';

export interface DuckingPoint {
  time: number;
  volume: number; // Percentage (0 - 100) or decimal
}

export interface AudioCompilationResult {
  newItems: TimelineItem[];
  duckingKeyframes?: Keyframe[];
  summary: string;
}

export interface AudioCompilationOptions {
  enableDucking?: boolean;
  targetTrackId?: string;
  defaultBgmVolume?: number; // default 50%
  duckedBgmVolume?: number;  // default 18% (-14dB equivalent)
  attackTime?: number;       // default 0.2s
  releaseTime?: number;      // default 0.4s
}

/**
 * Pure helper function to generate speech-reactive ducking volume curve with smooth ramps.
 */
export function generateDuckingCurve(
  speechIntervals: Array<{ start: number; end: number }>,
  totalDuration: number,
  options: AudioCompilationOptions = {}
): Keyframe[] {
  const normalVol = options.defaultBgmVolume ?? 50;
  const duckedVol = options.duckedBgmVolume ?? 18;
  const attack = options.attackTime ?? 0.2;
  const release = options.releaseTime ?? 0.4;

  if (speechIntervals.length === 0 || totalDuration <= 0) {
    return [
      { id: 'duck-0', time: 0, properties: { volume: normalVol } },
      { id: 'duck-end', time: Number(totalDuration.toFixed(2)), properties: { volume: normalVol } }
    ];
  }

  const keyframes: Keyframe[] = [];
  let kfIndex = 0;

  // Initial keyframe at t=0
  keyframes.push({
    id: `kf-duck-${kfIndex++}`,
    time: 0,
    properties: { volume: speechIntervals[0].start <= 0.1 ? duckedVol : normalVol }
  });

  speechIntervals.forEach((interval) => {
    const rampStart = Math.max(0, interval.start - attack);
    const rampEnd = Math.min(totalDuration, interval.end + release);

    // 1. Point before ducking ramp begins
    if (rampStart > 0.05 && (!keyframes.length || keyframes[keyframes.length - 1].time < rampStart - 0.05)) {
      keyframes.push({
        id: `kf-duck-${kfIndex++}`,
        time: Number(rampStart.toFixed(2)),
        properties: { volume: normalVol }
      });
    }

    // 2. Ducked volume reached at speech start
    keyframes.push({
      id: `kf-duck-${kfIndex++}`,
      time: Number(interval.start.toFixed(2)),
      properties: { volume: duckedVol }
    });

    // 3. Ducked volume sustained until speech end
    keyframes.push({
      id: `kf-duck-${kfIndex++}`,
      time: Number(interval.end.toFixed(2)),
      properties: { volume: duckedVol }
    });

    // 4. Volume restored after release ramp
    if (rampEnd < totalDuration) {
      keyframes.push({
        id: `kf-duck-${kfIndex++}`,
        time: Number(rampEnd.toFixed(2)),
        properties: { volume: normalVol }
      });
    }
  });

  // Ensure trailing keyframe at total duration
  if (keyframes[keyframes.length - 1].time < totalDuration) {
    keyframes.push({
      id: `kf-duck-${kfIndex++}`,
      time: Number(totalDuration.toFixed(2)),
      properties: { volume: normalVol }
    });
  }

  return keyframes;
}

/**
 * Pure compiler that transforms approved GeneratedAudioAsset objects into canonical TimelineItems.
 */
export function compileApprovedAudioAssets(
  approvedAssets: GeneratedAudioAsset[],
  currentEditState: EditState,
  options: AudioCompilationOptions = {}
): AudioCompilationResult {
  const targetTrack = options.targetTrackId || 'track-audio-1';
  const totalProjectDuration = Math.max(
    currentEditState.duration || 0,
    ...approvedAssets.map(a => a.duration),
    10
  );

  const newItems: TimelineItem[] = [];
  const speechIntervals: Array<{ start: number; end: number }> = [];

  // 1. Separate by type
  const voiceovers = approvedAssets.filter(a => a.type === 'voiceover');
  const sfxItems = approvedAssets.filter(a => a.type === 'sfx');
  const bgmItems = approvedAssets.filter(a => a.type === 'bgm');

  // 2. Place Voiceovers (Cascaded sequentially or at start)
  let currentVoiceCursor = 0;
  voiceovers.forEach((vo, idx) => {
    const voStart = currentVoiceCursor;
    const voEnd = voStart + vo.duration;

    const item: TimelineItem = {
      id: `audio-vo-${vo.id}`,
      trackId: targetTrack,
      type: 'audio',
      start: Number(voStart.toFixed(2)),
      end: Number(voEnd.toFixed(2)),
      assetId: vo.audioUrl,
      label: `🎙️ Voiceover: ${vo.title}`,
      properties: {
        volume: 100,
        audioType: 'voiceover',
        waveformPeaks: vo.waveformPeaks,
        speed: vo.metadata.speed || 1.0,
        pitch: vo.metadata.pitch || 1.0,
        format: vo.metadata.format || 'wav',
        fadeInDuration: 0.05,
        fadeOutDuration: 0.1
      }
    };

    newItems.push(item);
    speechIntervals.push({ start: voStart, end: voEnd });
    currentVoiceCursor = voEnd + 0.5; // 0.5s pause between voiceover tracks
  });

  // 3. Place SFX Cues (Placed at intelligent cue points or 2s intervals)
  sfxItems.forEach((sfx, idx) => {
    const sfxStart = idx === 0 ? 0 : Number((idx * 2.5).toFixed(2));
    const sfxEnd = Number((sfxStart + sfx.duration).toFixed(2));

    const item: TimelineItem = {
      id: `audio-sfx-${sfx.id}`,
      trackId: targetTrack,
      type: 'audio',
      start: sfxStart,
      end: sfxEnd,
      assetId: sfx.audioUrl,
      label: `⚡ SFX: ${sfx.title}`,
      properties: {
        volume: 90,
        audioType: 'sfx',
        waveformPeaks: sfx.waveformPeaks,
        format: sfx.metadata.format || 'wav',
        fadeInDuration: 0.02,
        fadeOutDuration: 0.05
      }
    };

    newItems.push(item);
  });

  // 4. Place BGM Items (Spanning project duration with ducking keyframes if enabled)
  bgmItems.forEach((bgm, idx) => {
    const bgmStart = 0;
    const bgmEnd = Math.max(totalProjectDuration, bgm.duration);

    const duckingKfs = (options.enableDucking !== false && speechIntervals.length > 0)
      ? generateDuckingCurve(speechIntervals, bgmEnd, options)
      : [];

    const item: TimelineItem = {
      id: `audio-bgm-${bgm.id}`,
      trackId: targetTrack,
      type: 'audio',
      start: bgmStart,
      end: bgmEnd,
      assetId: bgm.audioUrl,
      label: `🎵 BGM: ${bgm.title}`,
      keyframes: duckingKfs.length > 0 ? duckingKfs : undefined,
      properties: {
        volume: options.defaultBgmVolume ?? 50,
        audioType: 'bgm',
        waveformPeaks: bgm.waveformPeaks,
        format: bgm.metadata.format || 'wav',
        fadeInDuration: 0.5,
        fadeOutDuration: 1.0,
        autoDuck: options.enableDucking !== false
      }
    };

    newItems.push(item);
  });

  return {
    newItems,
    summary: `Compiled ${newItems.length} audio items (${voiceovers.length} voiceover, ${sfxItems.length} SFX, ${bgmItems.length} BGM) with ${speechIntervals.length} ducking speech intervals.`
  };
}
