# 📐 STUDIO HUB — SUB-WAVE 3B ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and mathematical specification for Sub-Wave 3B: Interactive Freehand Drawing Engine.  
**Phase:** PHASE 16 — SUB-WAVE 3B (INTERACTIVE FREEHAND DRAWING ENGINE)  
**Date:** 2026-08-31  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3b_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: CURRENT DRAWING LIMITATIONS

We traced the Draw tool and preview canvas to identify why drawing currently fails to provide an interactive freehand experience:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DRAWING PIPELINE LIFECYCLE TRACE                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. DRAW TOOL INSPECTOR (RawStudioInspector.tsx:L1630-L1675)                                 │
│    • User selects: Brush Color (drawColors) and Stroke Size (drawWidth: 2px - 24px).        │
│    • Button "✏️ Add Preset Drawing Overlay" injects a STATIC diamond 4-point hardcoded      │
│      array instead of enabling interactive pointer drawing on the video preview canvas.     │
│                                                                                             │
│ 2. VIDEO PREVIEW CANVAS (VideoPreview.tsx:L1020-L1030)                                      │
│    • VideoPreview contains SVG path rendering for items with strokePoints:                  │
│      <path d={`M ${props.strokePoints...}`} stroke={strokeColor} strokeWidth={strokeWidth}/>│
│    • BUT VideoPreview has NO pointer capture or live stroke accumulation when activeTool    │
│      is 'draw'! Pointer events fall through to video drag or marquee selection.             │
│                                                                                             │
│ 3. TIMELINE & EXPORT INTEGRITY                                                              │
│    • Timeline stores stroke items under type: 'overlay', properties: { strokePoints, ... }. │
│    • builder.ts (resolveOverlayProperties) and ffmpeg-command-planner.ts (Wave 2A) serialize│
│      and preserve strokePoints in RenderRequest payloads.                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧮 MATHEMATICAL SPECIFICATION: COORDINATE NORMALIZATION

A drawing created on an 800px preview viewport must render identically on a 400px mobile preview and inside a 1080x1920 final export video.

### Coordinate Transformation Formula
Let $R_{\text{canvas}}$ be the bounding rectangle of the `.studio-canvas` DOM container:
* Width = $W_{\text{canvas}}$, Height = $H_{\text{canvas}}$.
* Pointer Event Client Coordinates: $(x_{\text{client}}, y_{\text{client}})$.

1. **Local Canvas Offset:**
   $$x_{\text{local}} = x_{\text{client}} - R_{\text{canvas}}.\text{left}$$
   $$y_{\text{local}} = y_{\text{client}} - R_{\text{canvas}}.\text{top}$$

2. **Center-Relative Pixel Coordinates (Canonical Storage Format):**
   $$x_{\text{rel}} = \text{round}\left(x_{\text{local}} - \frac{W_{\text{canvas}}}{2}\right)$$
   $$y_{\text{rel}} = \text{round}\left(y_{\text{local}} - \frac{H_{\text{canvas}}}{2}\right)$$

3. **Rendering in Preview `<svg>` (Center Anchor):**
   For each point $P_i = (x_i, y_i)$, canvas SVG coordinate is:
   $$X_i = x_i + \frac{W_{\text{canvas}}}{2}, \quad Y_i = y_i + \frac{H_{\text{canvas}}}{2}$$

---

## 3. 🎯 POINTER EVENT LIFECYCLE & LIVE STROKE STATE

When `activeTool === 'draw'`, a dedicated SVG interactive layer (`.studio-drawing-active-canvas`) is placed on top ($z\text{-index}=40$) with `cursor: crosshair` and `pointerEvents: auto`:

```text
       ┌───────────────┐
       │  pointerdown  │ ──► Captures pointer via setPointerCapture(e.pointerId)
       └───────┬───────┘     Initializes activeStroke = [ (x_rel, y_rel) ]
               │
               ▼
       ┌───────────────┐
       │  pointermove  │ ──► Appends sampled (x_rel, y_rel) points (throttled at 10ms / distance > 2px)
       └───────┬───────┘     Renders live in-progress <polyline /> SVG path
               │
               ▼
       ┌───────────────┐
       │   pointerup   │ ──► Releases pointer capture
       └───────┬───────┘     If activeStroke.length >= 2:
                             Dispatches ADD_ITEM with complete stroke data to Timeline!
                             activeStroke is reset to []
```

---

## 4. 🧩 CANONICAL DRAWING ITEM SCHEMA & PERSISTENCE

```ts
export interface DrawingTimelineItem extends TimelineItem {
  id: string; // `draw-${crypto.randomUUID()}`
  trackId: 'track-text-1';
  type: 'overlay';
  start: number; // currentTime
  end: number;   // currentTime + 4.0
  label: '✏️ Freehand Drawing';
  content: 'drawing';
  properties: {
    x: 0;
    y: 0;
    scale: 100;
    opacity: 100;
    rotation: 0;
    strokePoints: Array<{ x: number; y: number }>;
    strokeColor: string; // e.g. '#ef4444'
    strokeWidth: number; // e.g. 6 (px)
    zIndex: 25;
  };
}
```

---

## 5. 📁 EXACT PRODUCTION FILES TO MODIFY

| File | Scope of Modification |
| :--- | :--- |
| [`src/components/tabs/raw-studio/VideoPreview.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx) | Add interactive drawing canvas overlay when `activeTool === 'draw'`, pointer handlers (`handleDrawPointerDown`, `Move`, `Up`), live stroke SVG preview, and completed stroke rendering. |
| [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx) | Update Draw inspector with clear instructions ("Draw directly on canvas with your mouse/stylus"), active stroke preview, and "Clear Drawings" button. |

---

## 6. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Drawing interfering with video / clip selection):** Starting a drawing stroke dragging existing clips or opening marquee box.
  - **Mitigation:** When `activeTool === 'draw'`, the drawing SVG layer intercepts pointer events at $z\text{-index}=40$, completely preventing canvas pointer-down from triggering marquee or clip drag.
* **Risk (Accidental single-click zero-length strokes):** Clicking canvas creating empty or 1-pixel garbage timeline items.
  - **Mitigation:** Enforce minimum stroke length constraint: only create timeline item if `activeStrokePoints.length >= 3` and total path distance $> 10\text{px}$.

---

## 7. 🧪 VERIFICATION STRATEGY

1. **Playwright UI Test Suite (`scratch/wave-3b-draw-verify.spec.js`):**
   - Ingest sample video.
   - Switch to Draw tool (`activeTool === 'draw'`).
   - Simulate interactive pointer drag across preview canvas (down at $(200, 200) \to$ move to $(300, 250) \to$ move to $(400, 200) \to$ up).
   - Assert new timeline item with `✏️ Freehand Drawing` is created on timeline.
   - Assert stroke SVG is rendered in live preview with selected color (`#ef4444`) and width.
2. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a`, `2b`, `2c`, `2d` compiler verification suites (100% pass).
   - `wave-3a-asset-brand-verify.spec.js` (2/2 pass).

---

## 8. 🚦 READY FOR EXECUTION

The Sub-Wave 3B architecture is **fully designed and mathematically specified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3B implementation.
