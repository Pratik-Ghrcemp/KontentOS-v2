# Supabase Data Flow Architecture

This document describes the data flow architecture for KontentOS Raw Studio, bridging the gap between local demo mock data and a real production Supabase database.

## Architecture Overview

Instead of letting UI components (like `raw-studio/index.tsx`) directly call `supabase.from(...)` or `localStorage.getItem(...)`, we have introduced a **Data Service Layer** in `src/lib/data/`.

This ensures:
1. **Clean UI Components**: Components just call `getProjects()`, `saveCaptions()`, etc.
2. **Demo Mode Fallback**: If the app runs without Supabase env vars, the services fallback to `localStorage`.
3. **Type Safety**: All services rely on `Database` types from `src/lib/database.types.ts`.

## Service Layer Files

- `projects-service.ts`: Fetches and saves the core project config (title, preset, editor settings JSON).
- `media-service.ts`: Fetches uploaded media assets linked to the user.
- `captions-service.ts`: Replaces old UI logic. Syncs caption segments to the DB.
- `text-overlays-service.ts`: Syncs custom text layers.
- `ai-history-service.ts`: Saves generation events to `ai_generation_events`.
- `render-history-service.ts`: Syncs export job history to `render_jobs`.

## Auto-Save Mechanism

The `RawStudio` component implements a debounced auto-save effect. 
Every time the user modifies captions, overlays, or settings, the effect waits 1.5s after the last edit before writing everything through the service layer. A UI indicator (Saving... -> Saved) provides user feedback.

## Row Level Security (RLS) Assumptions

Every table uses `auth.uid() = user_id`. 
The `user_id` is always passed down from the React Auth Context `user.id`.
No service role keys are exposed to the client.

## Moving to Production
To switch from Demo Mode to Production:
1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
2. Push all migrations in `supabase/migrations/` using the Supabase CLI: `supabase db push`.
3. The services will automatically detect configuration and start routing traffic to your real DB instead of localStorage.
