import { NextResponse } from 'next/server';
import { RenderRequest, RenderJob } from '@/lib/rendering/types';
import { buildRenderComposition } from '@/lib/rendering/composition-builder';
import { runLocalFfmpegRender, checkLocalFfmpegAvailable } from '@/lib/rendering/workers/local-ffmpeg-worker';
import { getJob, setJob, updateJob, listJobs } from '@/lib/rendering/job-registry';

export async function POST(request: Request) {
  try {
    const body: RenderRequest = await request.json();
    
    if (!body.mediaAssetId) {
      return NextResponse.json({ error: 'mediaAssetId is required' }, { status: 400 });
    }

    const id = `job-${crypto.randomUUID()}`;
    const job: RenderJob = {
      id,
      media_asset_id: body.mediaAssetId,
      status: 'queued',
      progress: 0,
      request_json: body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setJob(id, job);

    // Trigger async render pipeline in background
    (async () => {
      try {
        const isFfmpegAvailable = await checkLocalFfmpegAvailable();
        updateJob(id, { status: 'processing', progress: 10 });

        if (isFfmpegAvailable) {
          const composition = buildRenderComposition(body);
          const result = await runLocalFfmpegRender(composition, (p) => {
            updateJob(id, { progress: Math.max(10, Math.min(95, p)) });
          });

          if (result.success) {
            const downloadUrl = `/api/render-jobs/download?path=${encodeURIComponent(result.fileUrl || '')}&filename=${encodeURIComponent((body.projectTitle || 'render').replace(/[^a-zA-Z0-9_-]/g, '_'))}.mp4`;
            updateJob(id, {
              status: 'completed',
              progress: 100,
              completed_at: new Date().toISOString(),
              result_json: {
                fileUrl: downloadUrl,
                srtUrl: body.captionMode === 'sidecar' ? 'captions.srt' : undefined,
                sizeBytes: result.sizeBytes || 45 * 1024 * 1024,
                durationSeconds: result.durationSeconds || composition.timeline.duration
              }
            });
          } else {
            updateJob(id, {
              status: 'failed',
              error_message: result.error || 'FFmpeg render failed'
            });
          }
        } else {
          // Explicitly fail if FFmpeg is not available
          updateJob(id, {
            status: 'failed',
            error_message: 'Host FFmpeg binary not found or not runnable. Please install FFmpeg on the system.'
          });
        }
      } catch (err: any) {
        updateJob(id, {
          status: 'failed',
          error_message: err.message || 'Render pipeline error'
        });
      }
    })();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('id');
  if (jobId) {
    const job = getJob(jobId);
    if (job) return NextResponse.json(job);
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json(listJobs());
}
