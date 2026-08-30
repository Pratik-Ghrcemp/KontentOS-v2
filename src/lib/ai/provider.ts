import OpenAI, { toFile } from 'openai';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getFfmpegExecutablePath } from '../rendering/workers/local-ffmpeg-worker';

// Factory to get the correct OpenAI instance (Standard vs Azure)
export function getOpenAIClient(): OpenAI | null {
  const openAiKey = process.env.OPENAI_API_KEY;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (azureKey && azureEndpoint) {
    return new OpenAI({
      apiKey: azureKey,
      baseURL: `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini'}`,
      defaultQuery: { 'api-version': '2024-02-15-preview' },
      defaultHeaders: { 'api-key': azureKey }
    });
  }

  if (openAiKey) {
    return new OpenAI({
      apiKey: openAiKey
    });
  }

  return null;
}

export const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

/**
 * Helper to generate structured JSON from OpenAI
 */
export async function generateJson<T>(
  prompt: string,
  systemPrompt: string = 'You are a helpful AI assistant. Output valid JSON only.',
): Promise<{ data: T | null; isMock: boolean }> {
  const client = getOpenAIClient();

  // Fallback to mock if no keys are provided
  if (!client) {
    return { data: null, isMock: true };
  }

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { data: null, isMock: true };

    const parsed: T = JSON.parse(content);
    return { data: parsed, isMock: false };
  } catch (error) {
    console.error('OpenAI JSON Generation Error:', error);
    // If it fails (e.g. rate limit), return mock flag so the caller can fallback
    return { data: null, isMock: true };
  }
}

export interface WhisperSegment {
  text: string;
  start_time: number;
  end_time: number;
}

/**
 * Pre-extract lightweight mono MP3 from large video/audio buffers using FFmpeg to stay under Whisper 25MB limit
 */
function extractOptimizedAudioBuffer(inputBuffer: Buffer, filename: string): { buffer: Buffer; filename: string } {
  // If already under 10MB and looks like an audio file, send directly
  if (inputBuffer.length < 10 * 1024 * 1024 && (filename.endsWith('.mp3') || filename.endsWith('.wav') || filename.endsWith('.m4a'))) {
    return { buffer: inputBuffer, filename };
  }

  try {
    const tempDir = os.tmpdir();
    const tempInput = path.join(tempDir, `whisper_in_${Date.now()}_${Math.random().toString(36).slice(2)}_${path.basename(filename)}`);
    const tempOutput = path.join(tempDir, `whisper_out_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    fs.writeFileSync(tempInput, inputBuffer);

    const ffmpegBin = getFfmpegExecutablePath();
    const args = ['-y', '-i', tempInput, '-vn', '-acodec', 'libmp3lame', '-b:a', '64k', '-ac', '1', tempOutput];
    const proc = spawnSync(ffmpegBin, args, { stdio: 'pipe' });

    if (proc.status === 0 && fs.existsSync(tempOutput)) {
      const extractedBuffer = fs.readFileSync(tempOutput);
      // Clean up temp files
      try { fs.unlinkSync(tempInput); } catch (e) {}
      try { fs.unlinkSync(tempOutput); } catch (e) {}
      return { buffer: extractedBuffer, filename: 'extracted_audio.mp3' };
    }

    // Fallback: cleanup and return original
    try { if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput); } catch (e) {}
    try { if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput); } catch (e) {}
  } catch (e) {
    // Non-fatal, fallback to original buffer
  }

  return { buffer: inputBuffer, filename };
}

/**
 * Real Speech-to-Text Transcription using OpenAI Whisper API
 */
export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string = 'audio.mp4',
  language?: string,
  prompt?: string
): Promise<{ segments: WhisperSegment[]; text: string; isMock: boolean }> {
  const client = getOpenAIClient();
  if (!client) {
    return { segments: [], text: '', isMock: true };
  }

  try {
    // Optimize / extract audio if video container or large buffer
    const { buffer: optimizedBuffer, filename: targetFilename } = extractOptimizedAudioBuffer(buffer, filename);
    const file = await toFile(optimizedBuffer, targetFilename);

    const transcription: any = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      language,
      prompt
    });

    const segments: WhisperSegment[] = (transcription.segments || []).map((s: any) => ({
      text: String(s.text || '').trim(),
      start_time: Number(s.start || 0),
      end_time: Number(s.end || 0)
    }));

    return {
      segments,
      text: String(transcription.text || ''),
      isMock: false
    };
  } catch (error) {
    console.error('Whisper Transcription Error:', error);
    return { segments: [], text: '', isMock: true };
  }
}
