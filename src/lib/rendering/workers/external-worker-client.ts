import { RenderComposition, RenderWorkerResult } from '../types';

export interface ExternalRenderJobInfo {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: RenderWorkerResult;
}

export async function createExternalRenderJob(composition: RenderComposition): Promise<ExternalRenderJobInfo> {
  const url = process.env.EXTERNAL_RENDER_WORKER_URL;
  const token = process.env.EXTERNAL_RENDER_WORKER_TOKEN;

  if (!url) {
    throw new Error('EXTERNAL_RENDER_WORKER_URL is not configured');
  }

  // Simulated API Call
  // const res = await fetch(`${url}/jobs`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}`
  //   },
  //   body: JSON.stringify(composition)
  // });

  return {
    id: `ext-${composition.id}`,
    status: 'queued',
    progress: 0
  };
}

export async function getExternalRenderJob(jobId: string): Promise<ExternalRenderJobInfo> {
  // const res = await fetch(`${url}/jobs/${jobId}`, ...);
  return {
    id: jobId,
    status: 'completed',
    progress: 100,
    result: {
      success: true,
      fileUrl: `https://cdn.example.com/renders/${jobId}.mp4`,
      durationSeconds: 15
    }
  };
}

export async function cancelExternalRenderJob(jobId: string): Promise<boolean> {
  // await fetch(`${url}/jobs/${jobId}/cancel`, { method: 'POST' ... });
  return true;
}
