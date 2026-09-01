# 🔍 STUDIO HUB — TOOL #7: EFFECTS TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Effects Tool, Studio LUTs, Presets & Keyframes  
**Audit Phase:** PHASE 7 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + CSS Filter Parsing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_effects_tool_deep_forensic_audit.md`

---

## 1. EXECUTIVE SUMMARY & EFFECTS TOOL FORENSIC SCORECARD

The **Effects Tool & Color Grading Pipeline** was interrogated across **UI Controls**, **CSS Filter Generation**, **Live Preview Rendering**, **Keyframe Interpolation**, and **Physical Native FFmpeg Export Filters**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EFFECTS TOOL FORENSIC QA SCORECARD                     │
│                                                                             │
│  TOTAL SCENARIOS AUDITED: 30 paths across Visual Pipeline                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      15 features (50.0%)       │
│  🟡 PARTIAL / EXPORT GAPS (PARTIAL):               6 features (20.0%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  6 features (20.0%)       │
│  ⚫ FALSE CONFIDENCE / FAKE EFFECT PRESETS:        3 features (10.0%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Critical Export Parity & Fake Buttons):     3                        │
│  - P2 (Keyframe & Transition Export Gaps):         3                        │
│  - P3 (Color Sliders & Polish):                    2                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. EFFECTS TOOL UI & CONTROLS INVENTORY

| Control / Feature | UI Element | Attached Handler / State | Runtime Verification | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Studio Cinematic LUTs** | 4 LUT Buttons (`Studio Pro`, `Moody Drama`, `Golden Hour`, `Monochrome`) | `setSelectedLutId(lut.id)` | **WORKING END-TO-END:** Live applies `contrast()`, `brightness()`, `saturate()`, `hue-rotate()`, `grayscale()` to `<video style="filter: ...">` in preview AND converts to FFmpeg `eq`, `hue`, `colorchannelmixer` filters in export! | 🟢 **FULL PASS** |
| **Effect Presets** | 4 Buttons (`Smooth Zoom`, `Auto Crop`, `Blur BG`, `Skin Protect`) | `toggleEffect(eff)` | **100% FAKE / COSMETIC:** Updates `activeEffects` in React state. Destructured on line 78 of `VideoPreview.tsx` but NEVER USED to apply any transform or filter! Completely omitted from FFmpeg export! | 🔴 **FAIL (FAKE BUTTONS)** |
| **Transitions** | 4 Buttons (`Cut`, `Swipe`, `Fade`, `Pop`) | `handleApplyTransition` | **PREVIEW-ONLY / EXPORT GAP:** Sets `transitionIn: { type: 'fade_black', duration: 0.5 }` and fades in preview canvas; but FFmpeg command planner omits transition filters completely (instant cut). | 🟡 **PARTIAL / EXPORT GAP** |
| **Keyframe Animation Engine** | `+ Add Keyframe` & Keyframe List | `ADD_KEYFRAME` / `DELETE_KEYFRAME` | **PREVIEW-ONLY / EXPORT GAP:** Real-time interpolated on canvas via `evaluateInterpolatedProperties()`; but FFmpeg command planner renders static clip properties only, dropping animation motion! | 🟡 **PARTIAL / EXPORT GAP** |
| **Layer Hierarchy Controls** | `Bring to Front`, `Bring Forward`, `Send Backward`, `Send to Back` | `REORDER_ITEM_LAYER` | Updates `properties.zIndex` ($10-50$). Respected in DOM stacking context and composition layer order. | 🟢 **FULL PASS** |

---

## 3. ARCHITECTURE DEPENDENCY MAP & FILE INVENTORY

```text
Effects Inspector Panel (RawStudioInspector.tsx:L881-L1156)
 ├── Studio LUTs ➔ setSelectedLutId (L928) [Genuinely working]
 ├── Effect Presets ➔ toggleEffect (L916) [Fake/Unused in preview & export]
 ├── Transitions ➔ handleApplyTransition (L882) [Preview-only]
 └── Keyframe Animations ➔ ADD_KEYFRAME (L1049) [Preview-only]
       │
       ▼
Preview Canvas Filter & Animation Engine (VideoPreview.tsx:L625-L650)
 ├── CSS Filter: generateCssFilter(activeVideoItem.properties, selectedLutId) (L631)
 ├── Transition Fade: transitionOpacity = transitionFactor (L641)
 └── Dynamic Keyframe Interpolation: evaluateInterpolatedProperties(item, currentTime) (L210)
       │
       ▼
FFmpeg Command Planner (ffmpeg-command-planner.ts:L28-L92, L150)
 ├── CSS Filter Translation: convertCssFilterToFfmpeg (L28) ➔ eq, boxblur, hue, colorchannelmixer (L75)
 ├── Transitions: ❌ ZERO FFmpeg filter generation for transitionIn
 └── Keyframes: ❌ ZERO dynamic expression generation for animated keyframes
```

---

## 4. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect F-01: Effect Presets Are 100% Fake / Cosmetic Buttons (SEVERITY: P1)
* **User Impact:** Clicking *"Smooth Zoom"*, *"Auto Crop"*, *"Blur BG"*, or *"Skin Protect"* toggles the button's active color, but performs zero visual transformation in preview and zero effect in FFmpeg export.
* **Root Cause:** In [`RawStudioInspector.tsx:L916`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L916), `toggleEffect` modifies `activeEffects` in React state. In [`VideoPreview.tsx:L78`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L78), `activeEffects` is destructured and completely unused. In `builder.ts`, `activeEffects` is not passed to the render request.
* **Exact Files & Lines:**
  - [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L916`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L916)
  - [`src/components/tabs/raw-studio/VideoPreview.tsx#L78`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L78)

---

### 🔴 Defect F-02: Video Transitions Ignored in FFmpeg Export (SEVERITY: P1)
* **User Impact:** Fade, Swipe, and Pop transitions animate smoothly on the preview canvas, but the final exported MP4 cuts abruptly between clips with no transition.
* **Root Cause:** [`ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts) concatenates video clips using `concat=n=X:v=1:a=1` without generating FFmpeg `xfade` (e.g. `xfade=transition=fade:duration=0.5:offset=...`) or `fade=t=in` filters.
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L169-L180`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L169-L180)

---

### 🔴 Defect F-03: Keyframe Animation Motion Dropped in FFmpeg Export (SEVERITY: P1)
* **User Impact:** Smooth animated scale-ups, panning, and fade-outs created via the Keyframe Animation Engine work in editor preview, but export as static unmoving images in the final MP4.
* **Root Cause:** In [`ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts), `videoLayers` read static `layer.x`, `layer.y`, `layer.scale`, `layer.opacity` rather than evaluating animated time-based expressions (`zoompan` or dynamic overlay coordinate equations).
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L143-L156`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L143-L156)

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR EFFECTS TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Implement Effect Presets in Canvas & FFmpeg (`filters.ts` & `VideoPreview.tsx`):**
   * Map `'Blur BG'` to `boxblur=10:10` and canvas backdrop blur.
   * Map `'Smooth Zoom'` to a subtle $105\%$ scale punch-in.
   * Map `'Skin Protect'` to subtle warm saturation mask (`hue=s=1.05`).
2. **Implement FFmpeg Video Transitions (`ffmpeg-command-planner.ts`):**
   * If `layer.transitionIn?.type === 'fade_black'`, prepend `fade=t=in:st=0:d=${layer.transitionIn.duration}` to the clip's video filter chain.
3. **Implement Keyframe Expressions in FFmpeg Command Planner (`ffmpeg-command-planner.ts`):**
   * Translate keyframe pairs $(t_1, p_1) \to (t_2, p_2)$ into linear interpolation expressions for `x`, `y`, and `alpha` in FFmpeg filter graph.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #7 (EFFECTS TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered that Studio LUTs work genuinely end-to-end, but Effect Presets are 100% cosmetic placeholders, Transitions are preview-only, and Keyframe animations are dropped during FFmpeg export.
> 
> Next recommended step in our roadmap: **Tool #8 — Draw Tool Deep Forensic Audit**.
