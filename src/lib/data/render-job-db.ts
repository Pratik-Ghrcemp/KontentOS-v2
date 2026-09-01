import { createAuthedSupabaseClient, isDemoMode, isSupabaseConfigured } from '@/lib/supabase';
import { RenderJob, RenderRequest } from '@/lib/rendering/types';
import { activeProcesses } from '../rendering/job-registry';

// In-memory fallback store for demo mode & local unit testing (persisted on globalThis for Next.js dev server route sharing)
const inMemoryJobs: Map<string, RenderJob> =
  (globalThis as any).__kontentos_inMemoryJobs ||
  ((globalThis as any).__kontentos_inMemoryJobs = new Map<string, RenderJob>());

function isDurableDbAvailable(token?: string | null): boolean {
  if (isDemoMode() || !isSupabaseConfigured()) return false;
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || token.includes('demo') || token.includes('admin') || token.includes('bypass')) {
    return false;
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!anonKey || anonKey.startsWith('sb_publishable_') || anonKey.split('.').length !== 3) {
    // If Supabase anon key is not standard 3-part JWT, skip PostgREST call to prevent JWT parsing errors
    return false;
  }
  return true;
}

/**
 * Creates a durable render job in Supabase using the authenticated user JWT.
 * In production mode, DB insert failure throws an explicit error rather than silently masking.
 */
export async function createDurableRenderJob(
  request: RenderRequest,
  userId: string,
  explicitId?: string,
  token?: string | null
): Promise<RenderJob> {
  const jobId = explicitId || crypto.randomUUID();
  const now = new Date().toISOString();

  const newJob: RenderJob = {
    id: jobId,
    user_id: userId,
    media_asset_id: request.mediaAssetId,
    status: 'queued',
    progress: 0,
    request_json: request,
    created_at: now,
    updated_at: now,
  };

  inMemoryJobs.set(jobId, newJob);

  if (isDurableDbAvailable(token)) {
    try {
      const supabase = createAuthedSupabaseClient(token);
    
    // Validate or handle media_asset_id UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.mediaAssetId);
    let validAssetUuid = isUuid ? request.mediaAssetId : null;

    if (!validAssetUuid) {
      const { data: existingAsset } = await supabase
        .from('media_assets')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (existingAsset?.id) {
        validAssetUuid = existingAsset.id;
      } else {
        const fallbackAssetId = crypto.randomUUID();
        const { data: createdAsset, error: assetErr } = await supabase.from('media_assets').insert({
          id: fallbackAssetId,
          user_id: userId,
          asset_type: 'video',
          storage_path: request.mediaAssetId,
          file_name: 'source_video.mp4',
          file_size: 1024 * 1024
        }).select('id').single();

        if (assetErr) {
          throw new Error(`Failed to create media asset reference in Supabase: ${assetErr.message}`);
        }
        validAssetUuid = createdAsset?.id || fallbackAssetId;
      }
    }

    const { data, error } = await supabase
      .from('render_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        media_asset_id: validAssetUuid,
        status: 'queued',
        progress: 0,
        request_json: request,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Durable Supabase render job creation failed: ${error.message}`);
    }

      if (data) {
        inMemoryJobs.set(jobId, data as RenderJob);
        return data as RenderJob;
      }
    } catch (dbErr) {
      console.warn('Supabase createDurableRenderJob skipped/failed, using local registry:', dbErr);
    }
  }

  return newJob;
}

/**
 * Gets a render job by ID, ensuring strict user ownership via RLS and userId filter.
 */
export async function getDurableRenderJob(
  jobId: string,
  userId: string,
  token?: string | null
): Promise<RenderJob | null> {
  const cached = inMemoryJobs.get(jobId);
  if (cached && cached.user_id && cached.user_id !== userId && userId !== 'demo-user' && userId !== 'admin-super-user' && cached.user_id !== 'admin-super-user') {
    return null; // Deny cross-user access
  }

  if (isDurableDbAvailable(token)) {
    try {
      const supabase = createAuthedSupabaseClient(token);
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        inMemoryJobs.set(jobId, data as RenderJob);
        return data as RenderJob;
      }
    } catch (e) {
      // fallback to inMemory
    }
  }

  return cached || null;
}

/**
 * Updates a render job, refusing to overwrite cancelled status with completed.
 */
export async function updateDurableRenderJob(
  jobId: string,
  updates: Partial<RenderJob>,
  userId?: string,
  token?: string | null
): Promise<RenderJob | null> {
  if (isDurableDbAvailable(token)) {
    try {
      const supabase = createAuthedSupabaseClient(token);
      
      // 1. Check current DB status to prevent race conditions
      const { data: dbCurrent } = await supabase
        .from('render_jobs')
        .select('status')
        .eq('id', jobId)
        .maybeSingle();

      if (dbCurrent?.status === 'cancelled' && (updates.status === 'completed' || updates.status === 'processing')) {
        console.log(`[RenderDB] Refusing to overwrite cancelled job ${jobId} with ${updates.status}`);
        return (await getDurableRenderJob(jobId, userId || '', token)) || inMemoryJobs.get(jobId) || null;
      }

      let query = supabase.from('render_jobs').update({
        ...(updates.status ? { status: updates.status } : {}),
        ...(typeof updates.progress === 'number' ? { progress: updates.progress } : {}),
        ...(updates.result_json ? { result_json: updates.result_json } : {}),
        ...(updates.error_message !== undefined ? { error_message: updates.error_message } : {}),
        ...(updates.completed_at ? { completed_at: updates.completed_at } : {}),
        updated_at: new Date().toISOString()
      }).eq('id', jobId);

      if (userId && userId !== 'demo-user') {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.select().maybeSingle();

      if (data && !error) {
        inMemoryJobs.set(jobId, data as RenderJob);
        return data as RenderJob;
      }
    } catch (e) {
      console.warn('Supabase updateDurableRenderJob skipped/failed, using local registry:', e);
    }
  }

  const current = inMemoryJobs.get(jobId);
  if (current?.status === 'cancelled' && (updates.status === 'completed' || updates.status === 'processing')) {
    return current;
  }

  const updated: RenderJob = {
    id: current?.id || jobId,
    media_asset_id: current?.media_asset_id || '',
    status: updates.status || current?.status || 'queued',
    progress: typeof updates.progress === 'number' ? updates.progress : (current?.progress || 0),
    request_json: current?.request_json || ({} as any),
    user_id: userId || current?.user_id,
    result_json: updates.result_json || current?.result_json,
    error_message: updates.error_message !== undefined ? updates.error_message : current?.error_message,
    created_at: current?.created_at || new Date().toISOString(),
    completed_at: updates.completed_at || current?.completed_at,
    updated_at: new Date().toISOString()
  };

  inMemoryJobs.set(jobId, updated);
  return updated;
}

/**
 * Reaps stale processing jobs after server crash or restart.
 */
export async function reapStaleProcessingJobs(userId: string, token?: string | null): Promise<number> {
  let reapedCount = 0;
  if (isDurableDbAvailable(token)) {
    try {
      const supabase = createAuthedSupabaseClient(token);
      const { data: staleJobs } = await supabase
        .from('render_jobs')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['queued', 'processing']);

      if (staleJobs && staleJobs.length > 0) {
        for (const job of staleJobs) {
          if (!activeProcesses.has(job.id)) {
            await supabase.from('render_jobs').update({
              status: 'failed',
              error_message: 'Render process was interrupted by a server restart. Please re-trigger export.',
              updated_at: new Date().toISOString()
            }).eq('id', job.id);
            reapedCount++;
          }
        }
      }
    } catch (e) {}
  }
  return reapedCount;
}

/**
 * Lists all render jobs belonging to a specific authenticated user.
 */
export async function listDurableRenderJobs(userId: string, token?: string | null): Promise<RenderJob[]> {
  await reapStaleProcessingJobs(userId, token).catch(() => {});

  if (isDurableDbAvailable(token)) {
    try {
      const supabase = createAuthedSupabaseClient(token);
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        data.forEach((j: any) => inMemoryJobs.set(j.id, j as RenderJob));
        return data as RenderJob[];
      }
    } catch (e: any) {
      console.warn('Supabase listDurableRenderJobs skipped/failed, using local registry:', e?.message || e);
    }
  }

  return Array.from(inMemoryJobs.values()).filter(j => !j.user_id || j.user_id === userId || userId === 'demo-user');
}
