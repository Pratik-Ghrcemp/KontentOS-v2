import { createAuthedSupabaseClient, isDemoMode, isSupabaseConfigured } from '@/lib/supabase';
import { RenderJob, RenderRequest, RenderResult } from '@/lib/rendering/types';

function isUuid(value?: string): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

export async function recordRenderCompletion(
  job: RenderJob,
  request: RenderRequest,
  result: RenderResult,
  userId: string,
  token?: string | null
): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured() || !token) return;
  if (!isUuid(request.projectId)) return;

  try {
    const supabase = createAuthedSupabaseClient(token);
    const completedAt = new Date().toISOString();
    const auditReport = buildRenderCompletionAuditReport(job, request, result, userId);

    await supabase.from('audit_reports').insert(auditReport);

    await supabase.from('projects').update({
      status: 'rendered',
      settings: {
        lastRender: {
          jobId: job.id,
          completedAt,
          result,
          quality: request.quality,
          captionMode: request.captionMode,
        },
      },
    }).eq('id', request.projectId).eq('user_id', userId);
  } catch (err) {
    console.warn('Render completion bridge skipped:', err);
  }
}

export function buildRenderCompletionAuditReport(
  job: RenderJob,
  request: RenderRequest,
  result: RenderResult,
  userId: string
) {
  const completedAt = new Date().toISOString();
  const durationSeconds = result.durationSeconds || Math.max(1, request.timelineClips?.[0]?.duration || 1);
  const overlayCount = (request.textOverlays || []).length;
  const captionCount = (request.captions || []).length;
  const diagnosticScore = Math.max(70, Math.min(98, 82 + Math.min(10, overlayCount + captionCount)));

  return {
    project_id: request.projectId,
    user_id: userId,
    diagnostic_score: diagnosticScore,
    retention_3s: Math.min(95, 68 + Math.min(20, captionCount * 2 + overlayCount)),
    total_views: 0,
    issues: [],
    ai_coach_tip: `Heuristic Quality Score: ${diagnosticScore}/100 (Render completed in ${Math.round(durationSeconds)}s with ${captionCount} captions & ${overlayCount} overlays). External social retention syncing scheduled for Phase 26.`,
    created_at: completedAt,
  };
}
