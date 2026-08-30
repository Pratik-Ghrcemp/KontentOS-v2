import { RenderJob } from './types';

// Process-wide singleton registry for in-flight render jobs
declare global {
  // eslint-disable-next-line no-var
  var __kontentos_render_jobs__: Record<string, RenderJob> | undefined;
}

if (!globalThis.__kontentos_render_jobs__) {
  globalThis.__kontentos_render_jobs__ = {};
}

export const renderJobRegistry = globalThis.__kontentos_render_jobs__;

export function getJob(jobId: string): RenderJob | undefined {
  return renderJobRegistry[jobId];
}

export function setJob(jobId: string, job: RenderJob): void {
  renderJobRegistry[jobId] = job;
}

export function updateJob(jobId: string, updates: Partial<RenderJob>): RenderJob | undefined {
  const existing = renderJobRegistry[jobId];
  if (!existing) return undefined;
  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  };
  renderJobRegistry[jobId] = updated;
  return updated;
}

export function listJobs(): RenderJob[] {
  return Object.values(renderJobRegistry);
}
