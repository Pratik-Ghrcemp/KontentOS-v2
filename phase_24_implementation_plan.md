# 📋 Phase 24 Architecture & Implementation Plan: AI Visual Asset Intelligence & B-Roll Proposal Engine

**System**: KontentOS Studio Hub  
**Target Milestone**: **Phase 24 — AI Visual Asset Intelligence & B-Roll Proposal Engine**  
**Core Architectural Law**: $\text{AI Proposes} \longrightarrow \text{Creator Previews (Ghost Overlay)} \longrightarrow \text{Creator Explicitly Approves} \longrightarrow \text{Atomic Mutation} \longrightarrow \text{Single-Step Undo/Redo}$

---

## 1. Executive Summary & Objective

In **Phase 20–22**, KontentOS established core timeline editing, smart AI editing, and autonomous storyboarding. In **Phase 23**, we completed the generative audio pipeline (TTS, SFX, BGM, waveform audition, speech-reactive sidechain ducking, and FFmpeg audio mixing).

Currently, Storyboard beats describe visual intents (e.g., *"Person struggling with productivity"*, tags: `laptop`, `stress`, `coffee`), but the system lacks the automated intelligence to source, rank, proceduralize, and assemble the **visual assets (B-Roll, graphic cards, illustrative images)** into the video composition.

**Phase 24 completes the visual pipeline:**
1. Intelligently analyzes Storyboard beats and spoken transcripts to extract structured **Visual Intents & B-Roll Queries**.
2. Performs **Semantic Local Asset Matching & Scoring** against uploaded project media.
3. Generates **Procedural Visual Assets & Kinetic Title Backdrops** (SVG vector overlays, aesthetic gradients, dynamic graphic cards) with aspect ratio adaptation (`9:16`, `16:9`, `1:1`).
4. Projects **Ghost Visual Timeline Overlays** on video and text tracks without touching canonical timeline state.
5. Provides an **Atomic Visual Assembler** with automatic beat alignment, Ken Burns pan/zoom keyframe motion curves, and single-step `Ctrl+Z` undo / `Ctrl+Y` redo.
6. Mixes and exports physical MP4 video with multi-layer visuals in FFmpeg.

---

## 2. Architecture & Data Flow

```text
Storyboard Beats / Dialogue Script
               ↓
Visual Intent Parser & Semantic Query Generator
               ↓
Dual Source Matching Engine:
┌───────────────────────────────┬───────────────────────────────┐
│ Local Project Asset Matcher   │ Procedural & AI Visual Engine │
│ (Metadata, tags, similarity)  │ (SVGs, kinetic cards, images) │
└───────────────────────────────┴───────────────────────────────┘
               ↓
Visual Asset Proposal Pool (Memory / Context Isolated)
               ↓
Creator Thumbnail Preview & Aspect Ratio Inspector
               ↓
Translucent Ghost Visual Timeline Overlay (track-video-1)
       [editState.items = STRICTLY UNTOUCHED / ZERO MUTATIONS]
               ↓
Creator Selection & Motion Presets (Ken Burns, Scale, Transition)
               ↓
Explicit "Insert Selected Visuals to Timeline"
               ↓
Pure Visual Compiler (compileApprovedVisualAssets)
               ↓
ONE Atomic Reducer Action: APPLY_VISUAL_ASSETS
               ↓
Single-Step Ctrl+Z (Exact Baseline Restored) ⟷ Single-Step Ctrl+Y (Exact Redo)
               ↓
Physical FFmpeg Multi-Layer Visual Render & MP4 Export
```

---

## 3. Sub-Phase Roadmap

### 🎬 Phase 24A: Visual Intelligence & Asset Matching Engine
- Define strict TypeScript contracts in [`src/lib/ai/visual/types.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/lib/ai/visual/types.ts):
  - `VisualAssetProposal`, `VisualIntent`, `BRollQuery`, `VisualProposalPool`, `KenBurnsConfig`.
- Implement `VisualIntentParser` in [`src/lib/ai/visual/intent-parser.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/lib/ai/visual/intent-parser.ts):
  - Extracts visual subjects, pacing, motion style, mood, keywords, and B-roll search queries from beats and transcript dialogue.
- Implement `LocalAssetMatcher` in [`src/lib/ai/visual/asset-matcher.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/lib/ai/visual/asset-matcher.ts):
  - Ranks uploaded video/image assets against B-roll queries with relevance scoring (`0.0` to `1.0`) and smart tag matching.
- Implement `ProceduralVisualEngine` in [`src/lib/ai/visual/procedural-visual-engine.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/lib/ai/visual/procedural-visual-engine.ts):
  - Generates procedural SVG backdrops, kinetic title cards, aesthetic gradients, and motion badges.
- Implement `VisualValidator` in [`src/lib/ai/visual/visual-validator.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/lib/ai/visual/visual-validator.ts):
  - Aspect ratio clamping, XSS sanitization, resolution safety checks.
- Create API route [`src/app/api/ai/visual/generate/route.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/src/app/api/ai/visual/generate/route.ts).
- Comprehensive unit test suite in [`scratch/phase_24a_comprehensive_test.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20(4)/KontentOS/scratch/phase_24a_comprehensive_test.ts).

---

### 🎨 Phase 24B: Visual Asset Proposal Deck & Ghost Visual Timeline Overlay
- Build `VisualDeck.tsx` in `src/components/tabs/raw-studio/VisualDeck.tsx`:
  - **Tabs**: `🎬 Storyboard B-Roll Matcher`, `🎨 Procedural Graphic Cards`, `🖼️ AI Image Generator`.
  - Proposal card stack with high-res preview modal, aspect ratio pill, relevance score badge, and selection checkboxes.
  - Batch Select All / Deselect All controls.
- Extend `RawStudioContext.tsx` with `visualProposals: VisualProposalPool` and `selectedVisualIds: Set<string>`.
- Extend `GhostTimelineOverlay.tsx` to render translucent dashed B-roll and visual cards on `track-video-1` / `track-text-1`.
- **Zero Mutation Invariant**: Baseline `editState.items` strictly unchanged.
- Mount `'elements'` / `'visual'` tool rail tab in `RawStudioInspector.tsx`.
- Comprehensive Playwright HAT test in `scratch/phase_24b_comprehensive_test.js`.

---

### ⚡ Phase 24C: Atomic Visual Assembler & Ken Burns Motion Engine
- Implement `compileApprovedVisualAssets()` in `src/lib/editing/visual-compiler.ts`:
  - Maps approved visual proposals to exact beat timings on `track-video-1` or overlay layers.
  - Automatically calculates aspect ratio fit (`contain`, `cover`, `fill`).
  - Generates Ken Burns pan/zoom keyframe animation curves (subtle `scale: 100% -> 112%`, `x/y drift`) for static graphics and B-roll.
- Add `APPLY_VISUAL_ASSETS` reducer action in `src/lib/editing/types.ts` and `src/lib/editing/engine.ts`.
- Mount explicit **"Insert Selected Visuals (N) to Timeline"** button with Ken Burns motion toggle.
- Single-step `Ctrl+Z` Undo (exact baseline restoration) and `Ctrl+Y` Redo.
- Comprehensive Playwright HAT test in `scratch/phase_24c_comprehensive_test.js`.

---

### 🔒 Phase 24D: Master Independent HAT Audit & Phase 24 Freeze
- Fresh master audit runner in `scratch/phase_24_final_independent_audit.js`.
- 15 independent verification pillars (Media ingestion, baseline integrity, intent parsing, B-roll matching, procedural graphics, ghost zero-mutation, approval gate, atomic transaction, Ken Burns keyframes, single-step undo/redo, physical FFmpeg video export with video/audio stream verification, and regression pass).
- Freeze Phase 24.

---

## 4. Verification & Testing Plan

1. **Automated Unit Tests**:
   - `npx tsx scratch/phase_24a_comprehensive_test.ts`
   - `npx tsx scratch/phase_24c_unit_test.ts`
2. **End-to-End Playwright Browser HAT Tests**:
   - `node scratch/phase_24b_comprehensive_test.js`
   - `node scratch/phase_24c_comprehensive_test.js`
   - `node scratch/phase_24_final_independent_audit.js`
3. **Physical FFmpeg Export & Stream Inspection**:
   - `ffprobe -show_entries stream=codec_type,codec_name output.mp4` confirming valid Video and Audio streams.
4. **Strict TypeScript Clean Checks**:
   - `npm run typecheck` (0 errors).
5. **Golden Master Regression Pass**:
   - `npm run test:render:phase-g` (100% green).
