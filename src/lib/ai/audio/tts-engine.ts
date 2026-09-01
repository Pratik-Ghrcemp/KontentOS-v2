import { GeneratedAudioAsset, TtsRequest } from './types';
import { encodePcmToWav, synthesizeSpeechCadence } from './wav-synthesizer';

export interface BaseTtsProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  generateSpeech(req: TtsRequest): Promise<GeneratedAudioAsset>;
}

export class LocalDeterministicTtsProvider implements BaseTtsProvider {
  id = 'local-synthetic';
  name = 'Local Synthetic Speech Engine';

  async isAvailable(): Promise<boolean> {
    return true; // Always available offline
  }

  async generateSpeech(req: TtsRequest): Promise<GeneratedAudioAsset> {
    const text = req.text.trim();
    const wpm = req.wordsPerMinute || 150;
    const speed = req.speed || 1.0;
    const pitch = req.pitch || 1.0;
    const effectiveWpm = Math.max(80, Math.min(260, Math.round(wpm * speed)));

    const samples = synthesizeSpeechCadence(text, effectiveWpm, pitch, 22050);
    const wavResult = encodePcmToWav(samples, 22050);

    const asset: GeneratedAudioAsset = {
      id: `vo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'voiceover',
      title: text.length > 32 ? `${text.slice(0, 29)}...` : text,
      duration: wavResult.duration,
      audioUrl: wavResult.dataUri,
      waveformPeaks: wavResult.waveformPeaks,
      metadata: {
        voiceId: req.voiceId || 'natural-echo',
        tone: req.style || 'natural',
        speed,
        pitch,
        wordsPerMinute: effectiveWpm,
        sampleRate: wavResult.sampleRate,
        format: 'wav',
        fileSizeBytes: wavResult.fileSizeBytes
      },
      createdAt: new Date().toISOString()
    };

    return asset;
  }
}

export class OpenAiTtsProvider implements BaseTtsProvider {
  id = 'openai-tts';
  name = 'OpenAI TTS (Cloud)';

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async generateSpeech(req: TtsRequest): Promise<GeneratedAudioAsset> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to local deterministic provider
      const fallback = new LocalDeterministicTtsProvider();
      return fallback.generateSpeech(req);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: req.text,
          voice: req.voiceId || 'alloy',
          speed: req.speed || 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS returned HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUri = `data:audio/mp3;base64,${base64}`;
      const words = req.text.trim().split(/\s+/).length;
      const estimatedDuration = Number(((words / (req.wordsPerMinute || 150)) * 60).toFixed(2));

      return {
        id: `vo-openai-${Date.now().toString(36)}`,
        type: 'voiceover',
        title: req.text.slice(0, 30),
        duration: estimatedDuration,
        audioUrl: dataUri,
        waveformPeaks: Array(50).fill(0.6).map(() => Number((0.2 + Math.random() * 0.7).toFixed(2))),
        metadata: {
          voiceId: req.voiceId || 'alloy',
          provider: 'openai',
          sampleRate: 24000,
          format: 'mp3',
          fileSizeBytes: buffer.length
        },
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('OpenAI TTS failed, falling back to local synthesizer:', err);
      const fallback = new LocalDeterministicTtsProvider();
      return fallback.generateSpeech(req);
    }
  }
}

/**
 * Main TTS Generator Entry Point with automatic provider selection and fallback.
 */
export async function generateTtsAudio(req: TtsRequest): Promise<GeneratedAudioAsset> {
  if (!req.text || req.text.trim().length === 0) {
    throw new Error('TTS text cannot be empty.');
  }

  if (req.preferredProvider === 'openai') {
    const openAiProvider = new OpenAiTtsProvider();
    if (await openAiProvider.isAvailable()) {
      return openAiProvider.generateSpeech(req);
    }
  }

  const localProvider = new LocalDeterministicTtsProvider();
  return localProvider.generateSpeech(req);
}
