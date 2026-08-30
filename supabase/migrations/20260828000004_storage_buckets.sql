-- ==========================================
-- Migration: Storage Buckets and Policies
-- ==========================================

-- 1. Create a "media" bucket for raw-studio uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Authenticated users can upload files to the media bucket
CREATE POLICY "Users can upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Policy: Users can view their own media (and public media if bucket is public, but let's restrict to owner or public)
CREATE POLICY "Public media is viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- 4. Policy: Users can update their own media
CREATE POLICY "Users can update own media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Policy: Users can delete their own media
CREATE POLICY "Users can delete own media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
