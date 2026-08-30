# Raw-to-Reel Rendering Pipeline Architecture

This document describes the backend rendering pipeline for KontentOS Raw Studio.

## Current State (Phase 4)
Currently, the rendering pipeline operates in **Mock Mode** using the `RenderService`. 
When a user clicks export, it builds a strongly-typed `RenderRequest` object from the editor state.
This includes media, selected platform preset, captions, audio settings, and effects.
The service generates a mock `RenderJob` and simulates progress via intervals without processing real video.

## Future Implementation Architecture
To process real video in the future, the following components are recommended:

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

## Security Considerations
*   RLS policies ensure users can only create, view, or cancel their own jobs.
*   Rate limiting to prevent abuse (e.g., max 5 concurrent jobs).
*   Signed URLs for downloading final outputs to prevent unauthorized access.
