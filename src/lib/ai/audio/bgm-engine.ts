import { GeneratedAudioAsset, BgmRequest } from './types';
import { encodePcmToWav, synthesizeProceduralBgm } from './wav-synthesizer';

export async function generateBgmAudio(req: BgmRequest): Promise<GeneratedAudioAsset> {
  const mood = req.mood || 'energetic';
  const duration = Math.max(3.0, Math.min(180.0, req.targetDuration || 15.0));

  const samples = synthesizeProceduralBgm(mood, duration, 22050);
  const wavResult = encodePcmToWav(samples, 22050);

  const titleMap: Record<string, string> = {
    energetic: '🔥 High-Energy Viral Beat (128 BPM)',
    cinematic: '🎬 Epic Cinematic Orchestral Build (90 BPM)',
    chill: '☕ Lo-Fi Ambient Chill Groove (85 BPM)',
    corporate: '💼 Tech Enterprise Modern Pulse (115 BPM)',
    dramatic: '⚡ Dark Suspense Tension Pulse (75 BPM)'
  };

  const bpmMap: Record<string, number> = {
    energetic: 128,
    cinematic: 90,
    chill: 85,
    corporate: 115,
    dramatic: 75
  };

  const asset: GeneratedAudioAsset = {
    id: `bgm-${mood}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'bgm',
    title: titleMap[mood] || `🎵 BGM: ${mood.toUpperCase()}`,
    duration: wavResult.duration,
    audioUrl: wavResult.dataUri,
    waveformPeaks: wavResult.waveformPeaks,
    metadata: {
      bgmMood: mood,
      bpm: bpmMap[mood] || 120,
      duckingVolume: req.duckingVolume ?? 0.18,
      sampleRate: wavResult.sampleRate,
      format: 'wav',
      fileSizeBytes: wavResult.fileSizeBytes
    },
    createdAt: new Date().toISOString()
  };

  return asset;
}
