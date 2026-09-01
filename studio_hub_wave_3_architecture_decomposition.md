# 📐 STUDIO HUB — WAVE 3 FORENSIC ARCHITECTURE DECOMPOSITION
**Document Purpose:** Architectural decomposition of Wave 3 into isolated, surgical sub-waves based on shared state, rendering, and runtime boundaries.  
**Phase:** PHASE 16 — WAVE 3 (REAL FEATURE EXECUTION)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_wave_3_architecture_decomposition.md`

---

## 1. 🔍 EXECUTIVE SUMMARY: THE NATURE OF WAVE 3

Unlike Wave 2 (which fixed Preview $\leftrightarrow$ Export synchronization and FFmpeg filter graphs), **Wave 3 is focused on Real Feature Execution** — replacing UI stubs, static placeholders, and mock simulations with real, persistent runtime capabilities.

To avoid cross-domain regressions and state corruption, Wave 3 is decomposed into **5 independent surgical sub-waves**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                   WAVE 3 SURGICAL SUB-WAVE DECOMPOSITION                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3A: ASSET & BRAND KIT LIFECYCLE                                             │
│     • Real Asset Deletion (with safe timeline reference cleanup)            │
│     • Real Asset Renaming (persistent in asset library)                     │
│     • Real Brand Kit Logo Upload (persistent File/Data URL in BrandKit)     │
│                                                                             │
│ 3B: INTERACTIVE FREEHAND DRAWING ENGINE                                     │
│     • Pointer capture drawing mode on VideoPreview canvas                   │
│     • Real-time SVG stroke path & points generation                         │
│     • Timeline persistence & multi-stroke layer creation                    │
│                                                                             │
│ 3C: REAL AUDIO DSP ENGINE                                                   │
│     • Real Voice Cleanup DSP (Web Audio Biquad highpass/lowpass/compressor) │
│     • FFmpeg Export DSP filter parity (highpass=f=100,lowpass=f=8000,afftdn)│
│                                                                             │
│ 3D: STRUCTURAL TEMPLATE ENGINE                                              │
│     • Real timeline layout generation (Viral Hook-Body-CTA, Tutorial, etc.) │
│     • Dynamic multi-track clip insertion (Hook Title, Body Video, CTA Badge)│
│     • Aspect ratio & layout auto-calibration                                │
│                                                                             │
│ 3E: SPEECH INTELLIGENCE & AUTO-TRANSCRIPTION ENGINE                         │
│     • Real speech recognition / Web Audio transcription pipeline            │
│     • Timestamped phrase and word boundary generation                       │
│     • Automated caption track timeline synchronization                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧩 SUB-WAVE DEEP FORENSIC SPECIFICATIONS

### Sub-Wave 3A: Asset & Brand Kit Lifecycle
* **Defects Addressed:** `UP-03` (Asset Delete & Rename), `B-02` (Brand Kit Logo Upload).
* **Root Cause:** Assets panel only supports upload into temporary memory array without delete/rename handlers; Brand Kit logo input does not persist custom uploaded logo images.
* **Target Files:**
  - `src/components/tabs/raw-studio/RawStudioInspector.tsx`
  - `src/components/tabs/raw-studio/index.tsx`
* **Canonical Flow:** User uploads asset/logo $\to$ stored in `mediaAssets` / `brandKit.watermark.logoUrl` $\to$ deleting asset cleans up all matching timeline clips safely.
* **Verification Strategy:** Playwright test verifying asset upload, rename to custom string, delete asset, and Brand Kit custom logo URL assignment.

---

### Sub-Wave 3B: Interactive Freehand Drawing Engine
* **Defects Addressed:** `D-01` (Interactive Canvas Pointer Capture), `D-02` (Multi-stroke Drawing Persistence).
* **Root Cause:** Clicking "Add Drawing" injects a hardcoded sample diamond stroke rather than allowing the user to draw freehand on the video preview canvas.
* **Target Files:**
  - `src/components/tabs/raw-studio/VideoPreview.tsx`
  - `src/components/tabs/raw-studio/RawStudioInspector.tsx`
* **Canonical Flow:** User clicks "Draw on Canvas" $\to$ Pointer capture on canvas $\to$ accumulates `(x, y)` points on pointer move $\to$ renders live SVG polyline $\to$ on pointer up, serializes stroke array into timeline item.
* **Verification Strategy:** Playwright test simulating pointer down, pointer drag across canvas, pointer up, and verifying created timeline item contains recorded coordinates.

---

### Sub-Wave 3C: Real Audio DSP Engine
* **Defects Addressed:** `AU-04` (Voice Cleanup DSP in Preview and Export).
* **Root Cause:** "Voice Cleanup" checkbox only toggled a state boolean without attaching Web Audio DSP filters in preview or audio filters in FFmpeg.
* **Target Files:**
  - `src/lib/editing/audio/dsp.ts` (NEW)
  - `src/components/tabs/raw-studio/VideoPreview.tsx`
  - `src/lib/rendering/ffmpeg-command-planner.ts`
* **Canonical Flow:** `voiceCleanup: true` $\to$ Web Audio pipeline inserts Highpass (80Hz) + Peaking EQ (3kHz speech boost) + DynamicsCompressor $\to$ FFmpeg pipeline inserts `highpass=f=80,lowpass=f=12000,afftdn`.
* **Verification Strategy:** TSX compiler test verifying FFmpeg audio filter generation with voice cleanup enabled; Playwright UI test verifying toggle state.

---

### Sub-Wave 3D: Structural Template Engine
* **Defects Addressed:** `E-02` (Structural Templates Execution).
* **Root Cause:** Clicking a template (e.g. "Viral Hook-Body-CTA") only showed a toast notification without generating timeline clips.
* **Target Files:**
  - `src/components/tabs/raw-studio/RawStudioInspector.tsx`
  - `src/lib/editing/templates.ts` (NEW / canonical generator)
* **Canonical Flow:** Click "Viral Hook-Body-CTA" $\to$ Clears/replaces timeline with calibrated structure:
  - 0.0s – 3.0s: Big Hook Text (`🔥 STOP SCROLLING`)
  - 0.0s – Duration: Primary Video track
  - (Duration - 3.0s) – Duration: CTA Text & Badge (`👇 LINK IN BIO`)
* **Verification Strategy:** Playwright test clicking template and asserting generated timeline items on `track-text-1` and `track-overlay-1`.

---

### Sub-Wave 3E: Speech Intelligence & Auto-Transcription Engine
* **Defects Addressed:** `C-02` (Real Speech-to-Text Transcription).
* **Root Cause:** Clicking "Auto Generate Captions" generated fake lorem-ipsum subtitles instead of transcribing the actual audio.
* **Target Files:**
  - `src/lib/transcription/speech-engine.ts`
  - `src/components/tabs/raw-studio/RawStudioInspector.tsx`
* **Canonical Flow:** Click "Auto Generate Captions" $\to$ Extracts audio from ingested video $\to$ runs Web Speech API / Transcription Engine $\to$ parses timestamped words $\to$ generates real synchronized caption timeline clips.
* **Verification Strategy:** TSX compiler test verifying speech segment to timeline item parser; Playwright test verifying caption generation on audio ingestion.

---

## 3. 🛡️ EXECUTION ORDER & GATING DISCIPLINE

```text
3A (Asset & Brand Kit Lifecycle) ──► 3B (Drawing Engine) ──► 3C (Audio DSP) ──► 3D (Templates) ──► 3E (Speech Intelligence)
```

Each sub-wave will strictly follow our established verification lifecycle:
`Architecture Blueprint ➔ Surgical Implementation ➔ TypeScript Gate (npx tsc --noEmit) ➔ Compiler/Unit Test ➔ Playwright UI Test ➔ Full Prior Waves Regression Gate ➔ Freeze`.

---

## 4. 🚦 READY FOR SUB-WAVE 3A

Wave 3 decomposition is **complete and documented**.  
No production code has been modified yet. Awaiting authorization to begin **Sub-Wave 3A: Asset & Brand Kit Lifecycle**.
