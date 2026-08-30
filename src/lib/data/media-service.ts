import { supabase, isSupabaseConfigured, isDemoMode } from '@/lib/supabase';
import { StudioAsset, AssetType } from '@/components/tabs/raw-studio/types';
import { getMediaMetadata, sanitizeFileName } from '@/lib/utils/media';
import { storeMediaBlob, getMediaBlob } from './indexed-db-media';

export async function getMediaAssets(userId: string): Promise<StudioAsset[]> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    const data = localStorage.getItem('demo_project_data');
    if (data) {
       const parsed = JSON.parse(data);
       if (parsed.assets && Array.isArray(parsed.assets)) {
         const restored = await Promise.all(parsed.assets.map(async (a: any) => {
           try {
             const blob = await getMediaBlob(a.id);
             if (blob) {
               return { ...a, storage_path: URL.createObjectURL(blob), previewUrl: URL.createObjectURL(blob) };
             }
           } catch (e) {}
           return a;
         }));
         return restored;
       }
    }
    return [];
  }
  const { data, error } = await supabase.from('media_assets')
    .select('*, projects(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error loading assets:', error);
    return [];
  }

  // Pre-fetch signed URLs for the assets so UI works smoothly
  const resolvedAssets = await Promise.all(data.map(async (a: any) => {
    let url = a.storage_path;
    if (a.storage_path && !a.storage_path.startsWith('http') && !a.storage_path.startsWith('blob:')) {
      const { data: urlData } = await supabase.storage.from('media-assets').createSignedUrl(a.storage_path, 3600);
      if (urlData?.signedUrl) {
         url = urlData.signedUrl;
      }
    }
    return { ...a, storage_path: url, _raw_path: a.storage_path };
  }));

  return resolvedAssets as unknown as StudioAsset[];
}

export async function uploadMediaAsset(file: File, userId: string, projectId: string = 'demo'): Promise<StudioAsset> {
  const metadata = await getMediaMetadata(file);
  const assetId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name);
  
  const MAX_SIZE_MB = 50;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File exceeds the ${MAX_SIZE_MB}MB limit.`);
  }
  let assetType = 'video';
  if (file.type.startsWith('audio/')) assetType = 'audio';
  else if (file.type.startsWith('image/')) assetType = 'image';

  if (isDemoMode() || !isSupabaseConfigured()) {
    const localUrl = URL.createObjectURL(file);
    const mockAsset: StudioAsset = {
      id: assetId,
      user_id: userId,
      asset_type: assetType as AssetType,
      storage_path: localUrl,
      duration_seconds: metadata.duration || null,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      width: metadata.width,
      height: metadata.height,
      created_at: new Date().toISOString()
    } as StudioAsset;

    let raw = localStorage.getItem('demo_project_data');
    let data = raw ? JSON.parse(raw) : {};
    if (!data.assets) data.assets = [];
    data.assets.push(mockAsset);
    localStorage.setItem('demo_project_data', JSON.stringify(data));
    
    // Store binary blob in IndexedDB for refresh persistence
    storeMediaBlob(assetId, file, mockAsset).catch(e => console.warn('IndexedDB save skipped:', e));

    return mockAsset;
  }

  // Real Upload
  const path = `${userId}/${projectId}/${assetId}/${safeName}`;
  const { error: uploadError } = await supabase.storage.from('media-assets').upload(path, file);
  if (uploadError) throw new Error("Storage upload failed: " + uploadError.message);

  const { data, error: insertError } = await supabase.from('media_assets').insert({
    id: assetId,
    user_id: userId,
    project_id: projectId !== 'demo' ? projectId : null,
    asset_type: assetType,
    storage_path: path,
    duration_seconds: metadata.duration || null,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    width: metadata.width,
    height: metadata.height
  }).select().single();

  if (insertError) throw new Error("DB insert failed: " + insertError.message);

  // Fetch signed URL for immediate use
  const { data: urlData } = await supabase.storage.from('media-assets').createSignedUrl(path, 3600);
  
  return { ...data, storage_path: urlData?.signedUrl || path, _raw_path: path } as unknown as StudioAsset;
}

export async function deleteMediaAsset(assetId: string, rawPath?: string): Promise<void> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    let raw = localStorage.getItem('demo_project_data');
    let data = raw ? JSON.parse(raw) : {};
    if (data.assets) {
       data.assets = data.assets.filter((a: any) => a.id !== assetId);
       localStorage.setItem('demo_project_data', JSON.stringify(data));
    }
    return;
  }
  
  if (rawPath) {
    await supabase.storage.from('media-assets').remove([rawPath]);
  }
  await supabase.from('media_assets').delete().eq('id', assetId);
}

export async function saveMediaAsset(asset: any): Promise<void> {
  // Legacy save for metadata updates if needed.
  if (isDemoMode() || !isSupabaseConfigured()) return;
  await supabase.from('media_assets').upsert({
    id: asset.id,
    user_id: asset.user_id,
    asset_type: asset.asset_type,
    storage_path: asset._raw_path || asset.storage_path,
    duration_seconds: asset.duration_seconds
  });
}
