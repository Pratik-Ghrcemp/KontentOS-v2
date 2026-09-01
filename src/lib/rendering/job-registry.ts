import { ChildProcess } from 'child_process';
import { RenderJob } from './types';
import {
  createDurableRenderJob,
  getDurableRenderJob,
  updateDurableRenderJob,
  listDurableRenderJobs
} from '@/lib/data/render-job-db';

// Process-wide map for active running FFmpeg child processes
declare global {
  // eslint-disable-next-line no-var
  var __kontentos_active_processes__: Map<string, ChildProcess> | undefined;
}

if (!globalThis.__kontentos_active_processes__) {
  globalThis.__kontentos_active_processes__ = new Map<string, ChildProcess>();
}

export const activeProcesses = globalThis.__kontentos_active_processes__;

export function registerActiveProcess(jobId: string, proc: ChildProcess): void {
  activeProcesses.set(jobId, proc);
}

export function unregisterActiveProcess(jobId: string): void {
  activeProcesses.delete(jobId);
}

export function killActiveProcess(jobId: string): boolean {
  const proc = activeProcesses.get(jobId);
  if (proc) {
    try {
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) {
          try { proc.kill('SIGKILL'); } catch (e) {}
        }
      }, 500);
      activeProcesses.delete(jobId);
      return true;
    } catch (e) {
      console.error(`Failed to kill active FFmpeg process for job ${jobId}:`, e);
    }
  }
  return false;
}

// Backwards-compatible aliases for synchronous test helpers
export async function getJob(jobId: string): Promise<RenderJob | null> {
  return getDurableRenderJob(jobId, 'demo-user');
}

export async function setJob(jobId: string, job: RenderJob): Promise<RenderJob> {
  return createDurableRenderJob(job.request_json, job.user_id || 'demo-user', jobId);
}

export async function updateJob(jobId: string, updates: Partial<RenderJob>): Promise<RenderJob | null> {
  return updateDurableRenderJob(jobId, updates, 'demo-user');
}

export async function listJobs(): Promise<RenderJob[]> {
  return listDurableRenderJobs('demo-user');
}

export {
  createDurableRenderJob,
  getDurableRenderJob,
  updateDurableRenderJob,
  listDurableRenderJobs
};
