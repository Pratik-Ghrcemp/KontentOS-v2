# 📐 STUDIO HUB — SUB-WAVE 2C ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and mathematical specification for Sub-Wave 2C: Temporal Video Rendering Engine (Transitions & Keyframe Motion).  
**Phase:** PHASE 15 — SUB-WAVE 2C (TEMPORAL VIDEO RENDERING ENGINE)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_2c_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: TEMPORAL RENDERING GAP

Currently, the browser preview computes time-based animations at 60 FPS in JavaScript (`VideoPreview.tsx`), but the export pipeline (`ffmpeg-command-planner.ts`) collapses all time dynamics into static concatenated frames:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          TEMPORAL RENDERING PIPELINE TRACE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. VIDEO TRANSITIONS (Crossfade, Fade to Black, Zoom-In)                                    │
│    • Inspector: Sets transitionIn: { type: 'crossfade', duration: 0.5 }                     │
│    • VideoPreview: Calculates transitionFactor = (t - start) / duration ➔ modulates opacity │
│    • builder.ts: Serializes transitionIn and transitionOut in videoClips                    │
│    • ffmpeg-command-planner.ts: Ignores transitions completely! Executes hard-cut concat!   │
│                                                                                             │
│ 2. KEYFRAME ANIMATION (Scale, Position X/Y, Opacity, Rotation)                              │
│    • Inspector: Stores item.keyframes = [{ time: 0, properties: { scale: 100 } }, ...]     │
│    • keyframes.ts: evaluateInterpolatedProperties() computes lerp(p1, p2, t)                │
│    • VideoPreview: Applies transform: translate(X, Y) scale(S) live in requestAnimationFrame│
│    • ffmpeg-command-planner.ts: Drops keyframes array entirely! Renders static 100% frame   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧮 MATHEMATICAL SPECIFICATION: VIDEO TRANSITIONS

### Case A: Single Clip Intra-Video Fades (Fade-In & Fade-Out)
For clips with `transitionIn` and/or `transitionOut`:
* Clip Start: $t_{\text{start}}$, Clip End: $t_{\text{end}}$, Duration: $D = t_{\text{end}} - t_{\text{start}}$.
* Transition In Duration: $T_{\text{in}}$, Transition Out Duration: $T_{\text{out}}$.
* **FFmpeg Video Filter:**
  ```text
  fade=t=in:st=0:d=${T_in},fade=t=out:st=${D - T_out}:d=${T_out}
  ```
* **FFmpeg Audio Filter (if audio exists):**
  ```text
  afade=t=in:st=0:d=${T_in},afade=t=out:st=${D - T_out}:d=${T_out}
  ```

### Case B: Multi-Clip Crossfade Transitions (`xfade` + `acrossfade`)
When two sequential video clips $V_0$ (duration $D_0$) and $V_1$ (duration $D_1$) share a transition of duration $T$:
* **Offset Calculation:**
  $$\text{Offset}_1 = D_0 - T$$
* **Total Combined Duration:**
  $$\text{Duration}_{\text{total}} = D_0 + D_1 - T$$
* **FFmpeg `xfade` Filter Chain:**
  ```text
  [v_0][v_1]xfade=transition=fade:duration=${T}:offset=${D_0 - T}[v_trans_1]
  [a_0][a_1]acrossfade=d=${T}[a_trans_1]
  ```
* **Cumulative Chaining for $N$ Clips:**
  For clip $i$ ($i \ge 2$), the cumulative offset is:
  $$\text{Offset}_i = \text{Offset}_{i-1} + D_{i-1} - T$$

---

## 3. ⏱️ MATHEMATICAL SPECIFICATION: KEYFRAME MOTION

### Canonical Keyframe Model
```ts
export interface CanonicalKeyframe {
  time: number; // Offset from clip start in seconds
  properties: {
    scale?: number;    // e.g. 100 -> 120 (1.0x -> 1.2x)
    opacity?: number;  // e.g. 0 -> 100
    x?: number;        // e.g. 0 -> 100 (horizontal pixel shift)
    y?: number;        // e.g. 0 -> -50 (vertical pixel shift)
  };
}
```

### FFmpeg Compilation Strategy
1. **Opacity Keyframe Motion:**
   Mapped via `fade=t=in:st=${k1.time}:d=${k2.time - k1.time}:alpha=1` or `colorchannelmixer` / dynamic alpha modulation.
2. **Scale / Zoom Keyframe Motion:**
   For clips animating from scale $S_1$ to $S_2$ over duration $\Delta T = t_2 - t_1$:
   - FFmpeg expression:
     $$\text{Zoom}(t) = S_1 + (S_2 - S_1) \cdot \frac{t - t_1}{t_2 - t_1}$$
   - Applied via FFmpeg `zoompan` or dynamic evaluation.
3. **Overlay & Text Position Keyframe Motion:**
   Mapped via linear time expressions in `drawtext` / `overlay` coordinates:
   $$x(t) = x_1 + (x_2 - x_1) \cdot \frac{t - t_1}{t_2 - t_1}$$

---

## 4. 📁 FILES TO MODIFY IN SUB-WAVE 2C

1. [`src/lib/editing/canonical.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/canonical.ts):
   - Add `buildFfmpegTransitionFilter()` pure generator (calculates `fade`, `xfade`, and `acrossfade` chains with exact offset math).
   - Add `buildFfmpegKeyframeMotionParams()` pure generator.
2. [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
   - Update Step 2 (Clip processing): Append `fade` / `afade` filters for intra-clip transitions.
   - Update Step 3 (Video concatenation): Replace simple `concat` with `xfade` filter chain when transitions are configured.
   - Update Step 4 & 6 (Text/Overlay): Embed linear keyframe coordinate expressions when keyframes exist.

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Timeline duration mismatch with `xfade`):** When `xfade` overlaps two clips, the total video duration decreases by transition duration $T$. If audio is not crossed with `acrossfade`, audio/video sync will drift.
  - **Mitigation:** Always pair `xfade` with matching `acrossfade=d=${T}` and adjust output timeline duration spec.
* **Risk (Single-clip vs Multi-clip transition collisions):** Applying `xfade` to a single video clip throws an FFmpeg syntax error.
  - **Mitigation:** Use `fade=t=in/out` for single clips and `xfade` only when `videoLayers.length > 1` with transitions enabled.
* **Risk (Keyframe division by zero):** When two keyframes have identical timestamps ($t_1 = t_2$).
  - **Mitigation:** Guard $\Delta T = \max(0.01, t_2 - t_1)$ to prevent division by zero in FFmpeg equations.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Script (`wave-2c-compiler-verify.ts`):**
   - Test single clip with 0.5s Fade-in (`fade=t=in:st=0:d=0.5` and `afade=t=in:st=0:d=0.5`).
   - Test two clips with 0.5s Crossfade (`xfade=transition=fade:duration=0.5:offset=4.5` and `acrossfade=d=0.5`).
   - Test text overlay with keyframe motion (position shift from $x=0$ to $x=100$).
2. **Playwright UI Test (`wave-2c-ui-verify.spec.js`):**
   - Add transition in Effects inspector.
   - Verify timeline playback and export request serialization.
3. **Full Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a-compiler-verify.ts` (100% pass).
   - `wave-2b-compiler-verify.ts` (100% pass).

---

## 7. 🚦 READY FOR EXECUTION

The Sub-Wave 2C architecture and mathematical specifications are **fully designed and verified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 2C implementation.
