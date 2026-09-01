import { GeneratedAudioAsset, SfxRequest } from './types';
import { encodePcmToWav, synthesizeProceduralSfx } from './wav-synthesizer';

export async function generateSfxAudio(req: SfxRequest): Promise<GeneratedAudioAsset> {
  const cue = req.cue.toLowerCase().trim() || 'whoosh';
  const duration = Math.max(0.2, Math.min(5.0, req.duration || 0.85));

  const samples = synthesizeProceduralSfx(cue, duration, 22050);
  const wavResult = encodePcmToWav(samples, 22050);

  const titleMap: Record<string, string> = {
    whoosh: '⚡ Dynamic Whoosh Transition',
    impact: '💥 Deep Cinematic Impact',
    glitch: '👾 Digital Glitch Hit',
    sub_drop: '🔊 Sub-Bass Frequency Drop',
    riser: '📈 Dramatic Pitch Riser',
    bell: '🔔 Crystal Notification Bell',
    notification: '💬 Social Alert Chime'
  };

  const asset: GeneratedAudioAsset = {
    id: `sfx-${cue}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'sfx',
    title: titleMap[cue] || `⚡ SFX: ${cue.toUpperCase()}`,
    duration: wavResult.duration,
    audioUrl: wavResult.dataUri,
    waveformPeaks: wavResult.waveformPeaks,
    metadata: {
      sfxCue: cue,
      intensity: req.intensity ?? 0.8,
      variation: req.variation || 'cinematic',
      sampleRate: wavResult.sampleRate,
      format: 'wav',
      fileSizeBytes: wavResult.fileSizeBytes
    },
    createdAt: new Date().toISOString()
  };

  return asset;
}
