# Supabase Storage Integration

KontentOS handles media assets (video, audio, images) through a robust pipeline connecting the frontend to Supabase Storage.

## Overview
- **Storage Bucket:** \`media-assets\` (must be created manually or via migration).
- **Database Table:** \`media_assets\` tracks metadata like duration, dimensions, mime type, and file size.
- **Demo Mode:** When running without Supabase keys, assets are stored in local memory using \`URL.createObjectURL()\` and metadata is saved to \`localStorage\`.

## Asset Upload Flow
1. **Selection:** User selects a file (Video/Audio/Image) in the Assets panel.
2. **Metadata Extraction:** Client-side utilities estimate duration (for video/audio) and dimensions (for images) using native HTML elements.
3. **Upload (Prod):** The file is uploaded to the \`media-assets\` bucket under the path \`{user_id}/{project_id}/{asset_id}/{filename}\`.
4. **Database Insert:** A metadata row is inserted into \`media_assets\`.
5. **Signed URLs:** Because the bucket is private, a signed URL (valid for 1 hour) is generated immediately for previewing in the editor.

## Row Level Security (RLS)
The `media-assets` storage bucket requires the following policies:
- **Insert:** Users can only upload to paths starting with their own \`auth.uid()\`.
- **Select:** Users can only view objects in their folder.
- **Delete:** Users can only delete objects in their folder.

## Production TODOs
For a fully public SaaS launch, consider implementing:
- **Server-side Validation:** Limit file sizes via Supabase Storage settings (e.g. 500MB max).
- **Virus Scanning:** Use Supabase Webhooks to trigger a scanner function upon upload.
- **Transcoding Queue:** Use an Edge Function to trigger an external transcoder to convert all uploads to an optimized internal format (like HLS or standard 720p mp4) for smoother browser preview.
- **Thumbnail Generation:** Generate and save a separate lightweight thumbnail image for the Assets sidebar.
