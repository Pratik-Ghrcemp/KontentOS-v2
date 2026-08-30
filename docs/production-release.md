# KontentOS Production Release Guide

This guide packages the current Phase G hardening work into a repeatable release checklist.

## Release Verification

Run the full local release gate before tagging or deploying:

```bash
npm run verify:release
```

The gate runs:

```bash
npm run typecheck
npm run test:render:phase-g
npm run build
```

`test:render:phase-g` requires a runnable FFmpeg binary and the local `video.mp4` fixture that is already used by the rendering hardening suite.

## Required Environment

Client-safe variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
NEXT_PUBLIC_DEMO_MODE=false
```

Server-only variables:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
LOCAL_FFMPEG_PATH=/usr/bin/ffmpeg
LOCAL_RENDER_OUTPUT_DIR=/tmp/kontentos-renders
```

Optional Azure OpenAI and external worker variables remain documented in `.env.example`.

## Deployment Checklist

- Confirm Supabase migrations are applied with `npx supabase db push` or through the Supabase SQL editor.
- Confirm Supabase Auth Site URL and redirect URLs match the production host.
- Confirm no server-only secrets use a `NEXT_PUBLIC_` prefix.
- Confirm the production runtime can execute FFmpeg, or configure a dedicated external worker before accepting creator render traffic.
- Confirm `LOCAL_RENDER_OUTPUT_DIR` exists, is writable by the app process, and is not publicly mounted.
- Run `npm run verify:release` after setting production-like environment variables.
- Build and start the app with `npm run build` and `npm run start`.

## Smoke Test

After deploy:

- Sign in with a production test account.
- Upload or select a short MP4 media asset.
- Create a Raw Studio timeline with video, title text, captions, and watermark.
- Export using the Instagram Reels preset.
- Poll the render job until it completes.
- Download the MP4 through `/api/render-jobs/download`.
- Verify the downloaded file opens locally and has the expected duration.

## Rollback Notes

- Keep the previous deployment artifact available until the smoke test passes.
- If render downloads fail, rollback the app first, then preserve the render output directory for inspection.
- If Supabase migrations are involved, document whether each migration is forward-only before release. The current Phase G changes are app-level and do not add new migrations.

## Current Known Limits

- Render jobs are tracked in an in-memory registry in `src/app/api/render-jobs/route.ts`, so job state does not survive process restarts.
- Local FFmpeg rendering is best suited to a single server or controlled demo host.
- Multi-user production should move rendering to a queue-backed worker and persist final outputs in object storage with signed URLs.
