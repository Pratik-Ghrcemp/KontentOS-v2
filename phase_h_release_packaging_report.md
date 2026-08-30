# Phase H - Production Deployment Preparation & Release Packaging

## Status

Phase H release packaging is complete for the current local-production hardening state.

## Release Artifacts

- `docs/production-release.md`: deployment checklist, environment matrix, smoke test, and rollback notes.
- `docs/rendering-pipeline.md`: updated from mock-only Phase 4 language to the current Phase G FFmpeg/download pipeline.
- `package.json`: added repeatable release verification scripts.
- `README.md`: updated production verification command and FFmpeg prerequisite.

## Verification Commands

```bash
npm run typecheck
npm run test:render:phase-g
npm run build
```

The combined gate is:

```bash
npm run verify:release
```

## Production Readiness Notes

- The browser download blocker is addressed through `GET /api/render-jobs/download`.
- Rendered MP4 downloads are constrained to the configured local render output directory.
- The release path now documents Supabase, AI, FFmpeg, and render-output environment requirements.
- The current job registry remains in memory and should be replaced with Supabase-backed job persistence before horizontally scaled production.

## Release Recommendation

Proceed with a controlled production-like deployment or staging release after `npm run verify:release` passes in the target runtime environment.
