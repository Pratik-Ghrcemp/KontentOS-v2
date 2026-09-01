import { spawn, spawnSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getFfmpegExecutablePath, checkLocalFfmpegAvailable } from '../rendering/workers/local-ffmpeg-worker';
import { WhisperSegment } from './provider';

const DEFAULT_WHISPER_TIMEOUT_MS = 90000; // 90 seconds default
const AUDIO_EXTRACTION_TIMEOUT_MS = 45000; // 45 seconds

export interface LocalWhisperOptions {
  modelName?: string;
  language?: string;
  maxPhraseLength?: number;
  threads?: number;
  durationSeconds?: number;
  signal?: AbortSignal;
}

export interface LocalWhisperResult {
  segments: WhisperSegment[];
  text: string;
  provider: 'local_whisper_cpp';
  model: string;
  durationMs: number;
}

export interface WhisperInstallationStatus {
  isReady: boolean;
  ffmpegInstalled: boolean;
  ffmpegPath: string | null;
  whisperBinaryInstalled: boolean;
  whisperExecutable: string | null;
  whisperModelInstalled: boolean;
  whisperModelPath: string | null;
  model: string;
}

/**
 * Deterministic path resolution for local whisper.cpp CLI executable.
 * Checks for both modern 'whisper-cli.exe' and legacy 'main.exe' binaries.
 */
export function getWhisperExecutablePath(): string | null {
  if (process.env.LOCAL_WHISPER_PATH && fs.existsSync(process.env.LOCAL_WHISPER_PATH)) {
    return process.env.LOCAL_WHISPER_PATH;
  }

  const projectRoot = process.cwd();
  const isWin = process.platform === 'win32';
  const candidates = [
    path.resolve(projectRoot, 'bin', 'whisper', isWin ? 'whisper-cli.exe' : 'whisper-cli'),
    path.resolve(projectRoot, 'bin', 'whisper', isWin ? 'main.exe' : 'main'),
    path.resolve(projectRoot, 'whisper-bin-x64', isWin ? 'whisper-cli.exe' : 'whisper-cli'),
    path.resolve(projectRoot, 'whisper-bin-x64', isWin ? 'main.exe' : 'main'),
    path.resolve(projectRoot, 'bin', 'whisper', 'whisper-bin-x64', isWin ? 'whisper-cli.exe' : 'whisper-cli'),
    path.resolve(projectRoot, 'bin', isWin ? 'whisper-cli.exe' : 'whisper-cli')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return null;
}

/**
 * Deterministic path resolution for GGML model weights.
 */
export function getWhisperModelPath(modelName = 'base'): string | null {
  if (process.env.LOCAL_WHISPER_MODEL_PATH && fs.existsSync(process.env.LOCAL_WHISPER_MODEL_PATH)) {
    return process.env.LOCAL_WHISPER_MODEL_PATH;
  }

  const projectRoot = process.cwd();
  const candidates = [
    path.resolve(projectRoot, 'models', 'whisper', `ggml-${modelName}.bin`),
    path.resolve(projectRoot, 'models', `ggml-${modelName}.bin`),
    path.resolve(projectRoot, 'bin', 'whisper', `ggml-${modelName}.bin`)
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return null;
}

/**
 * Fast synchronous check to verify whether local whisper.cpp is available.
 */
export function checkLocalWhisperAvailable(modelName = 'base'): boolean {
  const exePath = getWhisperExecutablePath();
  const modelPath = getWhisperModelPath(modelName);
  return Boolean(exePath && fs.existsSync(exePath) && modelPath && fs.existsSync(modelPath));
}

/**
 * Complete runtime installation diagnostic for Studio Hub.
 */
export async function getWhisperInstallationStatus(modelName = 'base'): Promise<WhisperInstallationStatus> {
  const ffmpegInstalled = await checkLocalFfmpegAvailable();
  const ffmpegPath = getFfmpegExecutablePath();

  const exePath = getWhisperExecutablePath();
  const whisperBinaryInstalled = Boolean(exePath && fs.existsSync(exePath));
  const whisperExecutable = exePath ? path.basename(exePath) : null;

  const modelPath = getWhisperModelPath(modelName);
  const whisperModelInstalled = Boolean(modelPath && fs.existsSync(modelPath));

  return {
    isReady: ffmpegInstalled && whisperBinaryInstalled && whisperModelInstalled,
    ffmpegInstalled,
    ffmpegPath: ffmpegInstalled ? ffmpegPath : null,
    whisperBinaryInstalled,
    whisperExecutable,
    whisperModelInstalled,
    whisperModelPath: modelPath,
    model: `ggml-${modelName}.bin`
  };
}

/**
 * Duration-aware dynamic timeout calculation.
 * Scales dynamically with media length with a safe floor of 90s and a 15-minute cap.
 */
export function calculateWhisperTimeoutMs(durationSeconds?: number): number {
  if (!durationSeconds || durationSeconds <= 0 || isNaN(durationSeconds)) {
    return DEFAULT_WHISPER_TIMEOUT_MS;
  }
  // Formula: Base 60s + 3s per second of media, clamped between 90s and 900s (15 min)
  return Math.max(90000, Math.min(900000, Math.round(60000 + durationSeconds * 3000)));
}

/**
 * Asynchronously extract 16kHz 16-bit mono PCM WAV audio using local FFmpeg.
 */
export async function extract16kMonoWavAsync(
  inputBuffer: Buffer,
  filename: string,
  signal?: AbortSignal
): Promise<{ wavPath: string; cleanup: () => Promise<void> }> {
  if (signal?.aborted) {
    throw new Error('Transcription extraction cancelled by user.');
  }

  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = path.extname(filename) || '.mp4';
  const tempInput = path.join(tempDir, `kontentos_raw_${uniqueId}${ext}`);
  const tempWav = path.join(tempDir, `kontentos_stt_${uniqueId}.wav`);

  await fs.promises.writeFile(tempInput, inputBuffer);

  const cleanup = async () => {
    try { if (fs.existsSync(tempInput)) await fs.promises.unlink(tempInput); } catch (e) {}
    try { if (fs.existsSync(tempWav)) await fs.promises.unlink(tempWav); } catch (e) {}
  };

  try {
    const ffmpegBin = getFfmpegExecutablePath();
    const args = ['-y', '-i', tempInput, '-vn', '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', tempWav];
    const errLogs: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let timedOut = false;
      let aborted = false;

      const onAbort = () => {
        aborted = true;
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawnSync('taskkill', ['/pid', String(proc.pid), '/f', '/t']);
          } else {
            proc.kill('SIGKILL');
          }
        } catch (e) {}
        reject(new Error('Transcription extraction cancelled by user.'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      proc.stderr?.on('data', (chunk) => errLogs.push(chunk.toString()));

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t']);
          } else {
            proc.kill('SIGKILL');
          }
        } catch (e) {}
        reject(new Error(`FFmpeg audio extraction timed out after ${AUDIO_EXTRACTION_TIMEOUT_MS / 1000}s`));
      }, AUDIO_EXTRACTION_TIMEOUT_MS);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        if (timedOut || aborted) return;
        if (code === 0 && fs.existsSync(tempWav) && fs.statSync(tempWav).size > 0) {
          resolve();
        } else {
          const allLogs = errLogs.join('');
          if (allLogs.includes('does not contain any stream') || allLogs.includes('Output file #0 does not contain any stream')) {
            reject(new Error('Media file contains no extractable audio stream.'));
          } else {
            reject(new Error(`FFmpeg audio extraction failed (code ${code}): ${errLogs.slice(-3).join(' ')}`));
          }
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
      });
    });

    // Remove raw input buffer file immediately once WAV is ready
    try { if (fs.existsSync(tempInput)) await fs.promises.unlink(tempInput); } catch (e) {}

    return { wavPath: tempWav, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

/**
 * Defensively normalize raw whisper.cpp JSON output into canonical WhisperSegment[] format.
 */
export function normalizeWhisperCppJson(rawJson: any): WhisperSegment[] {
  if (!rawJson || typeof rawJson !== 'object') return [];

  const rawList = Array.isArray(rawJson.transcription) 
    ? rawJson.transcription 
    : (Array.isArray(rawJson.segments) ? rawJson.segments : []);

  const segments: WhisperSegment[] = [];

  for (const item of rawList) {
    const rawText = String(item.text || '').trim();
    if (!rawText) continue;

    let start = 0;
    let end = 0;

    if (typeof item.offsets?.from === 'number' && typeof item.offsets?.to === 'number') {
      start = item.offsets.from / 1000;
      end = item.offsets.to / 1000;
    } else if (typeof item.start === 'number' && typeof item.end === 'number') {
      start = item.start > 1000 ? item.start / 1000 : item.start;
      end = item.end > 1000 ? item.end / 1000 : item.end;
    } else if (typeof item.timestamps?.from === 'string' && typeof item.timestamps?.to === 'string') {
      start = parseTimestampStringToSeconds(item.timestamps.from);
      end = parseTimestampStringToSeconds(item.timestamps.to);
    } else {
      continue;
    }

    if (end <= start) {
      end = start + Math.max(1.0, rawText.split(/\s+/).length * 0.4);
    }

    segments.push({
      text: rawText,
      start_time: Math.max(0, Number(start.toFixed(2))),
      end_time: Math.max(0.1, Number(end.toFixed(2)))
    });
  }

  return segments;
}

function parseTimestampStringToSeconds(ts: string): number {
  // Format: "HH:MM:SS,mmm" or "HH:MM:SS.mmm"
  const parts = ts.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parseFloat(parts[2]) || 0;
    return h * 3600 + m * 60 + s;
  }
  return parseFloat(ts) || 0;
}

/**
 * Execute local whisper.cpp speech transcription directly on the host.
 */
export async function runLocalWhisperTranscription(
  inputBuffer: Buffer,
  filename = 'media.mp4',
  options: LocalWhisperOptions = {}
): Promise<LocalWhisperResult> {
  const startTime = Date.now();
  const modelName = options.modelName || 'base';

  if (options.signal?.aborted) {
    throw new Error('Transcription cancelled by user.');
  }

  const exePath = getWhisperExecutablePath();
  if (!exePath) {
    throw new Error('Local whisper.cpp executable not found in bin/whisper/ (place whisper-cli.exe or main.exe).');
  }

  const modelPath = getWhisperModelPath(modelName);
  if (!modelPath) {
    throw new Error(`Local whisper model weights not found in models/whisper/ (place ggml-${modelName}.bin).`);
  }

  const timeoutMs = calculateWhisperTimeoutMs(options.durationSeconds);
  const { wavPath, cleanup: cleanupWav } = await extract16kMonoWavAsync(inputBuffer, filename, options.signal);

  const tempDir = os.tmpdir();
  const outPrefix = path.join(tempDir, `kontentos_whisper_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const expectedJsonFile = `${outPrefix}.json`;

  const cleanupAll = async () => {
    await cleanupWav();
    try { if (fs.existsSync(expectedJsonFile)) await fs.promises.unlink(expectedJsonFile); } catch (e) {}
  };

  try {
    const threadCount = options.threads || Math.min(4, Math.max(1, os.cpus().length - 1));
    const maxLen = options.maxPhraseLength || 24;

    const args = [
      '-m', modelPath,
      '-f', wavPath,
      '-oj',
      '-of', outPrefix,
      '-sow',
      '-ml', String(maxLen),
      '-t', String(threadCount)
    ];

    if (options.language && options.language !== 'auto') {
      args.push('-l', options.language);
    }

    const exeDir = path.dirname(exePath);
    const customEnv = {
      ...process.env,
      PATH: `${exeDir}${path.delimiter}${process.env.PATH || ''}`
    };

    const errLogs: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(exePath, args, { cwd: exeDir, env: customEnv, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      let timedOut = false;
      let aborted = false;

      const onAbort = () => {
        aborted = true;
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawnSync('taskkill', ['/pid', String(proc.pid), '/f', '/t']);
          } else {
            proc.kill('SIGKILL');
          }
        } catch (e) {}
        reject(new Error('Transcription cancelled by user.'));
      };

      if (options.signal) {
        options.signal.addEventListener('abort', onAbort, { once: true });
      }

      proc.stderr?.on('data', (chunk) => errLogs.push(chunk.toString()));

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t']);
          } else {
            proc.kill('SIGKILL');
          }
        } catch (e) {}
        reject(new Error(`whisper.cpp transcription timed out after ${Math.round(timeoutMs / 1000)}s. Please try a shorter clip.`));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (options.signal) options.signal.removeEventListener('abort', onAbort);
        if (timedOut || aborted) return;
        if (code === 0 && fs.existsSync(expectedJsonFile)) {
          resolve();
        } else {
          reject(new Error(`whisper.cpp failed with exit code ${code}: ${errLogs.slice(-4).join(' ')}`));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        if (options.signal) options.signal.removeEventListener('abort', onAbort);
        reject(new Error(`Failed to spawn whisper.cpp binary: ${err.message}`));
      });
    });

    const rawJsonStr = await fs.promises.readFile(expectedJsonFile, 'utf8');
    const parsedJson = JSON.parse(rawJsonStr);
    const segments = normalizeWhisperCppJson(parsedJson);
    const fullText = segments.map(s => s.text).join(' ');

    return {
      segments,
      text: fullText,
      provider: 'local_whisper_cpp',
      model: modelName,
      durationMs: Date.now() - startTime
    };
  } finally {
    await cleanupAll();
  }
}
