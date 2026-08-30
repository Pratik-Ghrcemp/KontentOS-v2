import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { AiGenerationEvent, AiTaskType } from '@/lib/ai/types';

export async function getAiHistory(): Promise<AiGenerationEvent[]> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    const data = localStorage.getItem('demo_project_data');
    if (data) {
       const parsed = JSON.parse(data);
       if (parsed.aiHistory) return parsed.aiHistory;
    }
    return [];
  }
  const { data } = await supabase.from('ai_generation_events').select('id, task_type, created_at, response_json').order('created_at', { ascending: false }).limit(10);
  return (data || []).map(row => ({
    id: row.id,
    task_type: row.task_type as AiTaskType,
    created_at: row.created_at,
    preview: row.response_json ? 'Generated result' : ''
  }));
}

export async function saveAiEvent(event: Omit<AiGenerationEvent, 'id' | 'created_at'>, userId?: string, requestJson?: any, responseJson?: any): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    let raw = localStorage.getItem('demo_project_data');
    let data = raw ? JSON.parse(raw) : {};
    if (!data.aiHistory) data.aiHistory = [];
    data.aiHistory.unshift({ ...event, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    data.aiHistory = data.aiHistory.slice(0, 10);
    localStorage.setItem('demo_project_data', JSON.stringify(data));
    return;
  }
  if (!userId) return;
  await supabase.from('ai_generation_events').insert({
    user_id: userId,
    task_type: event.task_type,
    provider: 'openai',
    request_json: requestJson || {},
    response_json: responseJson || { preview: event.preview }
  });
}
