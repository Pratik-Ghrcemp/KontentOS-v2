import { AudioGenerationRequest, GeneratedAudioAsset } from './types';

export interface AudioValidationResult<T> {
  isValid: boolean;
  sanitized?: T;
  errors: string[];
}

function sanitizeText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validates and sanitizes incoming Audio Generation Requests before engine execution.
 */
export function validateAndSanitizeAudioRequest(
  req: AudioGenerationRequest
): AudioValidationResult<AudioGenerationRequest> {
  const errors: string[] = [];

  if (!req || !req.type) {
    return { isValid: false, errors: ['Request must specify an audio type (voiceover, sfx, bgm).'] };
  }

  const sanitized: AudioGenerationRequest = { type: req.type };

  if (req.type === 'voiceover') {
    if (!req.ttsPayload || !req.ttsPayload.text || req.ttsPayload.text.trim().length === 0) {
      errors.push('Voiceover text cannot be empty.');
    } else {
      const cleanText = sanitizeText(req.ttsPayload.text);
      if (cleanText.length === 0) {
        errors.push('Voiceover text contained only invalid HTML tags.');
      } else {
        sanitized.ttsPayload = {
          ...req.ttsPayload,
          text: cleanText,
          speed: Math.max(0.5, Math.min(2.5, req.ttsPayload.speed || 1.0)),
          pitch: Math.max(0.5, Math.min(1.8, req.ttsPayload.pitch || 1.0)),
          wordsPerMinute: Math.max(60, Math.min(300, req.ttsPayload.wordsPerMinute || 150))
        };
      }
    }
  } else if (req.type === 'sfx') {
    if (!req.sfxPayload || !req.sfxPayload.cue || req.sfxPayload.cue.trim().length === 0) {
      errors.push('SFX cue must be specified.');
    } else {
      sanitized.sfxPayload = {
        ...req.sfxPayload,
        cue: sanitizeText(req.sfxPayload.cue).toLowerCase(),
        duration: Math.max(0.2, Math.min(5.0, req.sfxPayload.duration || 1.0)),
        intensity: Math.max(0.1, Math.min(1.0, req.sfxPayload.intensity || 0.8))
      };
    }
  } else if (req.type === 'bgm') {
    if (!req.bgmPayload || !req.bgmPayload.mood) {
      errors.push('BGM mood must be specified.');
    } else {
      sanitized.bgmPayload = {
        ...req.bgmPayload,
        mood: req.bgmPayload.mood,
        targetDuration: Math.max(3.0, Math.min(180.0, req.bgmPayload.targetDuration || 15.0)),
        duckingVolume: Math.max(0.05, Math.min(0.5, req.bgmPayload.duckingVolume || 0.18))
      };
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized: errors.length === 0 ? sanitized : undefined,
    errors
  };
}

/**
 * Validates generated audio asset integrity before presentation to creator.
 */
export function validateAudioAsset(asset: GeneratedAudioAsset): boolean {
  if (!asset || !asset.id || !asset.audioUrl) return false;
  if (typeof asset.duration !== 'number' || asset.duration <= 0 || isNaN(asset.duration)) return false;
  if (!Array.isArray(asset.waveformPeaks) || asset.waveformPeaks.length === 0) return false;
  if (!asset.audioUrl.startsWith('data:audio/')) return false;
  return true;
}
