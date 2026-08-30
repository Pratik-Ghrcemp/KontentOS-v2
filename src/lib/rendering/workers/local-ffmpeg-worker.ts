import { RenderComposition, RenderWorkerResult } from '../types';
import { createFfmpegCommandPlan } from '../ffmpeg-command-planner';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export function getFfmpegExecutablePath(): string {
  if (process.env.LOCAL_FFMPEG_PATH) {
    return process.env.LOCAL_FFMPEG_PATH;
  }
  try {
    const installer = require('@ffmpeg-installer/ffmpeg');
    if (installer && installer.path && fs.existsSync(installer.path)) {
      return installer.path;
    }
  } catch (e) {
    // fallback
  }
  return 'ffmpeg';
}

export async function checkLocalFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpegPath = getFfmpegExecutablePath();
    const proc = spawn(ffmpegPath, ['-version'], { stdio: 'pipe' });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
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
  onProgress?: (percent: number) => void
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

    proc.stderr?.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      logs.push(line.trim());

      const progress = parseFfmpegProgress(line, composition.timeline.duration);
      if (progress !== null && onProgress) {
        onProgress(progress);
      }
    });

    proc.stdout?.on('data', (chunk: Buffer) => {
      logs.push(chunk.toString().trim());
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputFilePath)) {
        const stat = fs.statSync(outputFilePath);
        resolve({
          success: true,
          fileUrl: `file://${outputFilePath}`,
          sizeBytes: stat.size,
          durationSeconds: composition.timeline.duration,
          logs,
        });
      } else {
        const errorDetail = logs.slice(-5).join(' | ');
        resolve({
          success: false,
          error: `FFmpeg exited with code ${code}. Details: ${errorDetail}`,
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

/**
 * Skeleton: Upload the rendered output file to Supabase Storage (exports bucket).
 * This is the next step after a successful local render.
 */
export async function uploadRenderToStorage(
  localFilePath: string,
  userId: string,
  jobId: string
): Promise<string | null> {
  // Will be implemented when Supabase 'exports' bucket is configured.
  // Steps:
  // 1. Read file from localFilePath using fs.createReadStream
  // 2. Upload to supabase.storage.from('exports').upload(`${userId}/${jobId}.mp4`, stream)
  // 3. Create a signed URL and return it
  // 4. Optionally delete the local temp file after successful upload
  console.log(`[uploadRenderToStorage] Ready to upload: ${localFilePath} for user: ${userId}, job: ${jobId}`);
  return null; // Will return the Supabase signed URL once implemented
}
