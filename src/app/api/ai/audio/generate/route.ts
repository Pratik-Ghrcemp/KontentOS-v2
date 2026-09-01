import { NextRequest, NextResponse } from 'next/server';
import { validateAndSanitizeAudioRequest, validateAudioAsset } from '@/lib/ai/audio/audio-validator';
import { generateTtsAudio } from '@/lib/ai/audio/tts-engine';
import { generateSfxAudio } from '@/lib/ai/audio/sfx-engine';
import { generateBgmAudio } from '@/lib/ai/audio/bgm-engine';
import { GeneratedAudioAsset } from '@/lib/ai/audio/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validation = validateAndSanitizeAudioRequest(rawBody);

    if (!validation.isValid || !validation.sanitized) {
      return NextResponse.json(
        { error: 'Invalid audio generation request', details: validation.errors },
        { status: 400 }
      );
    }

    const request = validation.sanitized;
    let asset: GeneratedAudioAsset;

    if (request.type === 'voiceover' && request.ttsPayload) {
      asset = await generateTtsAudio(request.ttsPayload);
    } else if (request.type === 'sfx' && request.sfxPayload) {
      asset = await generateSfxAudio(request.sfxPayload);
    } else if (request.type === 'bgm' && request.bgmPayload) {
      asset = await generateBgmAudio(request.bgmPayload);
    } else {
      return NextResponse.json(
        { error: 'Unsupported audio generation type' },
        { status: 400 }
      );
    }

    if (!validateAudioAsset(asset)) {
      return NextResponse.json(
        { error: 'Generated audio asset failed integrity validation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset
    });
  } catch (error: any) {
    console.error('Audio Generation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during audio generation', message: error.message },
      { status: 500 }
    );
  }
}
