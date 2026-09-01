# 📐 STUDIO HUB — WAVE 2 ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and surgical decomposition for Wave 2: FFmpeg WYSIWYG Rendering Parity.  
**Phase:** PHASE 15 — WAVE 2 ARCHITECTURE & IMPLEMENTATION PLAN  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (NO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_wave_2_architecture_execution_plan.md`

---

## 1. 🎯 WAVE 2 OBJECTIVE & CORE PROBLEM STATEMENT

### The Core Architectural Gap
In the current codebase, the **Browser Canvas Preview** (`VideoPreview.tsx`) and the **FFmpeg Video Compiler** (`ffmpeg-command-planner.ts`) interpret the timeline edit state through two completely divergent pipelines:

```text
                                  ┌──────────────────────────┐
                                  │    Unified EditState     │
                                  └─────────────┬────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
  ┌──────────────────────────────┐                              ┌──────────────────────────────┐
  │   VideoPreview.tsx (DOM/CSS) │                              │ ffmpeg-command-planner.ts    │
  ├──────────────────────────────┤                              ├──────────────────────────────┤
  │ • Dynamic caption styles     │                              │ • Hardcoded 38px white text  │
  │ • Real emoji/sticker SVG DOM │                              │ • Purple drawtext solid box  │
  │ • Dynamic watermark corners  │                              │ • Hardcoded bottom-right text│
  │ • CSS transition opacity     │                              │ • Hard cut concat (no fades) │
  │ • Interpolated keyframe RAF  │                              │ • Static frame coordinates   │
  │ • Web Audio speech ducking   │                              │ • Static amix (no sidechain) │
  └──────────────┬───────────────┘                              └──────────────┬───────────────┘
                 │                                                             │
                 ▼                                                             ▼
         "What You See"                                                "Not What You Get"
```

To eliminate regression risks and avoid modifying massive shared filter chains in a single uncontrolled batch, **Wave 2 is decomposed into 4 independent, sequential sub-waves**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WAVE 2 SURGICAL EXECUTION SEQUENCE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔴 Wave 2A: Canonical Visual Overlay Pipeline (Stickers, Images, Watermark)│
│  🟠 Wave 2B: Caption WYSIWYG Compiler (Dynamic Fonts, Colors, Presets)      │
│  🟡 Wave 2C: Temporal Video Rendering Engine (Transitions & Keyframe Motion)│
│  🟢 Wave 2D: Audio Mix Parity Engine (Sidechain Speech Ducking & Clean EQ)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔴 SUB-WAVE 2A: CANONICAL VISUAL OVERLAY PIPELINE

### 1. Defects Addressed
* **`E-03 / EXP-03`**: Graphic Stickers (🔥, ⭐, ❤️) burn as solid purple text boxes (`drawtext=boxcolor=0x6366f1`).
* **`B-01 / EXP-06`**: Watermark position hardcoded to bottom-right corner (`x=w-tw-24:y=h-th-24`), ignoring user preset (`top-left`, `top-right`, `bottom-left`, `center`).
* **`D-02 / EXP-03`**: Drawing stroke paths omitted from composition builder and burned as generic placeholder badges.
* **`EXP-03`**: Image overlays lack transparent PNG alpha blending in `-filter_complex`.

### 2. Files Expected to Change
* [`src/lib/editing/canonical.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/canonical.ts): Add overlay geometry normalizer and watermark coordinate mapper.
* [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts): Map stickers, drawings, and image overlays into discrete typed `RenderImageLayer` / `RenderOverlayLayer`.
* [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
  - Replace `drawtext` sticker simulation with true PNG/SVG alpha overlay blending: `[v][overlay_in]overlay=x:y:enable='between(t,start,end)'[v_out]`.
  - Replace hardcoded watermark position with dynamic coordinate formulas based on `brandKit.position` (`top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`).

### 3. Canonical Data Contract
```ts
export interface CanonicalVisualOverlay {
  id: string;
  type: 'sticker' | 'image' | 'svg_draw' | 'watermark';
  sourcePath?: string;       // File path for PNG/JPG/SVG
  svgContent?: string;       // Raw SVG for runtime rasterization
  textFallback?: string;     // Emoji character or text fallback
  startTime: number;
  endTime: number;
  x: number;                 // Normalized pixel offset from center or corner
  y: number;
  scale: number;             // 100 = 1.0x
  rotation: number;          // Degrees
  opacity: number;           // 0.0 - 1.0
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}
```

### 4. FFmpeg Implementation Path
* **Dynamic Watermark Positioning Math:**
  ```text
  top-left:      x=24:y=24
  top-right:     x=w-tw-24:y=24
  bottom-left:   x=24:y=h-th-24
  bottom-right:  x=w-tw-24:y=h-th-24
  center:        x=(w-tw)/2:y=(h-th)/2
  ```
* **Sticker & Alpha Image Overlays:**
  - For image/PNG assets: Add input `-i <asset_path>` $\to$ scale & format `format=rgba` $\to$ blend with `overlay=x:y:enable='between(t,start,end)'`.
  - For emoji stickers: Render via high-resolution `drawtext` with transparent background (no forced purple box) or bundled vector asset.

### 5. Verification & Stop Conditions
* **Playwright Test:** Export video with top-left watermark and sticker 🔥. Inspect resulting FFmpeg command plan string. Verify `x=24:y=24` and zero `boxcolor=0x6366f1`.
* **Out-of-Scope:** Dynamic caption fonts (belongs to 2B), Video transitions (belongs to 2C).

---

## 3. 🟠 SUB-WAVE 2B: CAPTION WYSIWYG COMPILER

### 1. Defects Addressed
* **`C-01 / EXP-02`**: Subtitle styling ignored during export. FFmpeg hardcodes static 38px white text with black box, ignoring user-configured font family, font size, font color, background box color/opacity, and caption presets (`Alex Hormozi`, `Neon Glow`, `Classic`, `Minimal`).

### 2. Files Expected to Change
* [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts): Pass full `captionStyle` object (fontFamily, fontSize, color, backgroundColor, backgroundOpacity, positionY) in `RenderRequest`.
* [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
  - Dynamically map `captionStyle.fontSize` (default 48px) to FFmpeg `fontsize`.
  - Dynamically map `captionStyle.color` (`#facc15` $\to$ `0xfacc15`) to FFmpeg `fontcolor`.
  - Dynamically map `captionStyle.backgroundColor` & `backgroundOpacity` to FFmpeg `box=1:boxcolor=0xHEX@OPACITY`.
  - Dynamically map preset styles (`Hormozi` $\to$ Yellow uppercase + thick black border `borderw=4:bordercolor=black`).

### 3. Canonical Caption Style Contract
```ts
export interface CanonicalCaptionStyle {
  presetId?: 'hormozi' | 'neon' | 'classic' | 'minimal' | 'custom';
  fontFamily: string;
  fontSize: number;
  fontColor: string;           // Hex string e.g. '#facc15'
  backgroundColor?: string;    // Hex string e.g. '#000000'
  backgroundOpacity?: number;  // 0.0 - 1.0
  borderWidth?: number;        // Outline stroke thickness
  borderColor?: string;
  yOffsetRatio: number;        // e.g. 0.85 = bottom 15% safe area
}
```

### 4. Verification & Stop Conditions
* **Playwright Test:** Change caption preset to "Alex Hormozi" (Yellow text, bold), trigger render request, assert that FFmpeg plan contains `fontcolor=0xfacc15` and `fontsize=48`.
* **Out-of-Scope:** AI speech transcription (belongs to Wave 3), Video transitions (belongs to 2C).

---

## 4. 🟡 SUB-WAVE 2C: TEMPORAL VIDEO RENDERING ENGINE

### 1. Defects Addressed
* **`F-02 / EXP-04`**: Video Transitions (`crossfade`, `fade-black`, `zoom-in`) animate cleanly in `VideoPreview.tsx` but are completely dropped in export, resulting in hard concatenation cuts.
* **`F-03 / EXP-05`**: Clip Keyframe Animations (`scale`, `position`, `opacity`) evaluate during canvas playback but export as static unmoving frames.

### 2. Files Expected to Change
* [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts): Serialize `transitionIn`, `transitionOut`, and `keyframes` array into `RenderVideoLayer`.
* [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
  - For single clip fade transitions: Append `fade=t=in:st=0:d=DURATION` and `fade=t=out:st=END-DURATION:d=DURATION`.
  - For multi-clip transitions: Implement sequential `xfade=transition=fade:duration=0.5:offset=OFFSET` filter chains.
  - For keyframe motion: Compile linear coordinate equations into FFmpeg `eval` expressions for zoom/pan (`scale='eval=...'`).

### 3. Verification & Stop Conditions
* **Playwright Test:** Apply 0.5s fade-in transition to clip, generate FFmpeg plan, assert `fade=t=in:st=0:d=0.5` is present in video filter chain.
* **Out-of-Scope:** Audio ducking (belongs to 2D), Drawing pointer capture (belongs to Wave 3).

---

## 5. 🟢 SUB-WAVE 2D: AUDIO MIX PARITY ENGINE

### 1. Defects Addressed
* **`A-03 / EXP-07`**: Speech-Reactive Auto Ducking ducks BGM in canvas preview, but exports with BGM playing at uncompressed volume over speech.
* **`EXP-07`**: Multi-track audio mixing lacks clip volume scaling parity.

### 2. Files Expected to Change
* [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts): Pass `audioSettings.autoDuck`, `primaryVol`, `bgmVol`, and track clip arrays into `RenderRequest`.
* [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
  - When `autoDuck === true` and BGM track exists: Route primary speech audio `[a_speech]` and background music `[a_bgm]` through `sidechaincompress=threshold=0.125:ratio=4:attack=50:release=300`.
  - When `autoDuck === false`: Route through standard volume-weighted `amix`.

### 3. Verification & Stop Conditions
* **Playwright Test:** Enable "Auto Ducking", export composition, assert filter graph includes `sidechaincompress` linking primary audio and BGM.
* **Out-of-Scope:** AI Silence removal execution (Wave 3), Waveform display (Wave 4).

---

## 6. 🛡️ REGRESSION BOUNDARIES & SAFETY GATES

Each sub-wave will follow the strict **5-step verification lifecycle**:
1. **Implementation:** Modify ONLY the designated files for that specific sub-wave.
2. **Typecheck Gate:** `npx tsc --noEmit` must exit with code 0.
3. **Targeted Playwright Suite:** Fresh sub-wave verification spec asserting FFmpeg command plan correctness and runtime behavior.
4. **Independent Post-Implementation Re-Audit:** Adversarial test reproducing the original defect and verifying it is eradicated.
5. **Freeze & Next:** Freeze sub-wave before starting the next sub-wave.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WAVE 2 SUB-WAVE EXECUTION GATE                         │
│                                                                             │
│  Phase 15A: Wave 2A Plan ➔ Implement ➔ Typecheck ➔ Re-Audit ➔ FREEZE 🟢    │
│  Phase 15B: Wave 2B Plan ➔ Implement ➔ Typecheck ➔ Re-Audit ➔ FREEZE 🟢    │
│  Phase 15C: Wave 2C Plan ➔ Implement ➔ Typecheck ➔ Re-Audit ➔ FREEZE 🟢    │
│  Phase 15D: Wave 2D Plan ➔ Implement ➔ Typecheck ➔ Re-Audit ➔ FREEZE 🟢    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. FINAL RECOMMENDATION

We are ready to proceed with **Sub-Wave 2A: Canonical Visual Overlay Pipeline**.  
No code has been modified. Awaiting authorization to begin Sub-Wave 2A implementation.
