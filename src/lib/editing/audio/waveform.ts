import { WaveformData } from './types';

/**
 * Pure utility to extract normalized amplitude peaks from an AudioBuffer.
 */
export function extractPeaksFromAudioBuffer(audioBuffer: AudioBuffer, numSamples = 100): WaveformData {
  const channelData = audioBuffer.getChannelData(0);
  const sampleSize = Math.floor(channelData.length / numSamples);
  const peaks: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const start = i * sampleSize;
    let max = 0;
    for (let j = 0; j < sampleSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  // Normalize peaks to 0.0 - 1.0 range
  const maxPeak = Math.max(...peaks, 0.001);
  const normalizedPeaks = peaks.map(p => p / maxPeak);

  return {
    peaks: normalizedPeaks,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration
  };
}

/**
 * Pure fallback waveform peak generator when Web Audio decoding is unavailable.
 */
export function generateFallbackPeaks(numSamples = 60, seed = 42): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    const pseudoRandom = Math.abs(Math.sin((i + 1) * seed * 9999));
    const envelope = Math.sin((i / numSamples) * Math.PI);
    const peak = Math.max(0.15, (0.3 + 0.7 * pseudoRandom) * envelope);
    peaks.push(Number(peak.toFixed(3)));
  }
  return peaks;
}
