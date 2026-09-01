import { RenderComposition, RenderWorkerResult } from '../types';
import { createFfmpegCommandPlan } from '../ffmpeg-command-planner';
import { spawn, spawnSync, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function getFfmpegExecutablePath(): string {
  if (process.env.LOCAL_FFMPEG_PATH && fs.existsSync(process.env.LOCAL_FFMPEG_PATH)) {
    return process.env.LOCAL_FFMPEG_PATH;
  }

  const projectRoot = process.cwd();
  const isWin = process.platform === 'win32';
  const exeName = isWin ? 'ffmpeg.exe' : 'ffmpeg';

  const candidatePaths: string[] = [
    // 1. Direct bin/ffmpeg executable
    path.resolve(projectRoot, 'bin', 'ffmpeg', exeName),
    // 2. Direct bin/whisper executable
    path.resolve(projectRoot, 'bin', 'whisper', exeName),
    // 3. Direct bin/ executable
    path.resolve(projectRoot, 'bin', exeName),
    // 4. Direct node_modules platform package path
    path.resolve(projectRoot, 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.resolve(projectRoot, 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.resolve(projectRoot, 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffmpeg'),
    // 5. Common Windows install locations
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // 6. Installer package resolution
  try {
    const installer = require('@ffmpeg-installer/ffmpeg');
    if (installer && installer.path && fs.existsSync(installer.path)) {
      return installer.path;
    }
  } catch (e) {}

  // 7. System PATH fallback
  return 'ffmpeg';
}

export async function checkLocalFfmpegAvailable(): Promise<boolean> {
  try {
    const ffmpegPath = getFfmpegExecutablePath();
    if (ffmpegPath !== 'ffmpeg' && !fs.existsSync(ffmpegPath)) return false;
    const res = spawnSync(ffmpegPath, ['-version'], { timeout: 3000 });
    return res.status === 0 && !res.error;
  } catch (e) {
    return false;
  }
}

function parseFfmpegProgress(line: string, totalDurationSeconds: number): number | null {
  // FFmpeg outputs "time=HH:MM:SS.xx" for progress
  const match = line.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);
  const elapsedSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalDurationSeconds <= 0) return null;
  return Math.min(100, Math.round((elapsedSeconds / totalDurationSeconds) * 100));
}

export async function runLocalFfmpegRender(
  composition: RenderComposition,
  onProgress?: (percent: number) => void,
  onProcessSpawn?: (proc: ChildProcess) => void
): Promise<RenderWorkerResult> {
  const isAvailable = await checkLocalFfmpegAvailable();
  if (!isAvailable) {
    return {
      success: false,
      error: 'FFmpeg is not installed or not found on PATH. Install FFmpeg or set LOCAL_FFMPEG_PATH.',
    };
  }

  const plan = createFfmpegCommandPlan(composition);
  const ffmpegPath = getFfmpegExecutablePath();
  const outputDir = process.env.LOCAL_RENDER_OUTPUT_DIR || path.join(os.tmpdir(), 'kontentos-renders');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFilePath = path.join(outputDir, plan.outputFilename);

  // Build the full argument list: inputs + filterGraph + outputs + outputFile
  const args: string[] = [
    '-y', // Overwrite output without asking
    ...plan.inputs,
    ...(plan.filterGraph.length > 0 ? ['-filter_complex', plan.filterGraph.join(';')] : []),
    ...plan.outputs,
    outputFilePath,
  ];

  const logs: string[] = [`FFmpeg Plan: ${plan.summary}`, `Output: ${outputFilePath}`];

  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    if (typeof onProcessSpawn === 'function') {
      onProcessSpawn(proc);
    }

    proc.stderr?.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      logs.push(line.trim());

      const progress = parseFfmpegProgress(line, composition.timeline.duration);
      if (progress !== null && typeof onProgress === 'function') {
        onProgress(progress);
      }
    });

    proc.stdout?.on('data', (chunk: Buffer) => {
      logs.push(chunk.toString().trim());
    });

    proc.on('close', (code, signal) => {
      if (code === 0 && fs.existsSync(outputFilePath)) {
        const stat = fs.statSync(outputFilePath);
        resolve({
          success: true,
          fileUrl: `file://${outputFilePath}`,
          outputPath: outputFilePath,
          sizeBytes: stat.size,
          durationSeconds: composition.timeline.duration,
          logs,
        });
      } else {
        const errorDetail = logs.slice(-5).join(' | ');
        const wasKilled = signal === 'SIGTERM' || signal === 'SIGKILL' || proc.killed;
        resolve({
          success: false,
          error: wasKilled
            ? `Render process was cancelled (${signal || 'SIGTERM'})`
            : `FFmpeg exited with code ${code}. Details: ${errorDetail}`,
          logs,
        });
      }
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn FFmpeg: ${err.message}`,
        logs,
      });
    });
  });
}
