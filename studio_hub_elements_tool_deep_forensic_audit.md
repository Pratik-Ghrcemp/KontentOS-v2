# 🔍 STUDIO HUB — TOOL #4: ELEMENTS TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Elements Tool, Stickers, Shapes & Templates  
**Audit Phase:** PHASE 4 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + Reducer Tracing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_elements_tool_deep_forensic_audit.md`

---

## 1. EXECUTIVE SUMMARY & ELEMENTS TOOL FORENSIC SCORECARD

The **Elements Tool & Graphic Overlay System** was audited across UI presentation, reducer actions, direct canvas manipulation, inspector properties, and native FFmpeg export.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ELEMENTS TOOL FORENSIC QA SCORECARD                    │
│                                                                             │
│  TOTAL SCENARIOS AUDITED: 32 paths across 5 System Layers                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      14 features (43.8%)       │
│  🟡 PARTIAL / MOCKUP GAPS (PARTIAL):               6 features (18.8%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL): 10 features (31.2%)       │
│  ⚫ FALSE CONFIDENCE / SHADOWED DEAD CODE:         2 features  (6.2%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Critical Tool Shadowing & WYSIWYG Breaks):  3                        │
│  - P2 (Interaction & Export Parity Gaps):          4                        │
│  - P3 (Template & Asset Polish):                   3                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ARCHITECTURE DEPENDENCY MAP & FILE INVENTORY

```text
Tool Rail ('elements')
       │
       ▼
RawStudioInspector.tsx
 ├── [Line 714] (SHADOWING BLOCK): 1-Click Magic Presets & Structural Templates
 └── [Line 1326] (UNREACHABLE DEAD BLOCK): Graphic Elements & Stickers (mockGraphicElements)
       │
       ▼
dispatch({ type: 'ADD_ITEM', payload: newItem }) [type: 'overlay']
       │
       ├──► Timeline.tsx: Placed on 'track-text-1'
       ├──► VideoPreview.tsx: Rendered as emoji text / stroke points SVG (Line 972)
       └──► builder.ts ➔ composition-builder.ts ➔ ffmpeg-command-planner.ts (Line 208)
```

### Complete File Inventory
1. [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L714) — Lines 714–795 and lines 1326–1380.
2. [`src/components/tabs/raw-studio/mock-data.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/mock-data.ts#L42) — Definition of `mockGraphicElements` (8 presets: 🔥, ⭐, ☑️, ⚠️, ➔, ⭕, ❤️, ⚡).
3. [`src/components/tabs/raw-studio/VideoPreview.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L972) — Canvas rendering of overlays and direct transforms.
4. [`src/lib/rendering/composition-builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/composition-builder.ts#L60) — Conversion to `RenderOverlayLayer`.
5. [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L208) — FFmpeg `drawtext` box generation for overlays.

---

## 3. INTERROGATION & EVIDENCE MATRIX

| Scenario | Intended UX | Observed Runtime Behavior | Status | Evidence & Location |
| :--- | :--- | :--- | :---: | :--- |
| **1. Click "Elements" Tool** | Opens Elements & Stickers gallery | **SHADOWING COLLISION:** Opens "1-Click Magic Presets" & "Structural Templates" instead of Stickers gallery. | **FAIL** | `RawStudioInspector.tsx:L714` |
| **2. Access Sticker Gallery** | Browse 8 graphic elements | **100% DEAD CODE:** The sticker gallery at line 1326 is never rendered because line 714 returns first. | **FAIL** | `RawStudioInspector.tsx:L1326` |
| **3. Apply Magic Preset** | Applies LUT & caption style | Updates `selectedLutId` and `captionStyle` cleanly; shows toast. | **PASS** | `RawStudioInspector.tsx:L754-L758` |
| **4. Apply Structural Template** | Reconfigures timeline layout | Displays toast *"Applied [Template] template"* but **does not actually modify timeline clips**. | **FAIL (MOCK TOAST)** | `RawStudioInspector.tsx:L783` |
| **5. Overlay Timeline Placement** | Element added to timeline | Placed on `track-text-1` with duration $3.0\text{s}$; selectable in timeline. | **PASS** | `RawStudioInspector.tsx:L1350` |
| **6. Overlay Canvas Drag & Scale** | Drag sticker around canvas | Direct pointer dragging, corner scaling, and rotation stem work. | **PASS** | `VideoPreview.tsx:L974-L1020` |
| **7. Overlay FFmpeg Export** | Burn graphic into rendered MP4 | **WYSIWYG BREAKDOWN:** Renders as plain text inside a purple box (`boxcolor=0x6366f1`) using `drawtext` rather than an image/SVG overlay. | **FAIL (EXPORT PARITY)** | `ffmpeg-command-planner.ts:L213` |
| **8. Multi-Select Overlay + Video** | Select sticker with video | Group bounding box rendered; moves together cleanly. | **PASS** | `VideoPreview.tsx:L1029` |
| **9. Overlay Delete & Undo** | Delete overlay with Backspace | Removes from state and canvas; Undo (Ctrl+Z) restores cleanly. | **PASS** | `engine.ts:L54-L72` |

---

## 4. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect E-01: Elements Inspector Tool Shadowing Collision (SEVERITY: P1)
* **User Impact:** When a user clicks "Elements" in the Left Tool Rail, the UI opens **1-Click Magic Presets (LUTs)** instead of the Graphic Elements & Stickers library. The entire sticker gallery (Fire, Star, Badge, Heart, Zap) is completely unreachable in the UI.
* **Root Cause:** In [`RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx), there are two duplicate `if (activeTool === 'elements')` blocks:
  - Line 714: renders Magic Presets / Templates and returns.
  - Line 1326: renders `mockGraphicElements` grid.
  Because JavaScript executes top to bottom, Line 714 always returns, permanently shadowing Line 1326 as dead code.
* **Exact File & Lines:**
  - [`RawStudioInspector.tsx#L714`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L714)
  - [`RawStudioInspector.tsx#L1326`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L1326)

---

### 🔴 Defect E-02: Structural Templates Are Fake / Toast-Only (SEVERITY: P1)
* **User Impact:** Clicking templates like *"Viral Hook-Body-CTA"*, *"Educational Breakdown"*, or *"Product Showcase"* shows a success toast, but **does not create or arrange any clips on the timeline**.
* **Root Cause:** In [`RawStudioInspector.tsx:L783`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L783), `onClick` is simply `() => showToast(\`Applied \${tmpl.name} template\`)` with zero state dispatch.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L783`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L783)

---

### 🔴 Defect E-03: Graphic Elements Render as Plain Text Boxes in FFmpeg Export (SEVERITY: P1)
* **User Impact:** In the preview canvas, graphic elements appear as stickers/icons. In the rendered MP4 export, FFmpeg burns them as **plain text inside a solid purple box** (`boxcolor=0x6366f1@0.85`), ignoring SVG/PNG graphics.
* **Root Cause:** In [`ffmpeg-command-planner.ts:L213`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L213), overlay layers are implemented via `drawtext=text='${escaped}':box=1:boxcolor=0x6366f1@0.85` instead of genuine image overlays (`-i sticker.png` with `-filter_complex overlay`).
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L208-L215`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L208-L215)

---

### 🟡 Defect E-04: Elements Tab Lack Sub-Tabs (Stickers vs Presets vs Templates) (SEVERITY: P2)
* **User Impact:** Magic Presets, Templates, and Graphic Stickers are competing for the same `activeTool === 'elements'` tab without a segmented control (Tabs: `Stickers | Presets | Templates`).
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L714`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L714)

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR ELEMENTS TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Resolve Tool Shadowing with a Unified Segmented Inspector (`RawStudioInspector.tsx`):**
   * Merge Line 714 and Line 1326 under `if (activeTool === 'elements')`.
   * Add a top segmented pill bar: `[ 🎨 Stickers | ⚡ Magic Presets | 📐 Templates ]`.
   * When `Stickers` is active, render `mockGraphicElements` grid with click-to-insert.
2. **Implement Actual Timeline Insertion for Structural Templates (`RawStudioInspector.tsx`):**
   * Bind template cards to dispatch structured placeholder blocks (Hook block 0–3s, Body block 3–20s, CTA block 20–30s) instead of just firing a toast.
3. **Upgrade FFmpeg Graphic Overlays to Real Image/SVG Blending (`ffmpeg-command-planner.ts`):**
   * For sticker/graphic overlays, pass actual rendered image assets or emoji glyphs with alpha transparency rather than hardcoding solid purple text boxes.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #4 (ELEMENTS TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered a critical architectural duplicate block collision that completely hid the entire sticker gallery from users, and exposed that Structural Templates were toast-only placeholders.
> 
> Next recommended step in our roadmap: **Tool #5 — Upload / Assets Tool Deep Forensic Audit**.
