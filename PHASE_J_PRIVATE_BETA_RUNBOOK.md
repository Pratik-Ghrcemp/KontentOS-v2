# Phase J - Real Deployment and Private Beta Runbook

## Objective

Validate Studio Hub in a fresh deployed environment with real creators using it independently.

This phase is about deployment reality and user behavior, not more local audit reports.

## Execution Order

1. Clean and back up the GitHub repository.
2. Prepare the production deployment environment.
3. Run FFmpeg verification on the fresh server.
4. Configure Supabase production URLs.
5. Configure the OpenAI production key.
6. Run a deployed end-to-end smoke test.
7. Invite 2-5 real beta users.
8. Collect feedback.
9. Fix only real deployment blockers and beta-reported issues.

## Gate 1 - Repository Freeze and Backup

- Confirm `git status --short` is reviewed.
- Commit the current release-candidate state.
- Push to GitHub.
- Create a release-candidate tag, for example `studio-hub-private-beta-rc1`.
- Confirm `.env.local`, media fixtures, render outputs, and local scratch files are not committed unless intentionally required.

Suggested commands:

```bash
git status --short
npm run verify:release
git add README.md docs package.json package-lock.json RELEASE_FREEZE.md PHASE_J_PRIVATE_BETA_RUNBOOK.md phase_h_release_packaging_report.md
git commit -m "Freeze Studio Hub private beta release candidate"
git tag studio-hub-private-beta-rc1
git push origin main --tags
```

Adjust the branch name if the release branch is not `main`.

## Gate 2 - Production Environment

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEMO_MODE=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
LOCAL_FFMPEG_PATH=
LOCAL_RENDER_OUTPUT_DIR=
```

Confirm:

- Server-only secrets do not use a `NEXT_PUBLIC_` prefix.
- The render output directory is writable by the app process.
- The render output directory is not publicly mounted.
- The host supports long-running FFmpeg work, or a render worker is configured before broader beta use.

## Gate 3 - Fresh Server FFmpeg Test

Run on the deployed host or the closest production-equivalent shell:

```bash
npm install
npm run typecheck
npm run test:render:phase-g
```

Pass criteria:

- FFmpeg is runnable.
- The Phase G render test creates a physical MP4.
- The MP4 is larger than the minimum valid stream threshold used by the test.
- No local-only path assumption blocks rendering.

## Gate 4 - Supabase Production Configuration

In Supabase:

- Apply migrations.
- Set production Site URL.
- Set production redirect URLs.
- Confirm Email provider is enabled.
- Confirm storage buckets and policies are present.
- Confirm Row Level Security policies allow only intended user access.

## Gate 5 - OpenAI Production Configuration

- Configure `OPENAI_API_KEY`.
- Confirm `AI_PROVIDER=openai` unless Azure OpenAI is intentionally selected.
- Confirm `OPENAI_MODEL` is set to the intended production model.
- Run one AI caption, hook, hashtag, and repurpose request through the deployed app.

## Gate 6 - Deployed Smoke Test

Use a production test account:

- Sign in.
- Upload or select a short MP4.
- Add a title.
- Generate or add captions.
- Add a watermark.
- Export an Instagram Reels render.
- Wait for render completion.
- Download through `/api/render-jobs/download`.
- Open the downloaded MP4 and verify duration, visuals, captions, and watermark.
- Reload the app and confirm project state persists.

## Gate 7 - Private Beta

Invite 2-5 creators who match the intended Studio Hub user profile.

Ask them to complete:

- Sign in.
- Create one short reel from raw footage.
- Use at least one AI feature.
- Export and download the final MP4.
- Report where they got stuck, confused, or slowed down.

## Feedback Triage

Classify feedback as:

- P0: Cannot sign in, cannot upload, cannot save, cannot render, cannot download.
- P1: Workflow works but breaks a core creator expectation.
- P2: Usability friction or missing polish.
- P3: Feature request or future expansion.

During Phase J, fix P0 and high-confidence P1 issues first. Defer P2/P3 until beta behavior shows a pattern.

## Exit Criteria

Phase J is complete when:

- The app runs in a fresh deployed environment.
- Production Supabase and OpenAI are configured.
- FFmpeg render works outside the local development machine.
- At least one full deployed creator workflow succeeds end to end.
- 2-5 beta users have tried the product independently.
- Feedback is captured and prioritized.

