import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { TextOverlay } from '@/components/tabs/raw-studio/types';

export async function getTextOverlays(projectId: string): Promise<TextOverlay[]> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    try {
      const data = localStorage.getItem('demo_project_data');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.textOverlays) return parsed.textOverlays;
      }
    } catch (e) {}
    return [];
  }
  const { data } = await supabase.from('text_overlays').select('*').eq('project_id', projectId).order('start_time', { ascending: true });
  return (data || []) as TextOverlay[];
}

export async function saveTextOverlays(projectId: string, overlays: TextOverlay[], userId?: string): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    try {
      let raw = localStorage.getItem('demo_project_data');
      let data = raw ? JSON.parse(raw) : {};
      data.textOverlays = overlays;
      localStorage.setItem('demo_project_data', JSON.stringify(data));
    } catch (e) {}
    return;
  }
  if (!userId) return;
  await supabase.from('text_overlays').delete().eq('project_id', projectId);
  if (overlays.length > 0) {
    await supabase.from('text_overlays').insert(
      overlays.map(o => ({
        id: o.id,
        project_id: projectId,
        user_id: userId,
        text: o.text,
        type: o.type,
        start_time: o.start_time,
        end_time: o.end_time
      }))
    );
  }
}
