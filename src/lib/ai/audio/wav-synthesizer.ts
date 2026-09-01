export interface SynthesizedWavResult {
  buffer: Buffer;
  base64: string;
  dataUri: string;
  duration: number;
  sampleRate: number;
  fileSizeBytes: number;
  waveformPeaks: number[];
}

/**
 * Creates a standard 16-bit PCM Mono RIFF WAV file from an array of float samples [-1.0 ... 1.0].
 */
export function encodePcmToWav(samples: Float32Array, sampleRate: number = 22050): SynthesizedWavResult {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const buffer = Buffer.alloc(bufferSize);

  // 1. RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 2. fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16)

  // 3. data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  const base64 = buffer.toString('base64');
  const dataUri = `data:audio/wav;base64,${base64}`;
  const duration = Number((samples.length / sampleRate).toFixed(2));
  const waveformPeaks = extractWaveformPeaks(samples, 50);

  return {
    buffer,
    base64,
    dataUri,
    duration,
    sampleRate,
    fileSizeBytes: bufferSize,
    waveformPeaks
  };
}

/**
 * Downsamples PCM samples into an array of normalized peak heights (0.05 to 1.0) for UI waveforms.
 */
export function extractWaveformPeaks(samples: Float32Array, numBars: number = 50): number[] {
  if (!samples || samples.length === 0) {
    return Array(numBars).fill(0.1);
  }

  const blockSize = Math.floor(samples.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, samples.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j]);
      if (abs > max) max = abs;
    }
    // Floor at 0.08 for visual appeal in audio deck
    peaks.push(Number(Math.max(0.08, Math.min(1.0, max)).toFixed(2)));
  }

  return peaks;
}

/**
 * Procedural SFX Generators using mathematical DSP waveforms.
 */
export function synthesizeProceduralSfx(cue: string, durationSec: number = 1.0, sampleRate: number = 22050): Float32Array {
  const numSamples = Math.floor(sampleRate * Math.max(0.2, Math.min(5.0, durationSec)));
  const samples = new Float32Array(numSamples);

  switch (cue.toLowerCase()) {
    case 'whoosh': {
      // Low-pass filtered noise with bell-shaped amplitude envelope and downward pitch sweep
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples; // 0..1
        const envelope = Math.sin(Math.PI * t); // smooth bell
        const noise = (Math.random() * 2 - 1) * 0.7;
        const toneFreq = 400 * Math.pow(0.25, t); // 400Hz -> 100Hz
        const tone = Math.sin(2 * Math.PI * toneFreq * (i / sampleRate)) * 0.3;
        samples[i] = (noise + tone) * envelope * 0.9;
      }
      break;
    }

    case 'impact': {
      // Punchy sub-bass drop (120Hz -> 35Hz) + short noise burst at transient start
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const decay = Math.exp(-6 * t);
        const transient = Math.exp(-25 * t) * (Math.random() * 2 - 1) * 0.6;
        const freq = 120 * Math.pow(0.3, t); // 120Hz -> 36Hz
        const sub = Math.sin(2 * Math.PI * freq * (i / sampleRate));
        samples[i] = (sub * 0.8 + transient) * decay;
      }
      break;
    }

    case 'glitch': {
      // Rapid square wave bursts with modulated pitch & random bit-crushing
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const step = Math.floor(t * 16);
        const freq = 300 + (step % 5) * 220 + (Math.random() > 0.8 ? 800 : 0);
        const square = Math.sin(2 * Math.PI * freq * (i / sampleRate)) > 0 ? 0.7 : -0.7;
        const burst = (i % 200 < 120) ? 1.0 : 0.1;
        samples[i] = square * burst * (1 - t * 0.5);
      }
      break;
    }

    case 'sub_drop': {
      // Deep sub-harmonic sine wave gliding down from 90Hz to 25Hz
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const freq = 90 * Math.pow(0.28, t);
        const env = Math.exp(-3 * t);
        samples[i] = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * env * 0.95;
      }
      break;
    }

    case 'riser': {
      // Linear pitch upward sweep from 120Hz to 1400Hz with exponential crescendo
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const freq = 120 + 1280 * (t * t);
        const crescendo = Math.pow(t, 1.5) * 0.85 + 0.05;
        const noise = (Math.random() * 2 - 1) * 0.15 * t;
        samples[i] = (Math.sin(2 * Math.PI * freq * (i / sampleRate)) * 0.8 + noise) * crescendo;
      }
      break;
    }

    case 'bell':
    case 'notification': {
      // Dual harmonic pure sine chime (880Hz A5 + 1760Hz A6 + 2640Hz) with gentle exponential decay
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const decay = Math.exp(-4.5 * t);
        const f1 = Math.sin(2 * Math.PI * 880 * (i / sampleRate)) * 0.5;
        const f2 = Math.sin(2 * Math.PI * 1760 * (i / sampleRate)) * 0.3;
        const f3 = Math.sin(2 * Math.PI * 2640 * (i / sampleRate)) * 0.15;
        samples[i] = (f1 + f2 + f3) * decay;
      }
      break;
    }

    default: {
      // Generic subtle transition blip
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const decay = Math.exp(-5 * t);
        samples[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * decay * 0.7;
      }
      break;
    }
  }

  return samples;
}

/**
 * Procedural BGM Harmonic Generator.
 * Composes chord progression harmonic loops matched to video mood and target duration.
 */
export function synthesizeProceduralBgm(
  mood: string,
  targetDurationSec: number = 15.0,
  sampleRate: number = 22050
): Float32Array {
  const duration = Math.max(3.0, Math.min(180.0, targetDurationSec));
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  // Mood configuration: Base Root Hz, Chord Progression Semitones, BPM
  let rootHz = 220; // A3
  let progression = [0, 5, 7, 3]; // I - IV - V - vi
  let bpm = 120;

  switch (mood.toLowerCase()) {
    case 'energetic':
      rootHz = 261.63; // C4
      progression = [0, 7, 9, 5]; // C - G - Am - F
      bpm = 128;
      break;
    case 'cinematic':
      rootHz = 196.00; // G3
      progression = [0, 3, 7, 8]; // Gm - Bb - Dm - Eb
      bpm = 90;
      break;
    case 'chill':
      rootHz = 220.00; // A3
      progression = [0, 4, 7, 11]; // Amaj7 - Dmaj7
      bpm = 85;
      break;
    case 'corporate':
      rootHz = 246.94; // B3
      progression = [0, 5, 7, 0]; // E - A - B - E
      bpm = 115;
      break;
    case 'dramatic':
      rootHz = 164.81; // E3
      progression = [0, 1, 5, 7]; // Em - F - Am - Bm
      bpm = 75;
      break;
  }

  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  for (let i = 0; i < numSamples; i++) {
    const timeSec = i / sampleRate;
    const barIndex = Math.floor(timeSec / barSec) % progression.length;
    const semitone = progression[barIndex];
    const chordFreq = rootHz * Math.pow(2, semitone / 12);

    // Harmonic voices (Root + Fifth + Octave)
    const v1 = Math.sin(2 * Math.PI * chordFreq * timeSec) * 0.35;
    const v2 = Math.sin(2 * Math.PI * (chordFreq * 1.5) * timeSec) * 0.2;
    const v3 = Math.sin(2 * Math.PI * (chordFreq * 2) * timeSec) * 0.1;

    // Rhythmic pulse / beat accent on downbeats
    const beatPos = (timeSec % beatSec) / beatSec;
    const pulse = Math.exp(-8 * beatPos) * 0.2;

    // Gentle fade in (first 1s) and fade out (last 1.5s)
    const fadeIn = Math.min(1.0, timeSec / 1.0);
    const fadeOut = Math.min(1.0, (duration - timeSec) / 1.5);
    const masterEnv = fadeIn * Math.max(0, fadeOut);

    samples[i] = (v1 + v2 + v3 + pulse) * masterEnv * 0.65;
  }

  return samples;
}

/**
 * Synthetic Voiceover Cadence Generator.
 * Generates spoken voice frequency modulation corresponding to sentence syllables and WPM.
 */
export function synthesizeSpeechCadence(
  text: string,
  wordsPerMinute: number = 150,
  pitchMultiplier: number = 1.0,
  sampleRate: number = 22050
): Float32Array {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const calculatedDurationSec = Math.max(1.0, Number(((wordCount / wordsPerMinute) * 60).toFixed(2)));
  const numSamples = Math.floor(sampleRate * calculatedDurationSec);
  const samples = new Float32Array(numSamples);

  const basePitchHz = 160 * pitchMultiplier; // Natural speaking pitch range
  const avgSyllableDuration = calculatedDurationSec / (wordCount * 1.6);

  for (let i = 0; i < numSamples; i++) {
    const timeSec = i / sampleRate;
    const wordProgress = (timeSec / calculatedDurationSec) * wordCount;
    const syllableIndex = Math.floor(timeSec / avgSyllableDuration);

    // Syllable pitch fluctuation
    const inflection = Math.sin(syllableIndex * 2.2) * 25;
    const currentFreq = basePitchHz + inflection;

    // Syllable amplitude envelope (pulse-shaped speaking cadence)
    const syllableTime = (timeSec % avgSyllableDuration) / avgSyllableDuration;
    const envelope = Math.sin(Math.PI * syllableTime);

    // Formant harmonics (f0 + f1 + f2)
    const f0 = Math.sin(2 * Math.PI * currentFreq * timeSec) * 0.4;
    const f1 = Math.sin(2 * Math.PI * (currentFreq * 2.1) * timeSec) * 0.25;
    const f2 = Math.sin(2 * Math.PI * (currentFreq * 3.2) * timeSec) * 0.15;
    const breath = (Math.random() * 2 - 1) * 0.05;

    // Micro-pauses between words
    const isPause = (wordProgress % 1.0) > 0.88;
    const pauseFactor = isPause ? 0.05 : 1.0;

    samples[i] = (f0 + f1 + f2 + breath) * envelope * pauseFactor * 0.8;
  }

  return samples;
}
