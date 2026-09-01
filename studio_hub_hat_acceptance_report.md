# Studio Hub Human Acceptance Test Report

Date: 2026-08-31
App URL tested: http://localhost:3001
Browser: Playwright Chromium, desktop viewport 1440x950
Test media: `sample-4.mp4` (browser metadata duration: 30.08s)

## SECTION A - PASS

A1 Upload: PASS  
MP4 upload worked. Asset appeared in Project Media, a timeline clip was created, preview rendered the first frame, and duration populated.

A2 Playback: PASS  
Spacebar playback started successfully. The video element advanced from 0s, timeline seek worked, and playhead drag/scrub changed video currentTime.

A3 Split/Trim: PASS  
Split at the playhead produced two visible `sample-4.mp4` timeline pieces. Drag interaction on the clip completed without negative duration or timeline breakage visible.

A4 Move: PASS  
Timeline clip drag interaction completed and clip remained visible on the expected video track.

A5 Lock/Mute: PASS WITH LIMITED AUDIO CONFIRMATION  
Track lock/mute controls were present and clickable. Headless testing confirmed interaction/state surface, but did not aurally verify mute/unmute output.

Evidence:
- `test-results/hat-a-upload.png`
- `test-results/hat-a-editing.png`

## SECTION B - ISSUE

B1 Whisper Installation: ISSUE  
The captions panel shows `Local AI Speech Engine: Setup Required`. Whisper binary and model weights are detected, but FFmpeg is missing.

B2 Real Caption Generation: ISSUE  
Caption blocks were created and rendered in preview, but server/code path confirms fallback/mock caption text is used in demo mode when real transcription is unavailable. This does not certify real speech-to-text from the uploaded video.

B3 Caption Styles: PASS  
Alex Hormozi, Neon Glow, Minimalist, and Classic Boxed controls were visible and clickable. Preview caption styling changed.

B4 Caption Editing: PASS  
Transcript phrase editing accepted text changes in the caption editor.

Evidence:
- `test-results/hat-b-install.png`
- `test-results/hat-b-captions.png`

## SECTION C - ISSUE

C1 Silence Detection: ISSUE  
Smart Cut panel opened and the Scan Dead Air & Pauses control was available, but no detected pause list/candidates appeared after scanning.

C2 Filler Word Detection: ISSUE  
No filler candidates appeared. This is downstream of B2 because filler detection depends on caption transcript items.

C3 Candidate Review: ISSUE  
No selectable Smart Cut candidates were available, so timestamp jump, checkbox selection, and Time Saved metric could not be certified.

C4 Apply Smart Cuts: ISSUE  
Apply Smart Cuts button was not available because no cut candidates were present.

C5 Undo/Redo: ISSUE  
Blocked by C4. There was no Smart Cut application to undo/redo.

Evidence:
- `test-results/hat-c-silence.png`

## SECTION D - PASS

D1 Add Text: PASS  
Add Title and Lower Third actions created visible canvas/timeline text overlays.

D2 Freehand Drawing: PASS  
Draw tool opened. Pointer stroke on the canvas created a visible drawing overlay and timeline item.

Evidence:
- `test-results/hat-d-text.png`

## SECTION E - PASS

E1 Audio DSP: PASS WITH LIMITED AUDIO CONFIRMATION  
Voice Cleanup and volume controls were visible and responsive. Headless testing did not aurally verify the DSP difference.

E2 Color Effects: PASS  
Kodak Portra, Teal & Orange, and Studio Clarity LUT controls were visible and clickable. Preview remained rendered, not black/glitched.

Evidence:
- `test-results/hat-e-effects.png`

## SECTION F - ISSUE

F1 Export: ISSUE  
Export modal opened with Instagram Reels, 9:16, 1080x1920, High quality, and Burn-in captions selected. Starting export issued `POST /api/render-jobs`, but the API returned 400.

API error:
```text
Failed to create media asset reference in Supabase: Expected 3 parts in JWT; got 1
```

F2 Exported Video Check: ISSUE  
No exported MP4/download was produced, so visual/audio/export parity checks could not be completed.

Evidence:
- `test-results/hat-f-export-modal.png`
- `test-results/hat-f-export-result.png`
- `test-results/hat-f-export-dom-click.png`

## Focused AntiGravity Prompt

Investigate Studio Hub HAT failures without touching unrelated UI/features:

1. Captions/Whisper readiness: Captions panel reports FFmpeg missing while Whisper binary and model weights are detected. Fix local FFmpeg detection/configuration so Check Installation can show full READY only when Whisper + model + FFmpeg are usable.
2. Real transcription: Auto Generate Captions currently creates visible caption blocks, but falls back to mock/demo text when local transcription is unavailable. Ensure HAT can distinguish real local Whisper output from fallback, and surface a blocking error instead of mock captions for real acceptance mode.
3. Smart Cut: Silence scan did not produce reviewable pause candidates for the uploaded MP4, and filler scan/apply/undo-redo could not be certified. After real captions are fixed, verify C1-C5 end to end with selectable candidates, seek-on-click, Time Saved updates, Apply Smart Cuts ripple behavior, and undo/redo restoration.
4. Export: Export POST fails with `Failed to create media asset reference in Supabase: Expected 3 parts in JWT; got 1` while using the super-admin demo token. Fix render job auth/storage handling for local/demo uploaded assets, then verify export reaches 100%, produces downloadable MP4, and preserves captions/text/drawing/LUT/audio.
