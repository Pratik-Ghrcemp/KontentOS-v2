# Studio Hub Functional Testing Plan

This checklist is for the next phase after the Studio Hub premium UI pass. The goal is to test a real uploaded video end to end, then fix only the pieces that fail.

## 1. Upload Video Through Assets

- Expected behavior: Clicking the Assets upload zone opens the file picker. Selecting an MP4/MOV creates a local asset, selects it, and shows it in Project Media.
- Current likely status: Partial working. `handleFileSelected` creates a local `blob:` preview asset and inserts it into React state. True Supabase upload/progress/thumbnail extraction is not wired in this flow yet.
- Files likely involved: `src/components/tabs/raw-studio/index.tsx`, `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/lib/data/media-service.ts`

## 2. Project Media List

- Expected behavior: The uploaded asset replaces the empty state, displays a readable name and duration, and can be reselected.
- Current likely status: Partial working. State insertion and selection are wired. Duration starts as `15` until video metadata updates the preview duration.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/index.tsx`

## 3. Preview Load And Playback

- Expected behavior: The selected video loads in the center preview, play/pause works, current time updates, and skip buttons seek correctly.
- Current likely status: Mostly working for local uploads. `VideoPreview.tsx` renders a real `<video>` using `activeAsset.previewUrl`; `onLoadedMetadata` updates duration.
- Files likely involved: `src/components/tabs/raw-studio/VideoPreview.tsx`, `src/components/tabs/raw-studio/index.tsx`

## 4. Timeline Tracks And Duration

- Expected behavior: Timeline shows Video 1, Primary Audio, BGM, Text / Overlays, and Captions tracks. Uploaded video should create a clip and the timeline duration should match the video metadata.
- Current likely status: Partial. Timeline duration reads from video metadata, but the initial video clip is still created as a 15-second clip in `handleFileSelected`. It may need to update after metadata is known.
- Files likely involved: `src/components/tabs/raw-studio/index.tsx`, `src/components/tabs/raw-studio/Timeline.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`

## 5. Captions Auto-Generate

- Expected behavior: Auto-Generate shows loading, calls the AI captions route, then adds timestamped caption blocks to the inspector and timeline.
- Current likely status: Partial/mock capable. The route can return mock captions or provider captions, but it does not transcribe the uploaded video content yet. It currently sends duration/context-style input, not the actual video/audio.
- Files likely involved: `src/components/tabs/raw-studio/index.tsx`, `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/app/api/ai/captions/route.ts`, `src/lib/ai/ai-service.ts`

## 6. Caption Edit, Duplicate, Delete, Seek

- Expected behavior: Editing text updates state and preview; duplicate creates a new block; delete removes a block; seek moves the video/playhead to the caption start time.
- Current likely status: Mostly working in local state. Needs browser verification with a real uploaded video.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/Timeline.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`

## 7. Text Overlay Add, Edit, Delete

- Expected behavior: Add Title creates a text overlay, editing updates the overlay, delete removes it, and the Text / Overlays timeline track reflects active overlays.
- Current likely status: Partial working. Title overlays are added, edited, shown in preview, and mapped to the timeline. Lower Third currently shows a toast but does not create a real overlay.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/Timeline.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`

## 8. Effects And LUT Selection

- Expected behavior: Selecting a LUT visibly changes preview color treatment; selecting effects updates selected UI state and eventually applies an effect.
- Current likely status: LUT preview working. `VideoPreview.tsx` maps `selectedLutId` to CSS filters. Effect presets currently toggle state and show badges, but most do not apply real visual processing yet.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`

## 9. Audio Controls And BGM Selection

- Expected behavior: Primary volume changes video volume, BGM volume changes background track volume, BGM selection adds or changes an audio track.
- Current likely status: Needs wiring. Controls update React state, but BGM selection only shows a toast and does not attach an audio source. Primary volume needs to be bound to the video element.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`, `src/components/tabs/raw-studio/Timeline.tsx`, `src/components/tabs/raw-studio/index.tsx`

## 10. Brand Kit Apply

- Expected behavior: Brand color/font/watermark affect captions, text overlays, and preview watermark.
- Current likely status: Partial. Brand color affects text overlay background. Apply button currently shows a toast. Font and watermark need real preview/export wiring.
- Files likely involved: `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/components/tabs/raw-studio/VideoPreview.tsx`, `src/lib/rendering/composition-builder.ts`

## 11. Settings Autosave And Project Title

- Expected behavior: Project title updates the toolbar and persists locally in demo mode. Supabase mode should persist to the project record.
- Current likely status: Local title update working. Demo localStorage persistence is wired. Supabase project save/load should be tested separately.
- Files likely involved: `src/components/tabs/raw-studio/index.tsx`, `src/components/tabs/raw-studio/RawStudioToolbar.tsx`, `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/lib/data/projects-service.ts`

## 12. Export Flow

- Expected behavior: Export compiles selected media, timeline clips, captions, text overlays, audio settings, brand kit, platform preset, and starts a render job.
- Current likely status: Mock/stub capable. The UI can start a render job through the current render service abstraction, but production-quality video rendering still needs full worker/FFmpeg validation.
- Files likely involved: `src/components/tabs/raw-studio/index.tsx`, `src/components/tabs/raw-studio/RawStudioInspector.tsx`, `src/lib/rendering/render-service.ts`, `src/lib/rendering/composition-builder.ts`, `src/lib/rendering/workers/local-ffmpeg-worker.ts`

## Recommended Test Order

1. Test local MP4 upload and preview playback.
2. Fix timeline clip duration to match loaded metadata if needed.
3. Test caption CRUD and seek.
4. Test text overlay CRUD and preview rendering.
5. Wire primary volume to the video element.
6. Decide BGM behavior and add real selected-track state.
7. Test LUT filters and decide which effects should become real preview effects.
8. Wire Brand Kit font/watermark into preview.
9. Run export with current mock/local renderer and record gaps.
10. Only after local flow is stable, test Supabase persistence and real uploads.
