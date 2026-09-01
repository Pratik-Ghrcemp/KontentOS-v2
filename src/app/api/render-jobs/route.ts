import { NextResponse } from 'next/server';
import { RenderRequest } from '@/lib/rendering/types';
import { buildRenderComposition } from '@/lib/rendering/composition-builder';
import { runLocalFfmpegRender, checkLocalFfmpegAvailable } from '@/lib/rendering/workers/local-ffmpeg-worker';
import {
  createDurableRenderJob,
  updateDurableRenderJob,
  getDurableRenderJob,
  listDurableRenderJobs,
  registerActiveProcess,
  unregisterActiveProcess
} from '@/lib/rendering/job-registry';
import { getAuthedContext, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';
import { recordRenderCompletion } from '@/lib/data/render-completion-service';

export async function POST(request: Request) {
  const authCtx = await getAuthedContext(request);
  if (!authCtx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }
  const { userId, token } = authCtx;

  try {
    const body: RenderRequest = await request.json();
    
    if (!body.mediaAssetId) {
      return NextResponse.json({ error: 'mediaAssetId is required' }, { status: 400 });
    }

    const job = await createDurableRenderJob(body, userId, undefined, token);

    // Trigger async render pipeline in background
    (async () => {
      try {
        const isFfmpegAvailable = await checkLocalFfmpegAvailable();
        await updateDurableRenderJob(job.id, { status: 'processing', progress: 10 }, userId, token);

        if (isFfmpegAvailable) {
          const composition = buildRenderComposition(body);
          const result = await runLocalFfmpegRender(
            composition,
            (p) => {
              updateDurableRenderJob(job.id, { progress: Math.max(10, Math.min(95, p)) }, userId, token).catch(() => {});
            },
            (proc) => {
              registerActiveProcess(job.id, proc);
            }
          );

          unregisterActiveProcess(job.id);

          // Check if user cancelled while rendering
          const latestState = await getDurableRenderJob(job.id, userId, token);
          if (latestState?.status === 'cancelled') {
            console.log(`[Render Worker] Job ${job.id} was cancelled during render, not marking completed.`);
            return;
          }

          if (result.success) {
            const downloadUrl = `/api/render-jobs/download?path=${encodeURIComponent(result.fileUrl || '')}&filename=${encodeURIComponent((body.projectTitle || 'render').replace(/[^a-zA-Z0-9_-]/g, '_'))}.mp4`;
            const resultJson = {
              fileUrl: downloadUrl,
              srtUrl: body.captionMode === 'sidecar' ? 'captions.srt' : undefined,
              sizeBytes: result.sizeBytes || 45 * 1024 * 1024,
              durationSeconds: result.durationSeconds || composition.timeline.duration
            };
            const completedJob = await updateDurableRenderJob(job.id, {
              status: 'completed',
              progress: 100,
              completed_at: new Date().toISOString(),
              result_json: resultJson
            }, userId, token);
            if (completedJob) {
              await recordRenderCompletion(completedJob, body, resultJson, userId, token);
            }
          } else {
            const wasCancelled = result.error?.includes('cancelled');
            await updateDurableRenderJob(job.id, {
              status: wasCancelled ? 'cancelled' : 'failed',
              error_message: result.error || 'FFmpeg render failed'
            }, userId, token);
          }
        } else {
          // Explicitly fail if host FFmpeg binary is missing
          await updateDurableRenderJob(job.id, {
            status: 'failed',
            error_message: 'Host FFmpeg binary not found on system PATH. Please install FFmpeg on the host.'
          }, userId, token);
        }
      } catch (err: any) {
        unregisterActiveProcess(job.id);
        await updateDurableRenderJob(job.id, {
          status: 'failed',
          error_message: err.message || 'Render pipeline error'
        }, userId, token).catch(() => {});
      }
    })();

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const authCtx = await getAuthedContext(request);
  if (!authCtx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }
  const { userId, token } = authCtx;

  const url = new URL(request.url);
  const jobId = url.searchParams.get('id');
  if (jobId) {
    const job = await getDurableRenderJob(jobId, userId, token);
    if (job) return NextResponse.json(job);
    return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 });
  }
  
  const jobs = await listDurableRenderJobs(userId, token);
  return NextResponse.json(jobs);
}
