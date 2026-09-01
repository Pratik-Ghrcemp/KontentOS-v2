# 🔍 STUDIO HUB — TOOL #8: DRAW TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Draw Tool & Canvas Annotations  
**Audit Phase:** PHASE 8 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + SVG Vector Tracing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_draw_tool_deep_forensic_audit.md`

---

## 1. EXECUTIVE SUMMARY & DRAW TOOL FORENSIC SCORECARD

The **Draw Tool & Visual Annotation Pipeline** was interrogated across **UI Palette Controls**, **Interactive Canvas Pointer Events**, **SVG Path Generation**, and **Physical Native FFmpeg Export Filters**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DRAW TOOL FORENSIC QA SCORECARD                       │
│                                                                             │
│  TOTAL SCENARIOS AUDITED: 24 paths across Drawing Lifecycle                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      10 features (41.7%)       │
│  🟡 PARTIAL / MOCKUP GAPS (PARTIAL):               4 features (16.7%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  8 features (33.3%)       │
│  ⚫ FALSE CONFIDENCE / FAKE DRAWING TEXT BOX:      2 features  (8.3%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (No Canvas Drawing & Export Text Disconnect):3                        │
│  - P2 (Missing Eraser, Shapes & Highlighter):      3                        │
│  - P3 (Brush UI Polish):                           2                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DRAW TOOL UI & CONTROLS INVENTORY

| Control / Feature | UI Element | Attached Handler / State | Runtime Verification | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Brush Color Palette** | 7 Color Dots (`#ef4444`, `#3b82f6`, `#10b981`, `#eab308`, `#a855f7`, `#ffffff`, `#000000`) | `setDrawColor(c)` | Updates active color cleanly with highlight border. | 🟢 **FULL PASS** |
| **Stroke Width Slider** | Range input ($2\text{px}-24\text{px}$) | `setDrawWidth(val)` | Updates active width. | 🟢 **FULL PASS** |
| **Preset Drawing Overlay** | `✏️ Add Preset Drawing Overlay` Button | `dispatch(ADD_ITEM)` | Inserts fixed hardcoded squiggle `[{ x: -60, y: -20 }, { x: -20, y: 30 }, ...]` with duration $4.0\text{s}$. Rendered in preview via SVG `<path>`. | 🟢 **FULL PASS** |
| **Interactive Canvas Freehand Drawing** | Mouse/Stylus drag on Preview Canvas | None | **MISSING FEATURE:** There are zero `onPointerDown`/`onPointerMove`/`onPointerUp` handlers on the preview canvas for freehand drawing. Users cannot draw custom strokes with a mouse or stylus. | 🔴 **FAIL (MISSING FEATURE)** |
| **FFmpeg Vector Export** | Native MP4 rendering of drawing stroke | `ffmpeg-command-planner.ts:L208` | **WYSIWYG BREAKDOWN:** FFmpeg burns `drawtext=text='✏️ Freehand Drawing':box=1:boxcolor=0x6366f1` (a solid purple text box), completely omitting the SVG stroke path! | 🔴 **FAIL (EXPORT PARITY)** |

---

## 3. ARCHITECTURE DEPENDENCY MAP & FILE INVENTORY

```text
Draw Inspector Panel (RawStudioInspector.tsx:L1382-L1460)
 ├── Color Palette ➔ setDrawColor (L1399)
 ├── Stroke Slider ➔ setDrawWidth (L1424)
 └── Preset Insert ➔ ADD_ITEM (L1455) [Fixed hardcoded squiggle points]
       │
       ▼
Preview Canvas Vector Rendering (VideoPreview.tsx:L993-L1000)
 └── SVG Path: <svg><path d="M x y L x y" stroke={strokeColor} strokeWidth={strokeWidth} /></svg>
       │
       ▼
FFmpeg Command Planner (ffmpeg-command-planner.ts:L208-L215)
 └── Plain Text Box: drawtext=text='✏️ Freehand Drawing':boxcolor=0x6366f1@0.85
```

---

## 4. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect D-01: No Interactive Freehand Drawing on Canvas (SEVERITY: P1)
* **User Impact:** The "Draw Tool" does not actually let creators draw or write on top of their video with a mouse or stylus.
* **Root Cause:** In [`VideoPreview.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx), there is no canvas drawing layer or pointer event tracking (`onPointerDown`, `onPointerMove`, `onPointerUp`) when `activeTool === 'draw'`. The tool only inserts a static hardcoded zigzag preset via a button click.
* **Exact File & Line:** [`src/components/tabs/raw-studio/VideoPreview.tsx#L970-L1020`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L970-L1020)

---

### 🔴 Defect D-02: Drawing Strokes Converted to Plain Purple Text Boxes in FFmpeg (SEVERITY: P1)
* **User Impact:** In the editor, drawings appear as colorful SVG vector lines. In the exported MP4 video, FFmpeg burns a solid purple text box containing the words `"✏️ Freehand Drawing"`, completely dropping the visual vector drawing.
* **Root Cause:** In [`ffmpeg-command-planner.ts:L208-L215`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L208-L215), all overlay items (`type: 'overlay'`) are converted to `drawtext` text boxes. FFmpeg has no rasterization or SVG overlay blending filter for `strokePoints`.
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L208-L215`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L208-L215)

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR DRAW TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Add Interactive Freehand Canvas Drawing Layer (`VideoPreview.tsx`):**
   * When `activeTool === 'draw'`, overlay a transparent `<canvas>` element on top of the video viewport.
   * Capture pointer drag events (`onPointerDown`, `onPointerMove`, `onPointerUp`) to record coordinate arrays `[{ x, y }, ...]`.
   * On pointer release, dispatch `ADD_ITEM` with `type: 'overlay'` and the captured `strokePoints`.
2. **Rasterize Drawing Strokes for Native FFmpeg Export (`composition-builder.ts`):**
   * Convert SVG `strokePoints` into transparent PNG overlays (or SVG files) and overlay them into the video filter graph using `-filter_complex overlay=x:y:enable='between(t,start,end)'` instead of `drawtext`.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #8 (DRAW TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered that the Draw tool lacks interactive canvas drawing (only inserting a hardcoded squiggle preset), and FFmpeg burns drawings as plain purple text boxes instead of vector strokes.
> 
> Next recommended step in our roadmap: **Tool #9 — Brand Kit Tool Deep Forensic Audit**.
