-- Migration: Create Storage Bucket and Policies

-- Note: In a real Supabase environment, the 'storage' schema might require 
-- special permissions to insert into. If this fails, create the bucket via UI.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-assets', 'media-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects
-- Allow users to upload to their own folder path
CREATE POLICY "Users can upload their own media" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'media-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own media
CREATE POLICY "Users can view their own media" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'media-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own media" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'media-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
