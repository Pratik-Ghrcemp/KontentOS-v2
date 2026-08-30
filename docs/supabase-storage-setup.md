# Supabase Storage Setup Guide

To enable real media uploading in KontentOS, you must configure a storage bucket in your Supabase project.

## 1. Create the Bucket
1. Go to your Supabase Project Dashboard.
2. Navigate to **Storage** (left sidebar).
3. Click **New Bucket**.
4. Name it exactly: \`media-assets\`
5. Ensure **Public bucket** is toggled **OFF** (we use signed URLs for security).
6. Click **Save**.

## 2. Apply Row Level Security (RLS) Policies
To ensure users can only upload and read their own media, run the following SQL snippet in the Supabase **SQL Editor**:

\`\`\`sql
-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-assets' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2. Allow users to update their own media files
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-assets' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Allow users to read/download their own media files
CREATE POLICY "Users can read their own media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-assets' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Allow users to delete their own media files
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-assets' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
\`\`\`

## 3. Verify Frontend Behavior
Once the bucket and policies are in place, test the application:
1. Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Login to KontentOS.
3. Open Raw-to-Reel and upload a video under 50MB.
4. Verify the asset appears in the Supabase Dashboard -> Storage -> media-assets.
