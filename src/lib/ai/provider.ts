import OpenAI, { toFile } from 'openai';
import { spawn } from 'child_process';
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
): Promise<{ data: T | null; isMock: boolean; error?: string }> {
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
    if (!content) return { data: null, isMock: false, error: 'Empty OpenAI response' };

    const parsed: T = JSON.parse(content);
    return { data: parsed, isMock: false };
  } catch (error: any) {
    console.error('OpenAI JSON Generation Error:', error);
    return { data: null, isMock: false, error: error.message || 'OpenAI API request failed' };
  }
}

export interface WhisperSegment {
  text: string;
  start_time: number;
  end_time: number;
}

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB max raw upload
const MAX_WHISPER_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB OpenAI limit
const AUDIO_EXTRACTION_TIMEOUT_MS = 60000; // 60s timeout

/**
 * Asynchronously pre-extract lightweight mono MP3 from large video/audio buffers using FFmpeg
 */
export async function extractOptimizedAudioBufferAsync(
  inputBuffer: Buffer,
  filename: string
): Promise<{ buffer: Buffer; filename: string }> {
  if (inputBuffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Media file exceeds maximum upload limit (${MAX_UPLOAD_BYTES / (1024 * 1024)}MB). Please trim before transcribing.`);
  }

  // If already under 10MB and looks like an audio file, send directly
  if (inputBuffer.length < 10 * 1024 * 1024 && (filename.endsWith('.mp3') || filename.endsWith('.wav') || filename.endsWith('.m4a'))) {
    return { buffer: inputBuffer, filename };
  }

  const tempDir = os.tmpdir();
  const tempInput = path.join(tempDir, `whisper_in_${Date.now()}_${Math.random().toString(36).slice(2)}_${path.basename(filename)}`);
  const tempOutput = path.join(tempDir, `whisper_out_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

  await fs.promises.writeFile(tempInput, inputBuffer);

  try {
    const ffmpegBin = getFfmpegExecutablePath();
    const args = ['-y', '-i', tempInput, '-vn', '-acodec', 'libmp3lame', '-b:a', '64k', '-ac', '1', tempOutput];

    const errLogs: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let timedOut = false;

      proc.stderr?.on('data', (chunk) => {
        errLogs.push(chunk.toString());
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try { proc.kill('SIGKILL'); } catch (e) {}
        reject(new Error(`Audio extraction timed out after ${AUDIO_EXTRACTION_TIMEOUT_MS / 1000}s`));
      }, AUDIO_EXTRACTION_TIMEOUT_MS);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (code === 0 && fs.existsSync(tempOutput)) {
          resolve();
        } else {
          // If no audio stream was present in video, fallback gracefully to original buffer
          const allLogs = errLogs.join('');
          if (allLogs.includes('does not contain any stream') || allLogs.includes('Output file #0 does not contain any stream')) {
            resolve();
          } else {
            reject(new Error(`FFmpeg audio extraction failed (code ${code}): ${errLogs.slice(-3).join(' ')}`));
          }
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn FFmpeg for audio extraction: ${err.message}`));
      });
    });

    if (fs.existsSync(tempOutput) && fs.statSync(tempOutput).size > 0) {
      const extractedBuffer = await fs.promises.readFile(tempOutput);

      if (extractedBuffer.length > MAX_WHISPER_AUDIO_BYTES) {
        throw new Error(`Extracted audio (${(extractedBuffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds the 25MB Whisper API limit.`);
      }

      return { buffer: extractedBuffer, filename: 'extracted_audio.mp3' };
    }

    return { buffer: inputBuffer, filename };
  } finally {
    // Strictly clean up temporary files in finally block
    try { if (fs.existsSync(tempInput)) await fs.promises.unlink(tempInput); } catch (e) {}
    try { if (fs.existsSync(tempOutput)) await fs.promises.unlink(tempOutput); } catch (e) {}
  }
}

import { checkLocalWhisperAvailable, runLocalWhisperTranscription } from './local-whisper-worker';

export interface TranscribeAudioResult {
  segments: WhisperSegment[];
  text: string;
  isMock: boolean;
  provider?: 'local_whisper_cpp' | 'cloud_openai' | 'mock_demo';
  error?: string;
}

/**
 * Speech-to-Text Transcription prioritizing Local Native whisper.cpp,
 * with graceful fallback to Cloud OpenAI Whisper API or Demo mode.
 */
export async function transcribeAudioBuffer(
  buffer: Buffer,
  filename: string = 'audio.mp4',
  language?: string,
  prompt?: string,
  durationSeconds?: number,
  signal?: AbortSignal
): Promise<TranscribeAudioResult> {
  // 1. Highest Priority: Attempt Local Native whisper.cpp Execution (100% Free & Offline)
  if (checkLocalWhisperAvailable()) {
    try {
      const localResult = await runLocalWhisperTranscription(buffer, filename, { 
        language, 
        durationSeconds, 
        signal 
      });
      return {
        segments: localResult.segments,
        text: localResult.text,
        isMock: false,
        provider: 'local_whisper_cpp'
      };
    } catch (localErr: any) {
      if (signal?.aborted || localErr.message?.includes('cancelled')) {
        return { segments: [], text: '', isMock: false, error: 'Transcription cancelled by user' };
      }
      console.warn('Local whisper.cpp execution failed, checking cloud fallback:', localErr.message);
    }
  }

  // 2. Secondary Priority: OpenAI Cloud Whisper API (if configured)
  const client = getOpenAIClient();
  if (client) {
    try {
      const { buffer: optimizedBuffer, filename: targetFilename } = await extractOptimizedAudioBufferAsync(buffer, filename);
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
        isMock: false,
        provider: 'cloud_openai'
      };
    } catch (error: any) {
      console.error('Whisper Transcription Error:', error);
      return { segments: [], text: '', isMock: false, error: error.message || 'Whisper transcription failed' };
    }
  }

  // 3. Fallback: Demo / Unconfigured state
  return { segments: [], text: '', isMock: true, provider: 'mock_demo', error: 'No local whisper binary or cloud API key configured' };
}
