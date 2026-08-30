# Studio Hub Advanced Reality Audit

Baseline checks:
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 1 hook warning and 1 `<img>` warning.
- `npm test` is not available (`Missing script: "test"`).

## Executive Reality Score

- Architecture: 7/10
- Functional Reality: 4/10
- Precision: 6/10
- State Consistency: 5/10
- Cross-Feature Reliability: 4/10
- Undo/Redo: 4/10
- Export Reality: 2/10
- UX Consistency: 5/10
- Production Readiness: 3/10

## Issues Found

Issue ID: SHA-001
Severity: High
Feature: Captions CRUD
Location: `src/components/tabs/raw-studio/index.tsx:379-382`, `src/components/tabs/raw-studio/RawStudioContext.tsx:41-46`
Current Behavior: `updateCaption`, `addCaption`, `deleteCaption`, and `duplicateCaption` are empty functions, so caption edit controls do nothing.
Expected Behavior: Caption actions should update canonical state, persist, and reflect in preview/export.
Root Cause: Legacy caption API was left wired into the UI without implementation.
Reproduction Steps: Open Captions, try rewrite/add/delete/duplicate caption actions.
Impact: Captions look editable but are effectively dead.
Recommended Fix: Route caption CRUD through `editState` or remove the controls until wired.
Risk of Fix: Medium; caption data model will need persistence alignment.

Issue ID: SHA-002
Severity: High
Feature: Export modal download flow
Location: `src/components/tabs/raw-studio/RawStudioInspector.tsx:246-290`
Current Behavior: "Download MP4" and "Copy SRT Subtitles" only toast; they do not use `activeJob.result_json`.
Expected Behavior: Buttons should download the finished artifact URLs from the completed render job.
Root Cause: Completion UI is mocked independently of the render result.
Reproduction Steps: Export a job to completion, click download/copy.
Impact: Export appears finished but no real artifact retrieval happens.
Recommended Fix: Bind the modal to `result_json.fileUrl` and `result_json.srtUrl`.
Risk of Fix: Low; mostly UI plumbing.

Issue ID: SHA-003
Severity: Critical
Feature: Render backend reality
Location: `src/lib/rendering/render-service.ts:17-159`, `src/app/api/render-jobs/route.ts:1-24`, `src/app/api/render-jobs/[jobId]/route.ts:1-13`
Current Behavior: Default render flow is mock/simulated; API routes return queued/completed placeholders.
Expected Behavior: Export should create, track, and resolve real backend jobs.
Root Cause: The production queue/worker and DB integration are still stubs.
Reproduction Steps: Trigger export in demo/unconfigured mode or call the render-job API routes.
Impact: High confidence export UI with no real render execution.
Recommended Fix: Replace the mock queue with the real job persistence + worker path.
Risk of Fix: High; touches backend contracts and job lifecycle.

Issue ID: SHA-004
Severity: Critical
Feature: Preview vs export parity
Location: `src/lib/rendering/builder.ts:20-98`, `src/lib/rendering/composition-builder.ts:10-75`, `src/lib/rendering/ffmpeg-command-planner.ts:1-39`
Current Behavior: Many editor properties are lost before render planning: text position/style, keyframes, LUT/filter details, audio clip data, and several clip properties.
Expected Behavior: Export should serialize the same visual/audio state seen in preview.
Root Cause: The request builder captures data, but the composition builder and FFmpeg planner discard most of it.
Reproduction Steps: Add text, keyframes, LUTs, or audio settings, then inspect the render composition.
Impact: Preview can look correct while export is materially different.
Recommended Fix: Preserve all relevant clip, text, audio, and animation properties through composition and worker planning.
Risk of Fix: High; requires reworking the render contract.

Issue ID: SHA-005
Severity: High
Feature: Brand kit export
Location: `src/lib/rendering/composition-builder.ts:40-75`, `src/components/tabs/raw-studio/VideoPreview.tsx:1103-1118`
Current Behavior: Preview shows watermark and brand font, but export composition only reads `request.brandKit?.font` and ignores the actual `BrandKit` shape and watermark settings.
Expected Behavior: Export should reflect the selected brand kit exactly.
Root Cause: Export code expects a different brand-kit schema than the editor stores.
Reproduction Steps: Change brand font or watermark position and export.
Impact: Branded preview does not match the rendered file.
Recommended Fix: Map `primaryFont`, watermark, and palette fields into the render composition.
Risk of Fix: Medium.

Issue ID: SHA-006
Severity: High
Feature: Audio/BGM and effects export
Location: `src/components/tabs/raw-studio/index.tsx:78-80,586-602`, `src/components/tabs/raw-studio/RawStudioInspector.tsx:894-906,1289-1293`
Current Behavior: `activeEffects` only toggles local UI state, and `selectedBgmId` only affects preview playback. Neither is serialized into the render path.
Expected Behavior: User-selected effects and BGM should survive export.
Root Cause: These states live outside canonical `EditState` and are not consumed by the render builder.
Reproduction Steps: Toggle effects or select BGM, then export and inspect the render payload.
Impact: UI suggests creative controls that do not persist to the final output.
Recommended Fix: Promote effect/BGM choices into canonical state and include them in render serialization.
Risk of Fix: High; audio/video sync may need contract changes.

Issue ID: SHA-007
Severity: High
Feature: Export options UI
Location: `src/components/tabs/raw-studio/RawStudioInspector.tsx:218-226`, `src/components/tabs/raw-studio/index.tsx:545-551`
Current Behavior: The Quality dropdown is uncontrolled and ignored; `handleExport` always passes `quality: 'high'`. The Captions dropdown shows Off, but the handler only toggles `burnIn`, so Off behaves like sidecar.
Expected Behavior: UI controls should drive the render request exactly.
Root Cause: Export modal controls are not wired to request state.
Reproduction Steps: Change quality or choose Off for captions, then inspect the request.
Impact: The modal presents choices that do not affect output.
Recommended Fix: Wire quality to state and model captions as true `burn/sidecar/off`.
Risk of Fix: Low to medium.

Issue ID: SHA-008
Severity: Medium
Feature: Undo/redo stability
Location: `src/components/tabs/raw-studio/Timeline.tsx:56-144`, `src/lib/editing/engine.ts:360-387`
Current Behavior: Timeline move/trim dispatches `MOVE_ITEM`/`TRIM_ITEM` on every pointermove, but transient history compression only applies to `UPDATE_PROPERTIES` and `BATCH_UPDATE_PROPERTIES`.
Expected Behavior: One drag gesture should usually produce one undoable commit.
Root Cause: Timeline interactions bypass the transient history path.
Reproduction Steps: Drag a clip, then press Undo repeatedly.
Impact: Undo stack gets noisy and gesture history is fragmented.
Recommended Fix: Use transient actions for timeline drags/trims, or batch them at pointerup.
Risk of Fix: Medium.

Issue ID: SHA-009
Severity: Medium
Feature: Persistence / canonical state
Location: `src/components/tabs/raw-studio/index.tsx:225-252`, `src/lib/data/projects-service.ts:1-17`, `src/lib/data/captions-service.ts:1-23`, `src/lib/data/text-overlays-service.ts:1-23`
Current Behavior: Raw Studio restores/saves only demo localStorage state; the imported project/media/caption/render history services are not actually used here.
Expected Behavior: Editor state should round-trip through the real persistence layer when configured.
Root Cause: The component still relies on demo-only state management.
Reproduction Steps: Reload after editing in demo mode, or inspect whether real save APIs are invoked.
Impact: Production data flow is incomplete even though the UI looks persistent.
Recommended Fix: Wire save/load calls into the editor lifecycle and project changes.
Risk of Fix: Medium.

Issue ID: SHA-010
Severity: Low
Feature: Precision thresholds
Location: `src/lib/editing/engine.ts:291-337`, `src/lib/editing/geometry/alignment.ts:1-44`
Current Behavior: Snapping uses strict `<` thresholds, and drag math rounds repeatedly during motion.
Expected Behavior: Edge snapping and sub-pixel movement should feel stable and symmetric.
Root Cause: Threshold comparisons and repeated rounding are slightly aggressive.
Reproduction Steps: Nudge objects and clips near snap boundaries or make tiny repeated moves.
Impact: Small jitter or missed snaps near the threshold.
Recommended Fix: Review threshold inclusivity and reduce intermediate rounding.
Risk of Fix: Low.

## Feature Reality Matrix

| Feature | UI Exists | Actually Works | State Connected | Preview Connected | Export Connected | Edge Cases Verified |
| --- | --- | --- | --- | --- | --- | --- |
| Upload / asset ingest | Yes | Mostly | Partial | Yes | Partial | Partial |
| Video preview / playback | Yes | Mostly | Yes | Yes | Partial | Partial |
| Timeline move / trim / split | Yes | Mostly | Yes | Yes | Partial | Partial |
| Markers / playhead | Yes | Mostly | Yes | Yes | Partial | Partial |
| Text / overlays | Yes | Mostly | Yes | Yes | No | Partial |
| Captions CRUD | Yes | No | No | Partial | No | No |
| AI generation | Yes | Mostly | Partial | Partial | No | Partial |
| Effects / LUTs | Yes | Partial | Partial | Partial | Partial | No |
| Audio / BGM | Yes | Partial | Partial | Preview only | No | Partial |
| Keyframes | Yes | Mostly | Yes | Yes | No | Partial |
| Layer / z-index | Yes | Mostly | Yes | Yes | Partial | Partial |
| Brand kit | Yes | Partial | Partial | Yes | Partial | Partial |
| Export / render | Yes | Partial | Partial | Partial | No in mock mode | Partial |
| Undo / redo | Yes | Partial | Yes | N/A | N/A | Partial |
| Settings / persistence | Yes | Partial | Partial | Partial | No | No |

## False Confidence Detection

- The pure-function test suite is strong, but it mostly validates local math and reducers, not the end-to-end UI/export contract.
- `npx tsc --noEmit` is clean, which hides the fact that several controls are no-ops or mock-only.
- `npm test` is missing entirely, so there is no conventional project-level test entrypoint to gate integrated behavior.
- Existing tests do not appear to cover the fake download buttons, export completion UX, or preview-vs-render parity.

## Confirmed Bugs

- Empty caption CRUD handlers.
- Fake export/download buttons.
- Mock render lifecycle in the default path.
- Export payload loses preview state.
- Brand kit schema mismatch in export.
- BGM/effects not exported.
- Quality control ignored and caption Off mis-modeled.
- Timeline drags pollute history.

## Potential Risks

- Persistence remains demo-first until the real save/load path is wired.
- Snapping and rounding may show small jitter under repeated edits.
- Audio automation may diverge further once real worker execution is introduced.

## Intentional Limitations

- Mock render service and placeholder API routes are explicitly stubbed.
- Demo localStorage persistence is intentional for unconfigured environments.
- Some mock assets and presets are clearly labeled as preview content.

## Production Blockers

- No real render backend.
- No export parity for text, keyframes, audio, LUTs, and brand kit.
- No working caption CRUD.

## Recommended Fix Roadmap

### Phase A - Critical Bugs
- Replace mock render flow with real job persistence and worker execution.
- Preserve preview state through render composition and export.
- Fix caption CRUD and export download actions.

### Phase B - Functional Gaps
- Wire quality/caption options to request state.
- Serialize BGM, effects, and brand kit correctly.
- Connect persistence services to the editor lifecycle.

### Phase C - Precision Problems
- Batch timeline drag history.
- Tighten snap thresholds and reduce rounding drift.

### Phase D - UX / Polish
- Replace toast-only completion affordances.
- Clean up legacy mock indicators once the real path is live.
- Remove or relabel controls that are intentionally unavailable.
