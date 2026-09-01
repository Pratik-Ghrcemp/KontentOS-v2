import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { RenderJob } from '@/lib/rendering/types';

export async function getRenderHistory(userId: string): Promise<RenderJob[]> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    try {
      const data = localStorage.getItem('demo_project_data');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.exportHistory) return parsed.exportHistory;
      }
    } catch (e) {}
    return [];
  }
  const { data } = await supabase.from('render_jobs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
  return (data || []) as unknown as RenderJob[];
}

export async function saveRenderHistory(jobs: RenderJob[]): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    try {
      let raw = localStorage.getItem('demo_project_data');
      let data = raw ? JSON.parse(raw) : {};
      data.exportHistory = jobs.slice(0, 5);
      localStorage.setItem('demo_project_data', JSON.stringify(data));
    } catch (e) {}
    return;
  }
  // Real sync goes through the /api/render-jobs endpoint in a real scenario
  // But for simple sync state, we just rely on getRenderHistory.
}
