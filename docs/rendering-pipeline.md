# Raw-to-Reel Rendering Pipeline Architecture

This document describes the backend rendering pipeline for KontentOS Raw Studio.

## Current State (Phase G)
The rendering pipeline now supports a real local FFmpeg path for production-hardening validation.
When a user clicks export, the app builds a strongly typed `RenderRequest` object from the editor state.
This includes media, selected platform preset, captions, audio settings, effects, and brand watermark data.

`POST /api/render-jobs` creates an in-memory `RenderJob`, builds a render composition, and runs local FFmpeg when a native binary is available. Completed FFmpeg renders return a browser-safe download URL through `GET /api/render-jobs/download`, which streams the generated MP4 as an attachment instead of exposing a blocked `file://` URL.

If no local FFmpeg binary is available, the API falls back to the existing simulated render behavior so the export UI remains usable in lightweight environments.

## Production Architecture Direction
The current local worker is appropriate for development, demos, and controlled single-host deployments. For multi-user production scale, move render execution to a persistent worker backed by database job state and object storage:

### 1. Database Schema (Supabase)
*   **\`render_jobs\` table**: Tracks job state (queued, processing, completed, failed), input JSON (`RenderRequest`), output JSON (`RenderResult`), and timestamps.
*   **\`render_job_events\` table**: Optional append-only log for detailed rendering progress/errors.

### 2. File Storage
*   Media and generated assets are stored in the existing Supabase `media` bucket.
*   Generated outputs (e.g., .mp4, .srt) are saved with unique IDs and signed URL links.

### 3. Rendering Worker
Since video rendering (FFmpeg, ML models) is CPU/GPU intensive, it cannot run in a serverless Edge Function reliably.
*   **Option A**: Run a dedicated containerized worker (Docker + Node + FFmpeg) that listens to a queue.
*   **Option B**: Use a cloud video rendering API (like Remotion or AWS Elemental MediaConvert).

### 4. API & Queue
*   **API Routes**: `POST /api/render-jobs` will authenticate the user, validate the `RenderRequest`, insert into DB, and push to a queue (e.g., SQS or Redis).
*   **Updates**: Clients will subscribe to Supabase Realtime on the `render_jobs` table to update the UI progress bar.

### 5. Local Render Runtime
*   `LOCAL_FFMPEG_PATH`: Optional server-only override for FFmpeg.
*   `LOCAL_RENDER_OUTPUT_DIR`: Optional server-only output directory for generated MP4 files.
*   `GET /api/render-jobs/download`: Streams only `.mp4` files inside `LOCAL_RENDER_OUTPUT_DIR` or the default temp render directory.

## Security Considerations
*   RLS policies ensure users can only create, view, or cancel their own jobs.
*   Rate limiting to prevent abuse (e.g., max 5 concurrent jobs).
*   Signed URLs for downloading final outputs to prevent unauthorized access.
*   The local download endpoint constrains paths to the configured render output directory and sanitizes attachment filenames.
