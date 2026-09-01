import { NextResponse } from 'next/server';
import {
  getDurableRenderJob,
  updateDurableRenderJob,
  killActiveProcess
} from '@/lib/rendering/job-registry';
import { getAuthedContext, UNAUTHORIZED_BODY } from '@/lib/auth/require-user';

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const authCtx = await getAuthedContext(request);
  if (!authCtx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }
  const { userId, token } = authCtx;

  const job = await getDurableRenderJob(params.jobId, userId, token);
  if (!job) {
    return NextResponse.json({ error: 'Render job not found or access denied' }, { status: 404 });
  }
  return NextResponse.json(job);
}

export async function DELETE(request: Request, { params }: { params: { jobId: string } }) {
  const authCtx = await getAuthedContext(request);
  if (!authCtx) {
    return NextResponse.json(UNAUTHORIZED_BODY, { status: 401 });
  }
  const { userId, token } = authCtx;

  const job = await getDurableRenderJob(params.jobId, userId, token);
  if (!job) {
    return NextResponse.json({ error: 'Render job not found or access denied' }, { status: 404 });
  }

  // Terminate running FFmpeg child process if active
  killActiveProcess(params.jobId);

  // Persist cancelled state in database
  const updated = await updateDurableRenderJob(
    params.jobId,
    {
      status: 'cancelled',
      completed_at: new Date().toISOString()
    },
    userId,
    token
  );

  return NextResponse.json({ success: true, status: 'cancelled', job: updated });
}
