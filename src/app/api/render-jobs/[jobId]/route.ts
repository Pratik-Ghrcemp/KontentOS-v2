import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  // TODO: Get job from DB
  return NextResponse.json({ id: params.jobId, status: 'queued', progress: 0 });
}

export async function DELETE(request: Request, { params }: { params: { jobId: string } }) {
  // TODO: Verify user owns the job
  // TODO: Update job status to 'cancelled'
  // TODO: Signal queue worker to abort
  return NextResponse.json({ success: true });
}
