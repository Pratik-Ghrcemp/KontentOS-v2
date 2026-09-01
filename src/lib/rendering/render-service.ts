import { RenderJob, RenderRequest } from './types';
import { isDemoMode, isSupabaseConfigured } from '@/lib/supabase';

// In-memory mock queue for demo mode
let mockJobs: Record<string, RenderJob> = {};
let mockIntervals: Record<string, NodeJS.Timeout> = {};
type Subscriber = (job: RenderJob) => void;
let mockSubscribers: Record<string, Subscriber[]> = {};

const updateMockJob = (id: string, updates: Partial<RenderJob>) => {
  if (mockJobs[id]) {
    mockJobs[id] = { ...mockJobs[id], ...updates, updated_at: new Date().toISOString() };
    (mockSubscribers[id] || []).forEach(cb => cb(mockJobs[id]));
  }
};

import { getClientAuthHeaders } from '@/lib/auth/client-auth';

export async function createRenderJob(request: RenderRequest): Promise<RenderJob> {
  const headers = await getClientAuthHeaders();
  const res = await fetch('/api/render-jobs', {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create render job');
  }
  return res.json();
}

export async function getRenderJob(jobId: string): Promise<RenderJob | null> {
  const headers = await getClientAuthHeaders();
  const res = await fetch(`/api/render-jobs/${jobId}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function cancelRenderJob(jobId: string): Promise<boolean> {
  const headers = await getClientAuthHeaders();
  const res = await fetch(`/api/render-jobs/${jobId}`, {
    method: 'DELETE',
    headers
  });
  return res.ok;
}

export function subscribeToRenderJob(jobId: string, callback: (job: RenderJob) => void): () => void {
  let isCancelled = false;

  // Poll real job status from server API every 1000ms
  const poll = async () => {
    if (isCancelled) return;
    try {
      const job = await getRenderJob(jobId);
      if (job) {
        callback(job);
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          return;
        }
      }
    } catch (e) {
      console.warn('Poll error:', e);
    }
    if (!isCancelled) {
      setTimeout(poll, 1000);
    }
  };

  poll();

  return () => {
    isCancelled = true;
  };
}

export async function retryRenderJob(jobId: string): Promise<RenderJob> {
  const isMock = isDemoMode() || !isSupabaseConfigured();
  if (isMock) {
    if (mockIntervals[jobId]) {
      clearInterval(mockIntervals[jobId]);
    }
    const oldJob = mockJobs[jobId];
    const newJob: RenderJob = {
      ...oldJob,
      id: `mock-job-${crypto.randomUUID()}`,
      status: 'queued',
      progress: 0,
      error_message: undefined,
      result_json: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockJobs[newJob.id] = newJob;

    setTimeout(() => {
      updateMockJob(newJob.id, { status: 'processing', progress: 5 });
      let p = 5;
      mockIntervals[newJob.id] = setInterval(() => {
        p += Math.floor(Math.random() * 15) + 10;
        if (p >= 100) {
          clearInterval(mockIntervals[newJob.id]);
          updateMockJob(newJob.id, {
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
            result_json: {
              fileUrl: 'fake-rendered-video.mp4',
              srtUrl: newJob.request_json?.captionMode === 'sidecar' ? 'fake-captions.srt' : undefined,
              sizeBytes: 45 * 1024 * 1024,
              durationSeconds: 15
            }
          });
        } else {
          updateMockJob(newJob.id, { progress: p });
        }
      }, 500);
    }, 500);

    return newJob;
  }

  const res = await fetch(`/api/render-jobs/${jobId}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry render job');
  return res.json();
}
