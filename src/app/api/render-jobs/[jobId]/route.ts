import { NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/rendering/job-registry';

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const job = getJob(params.jobId);
  if (!job) {
    return NextResponse.json({ error: 'Render job not found' }, { status: 404 });
  }
  return NextResponse.json(job);
}

export async function DELETE(request: Request, { params }: { params: { jobId: string } }) {
  const job = getJob(params.jobId);
  if (!job) {
    return NextResponse.json({ error: 'Render job not found' }, { status: 404 });
  }
  updateJob(params.jobId, {
    status: 'cancelled',
    completed_at: new Date().toISOString()
  });
  return NextResponse.json({ success: true, status: 'cancelled' });
}
