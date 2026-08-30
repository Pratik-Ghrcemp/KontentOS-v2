import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

export async function getProject(id: string): Promise<Project | null> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    const data = localStorage.getItem('demo_project_data');
    if (data) return JSON.parse(data).project || null;
    return { id: 'demo', user_id: 'local', title: 'Untitled Demo', platform_preset: 'instagram-reels', settings: {}, created_at: '', updated_at: '' };
  }
  const { data } = await supabase.from('projects').select('*').eq('id', id).single();
  return data;
}

export async function saveProject(project: ProjectInsert): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    let raw = localStorage.getItem('demo_project_data');
    let data = raw ? JSON.parse(raw) : {};
    data.project = { ...data.project, ...project };
    localStorage.setItem('demo_project_data', JSON.stringify(data));
    return;
  }
  await supabase.from('projects').upsert(project);
}
