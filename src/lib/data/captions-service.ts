import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { CaptionSegment } from '@/components/tabs/raw-studio/types';

export async function getCaptions(mediaAssetId: string): Promise<CaptionSegment[]> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    const data = localStorage.getItem('demo_project_data');
    if (data) {
       const parsed = JSON.parse(data);
       if (parsed.captions) return parsed.captions;
    }
    return [];
  }
  const { data } = await supabase.from('caption_segments').select('*').eq('media_asset_id', mediaAssetId).order('start_time', { ascending: true });
  return (data || []) as CaptionSegment[];
}

export async function saveCaptions(mediaAssetId: string, captions: CaptionSegment[], userId?: string): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    let raw = localStorage.getItem('demo_project_data');
    let data = raw ? JSON.parse(raw) : {};
    data.captions = captions;
    localStorage.setItem('demo_project_data', JSON.stringify(data));
    return;
  }
  if (!userId) return;
  await supabase.from('caption_segments').delete().eq('media_asset_id', mediaAssetId);
  if (captions.length > 0) {
    await supabase.from('caption_segments').insert(
      captions.map(c => ({
        id: c.id,
        media_asset_id: mediaAssetId,
        user_id: userId,
        text: c.text,
        start_time: c.start_time,
        end_time: c.end_time
      }))
    );
  }
}
