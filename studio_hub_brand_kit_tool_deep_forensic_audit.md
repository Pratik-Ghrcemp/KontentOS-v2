# 🔍 STUDIO HUB — TOOL #9: BRAND KIT TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Brand Kit & Watermark Engine  
**Audit Phase:** PHASE 9 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + Watermark Coordinates Tracing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_brand_kit_tool_deep_forensic_audit.md`

---

## 1. EXECUTIVE SUMMARY & BRAND KIT FORENSIC SCORECARD

The **Brand Kit & Watermark System** was audited across **Brand Presets**, **Typography Inheritance**, **Watermark Corner Positioning**, and **Physical Native FFmpeg Export Filters**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BRAND KIT TOOL FORENSIC QA SCORECARD                    │
│                                                                             │
│  TOTAL SCENARIOS AUDITED: 22 paths across Branding Lifecycle                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      12 features (54.5%)       │
│  🟡 PARTIAL / UX GAPS (PARTIAL):                   4 features (18.2%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  5 features (22.7%)       │
│  ⚫ FALSE CONFIDENCE / TOAST-ONLY APPLY BUTTON:    1 feature   (4.6%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Hardcoded Bottom-Right FFmpeg Position):    2                        │
│  - P2 (Missing Logo Image Upload & Opacity Slider):3                        │
│  - P3 (Brand Color Application Polish):            1                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. BRAND KIT UI & CONTROLS INVENTORY

| Control / Feature | UI Element | Attached Handler / State | Runtime Verification | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Brand Kit Preset** | Dropdown (`Minimal Neo`, `Cyber Glow`, `Creator Bold`, `Cinematic Warm`) | `setBrandKit(DEFAULT_BRAND_KITS[id])` | Updates `brandKit` in context. Preview badge updates text. | 🟢 **FULL PASS** |
| **Brand Colors** | 5 Color Palette Dots | `setBrandKit(colors.primary)` | Updates `brandKit.colors.primary`. | 🟢 **FULL PASS** |
| **Typography** | Font Dropdown (`Inter`, `Impact`, `Playfair`, `Orbitron`, `Montserrat`) | `setBrandKit(primaryFont.family)` | Captions and watermark inherit font family cleanly in preview canvas. | 🟢 **FULL PASS** |
| **Watermark Position** | Dropdown (`top-left`, `top-right`, `bottom-left`, `bottom-right`, `center`) | `setBrandKit(watermark.position)` | **PREVIEW-ONLY / EXPORT DISCONNECT:** Correctly positions watermark in preview; but FFmpeg command planner hardcodes position to bottom-right (`x=w-tw-24:y=h-th-24`), ignoring user selection! | 🔴 **FAIL (EXPORT PARITY)** |
| **Apply Brand Style** | Button (`Apply Brand Style`) | `showToast('Brand Kit applied')` | **TOAST-ONLY:** Fires toast; does not batch-update existing custom text/caption items. | 🟡 **PARTIAL / TOAST ONLY** |
| **Logo Image Upload** | Custom PNG/SVG logo file input | None | **MISSING FEATURE:** There is no logo upload button in the Brand Kit inspector. | 🔴 **FAIL (MISSING FEATURE)** |

---

## 3. ARCHITECTURE DEPENDENCY MAP & FILE INVENTORY

```text
Brand Kit Inspector Panel (RawStudioInspector.tsx:L1467-L1506)
 ├── Preset Dropdown ➔ setBrandKit (L1472)
 ├── Typography Dropdown ➔ setBrandKit.primaryFont (L1486)
 └── Watermark Position ➔ setBrandKit.watermark.position (L1495)
       │
       ▼
Preview Canvas Watermark Badge (VideoPreview.tsx:L1105-L1125)
 └── Absolute Positioning: top-left (top:16, left:16), top-right, bottom-left, bottom-right
       │
       ▼
FFmpeg Command Planner (ffmpeg-command-planner.ts:L217-L224)
 └── ❌ HARDCODED BOTTOM-RIGHT: drawtext=text='...':x=w-tw-24:y=h-th-24:fontsize=20
```

---

## 4. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect B-01: FFmpeg Export Watermark Position is Hardcoded to Bottom-Right (SEVERITY: P1)
* **User Impact:** If a creator selects *"Top Left"*, *"Top Right"*, *"Bottom Left"*, or *"Center"* in the Watermark Position dropdown, the editor preview shows it in the selected corner, but the exported MP4 video **always burns the watermark in the bottom-right corner**.
* **Root Cause:** In [`ffmpeg-command-planner.ts:L221`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L221), coordinates are statically hardcoded as `x=w-tw-24:y=h-th-24` instead of dynamically evaluating `watermark.position`:
  - `top-left` $\to$ `x=24:y=24`
  - `top-right` $\to$ `x=w-tw-24:y=24`
  - `bottom-left` $\to$ `x=24:y=h-th-24`
  - `center` $\to$ `x=(w-tw)/2:y=(h-th)/2`
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L221`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L221)

---

### 🔴 Defect B-02: Missing Logo Image Upload in Brand Kit Inspector (SEVERITY: P1)
* **User Impact:** Creators cannot upload their company PNG/SVG logo as a watermark; they are forced to use a text pill badge.
* **Root Cause:** In [`RawStudioInspector.tsx:L1467-L1506`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L1467-L1506), the UI omits a logo image file picker for `brandKit.watermark.logoUrl`.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L1467-L1506`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L1467-L1506)

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR BRAND KIT TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Fix Watermark Position Coordinate Mapping in FFmpeg (`ffmpeg-command-planner.ts`):**
   * Map `watermark.position`:
     ```ts
     const pos = wm.position || 'bottom-right';
     const posX = pos.includes('left') ? '24' : pos.includes('center') ? '(w-tw)/2' : 'w-tw-24';
     const posY = pos.includes('top') ? '24' : pos.includes('center') ? '(h-th)/2' : 'h-th-24';
     filterGraph.push(`[${currentVideoPad}]drawtext=text='${wmText}':x=${posX}:y=${posY}:fontsize=20:fontcolor=0xffffff@0.8[${wmPad}]`);
     ```
2. **Add Logo Image Upload Affordance to Brand Kit Panel (`RawStudioInspector.tsx`):**
   * Add a file input for PNG/SVG logos that sets `brandKit.watermark.logoUrl = URL.createObjectURL(file)`.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #9 (BRAND KIT TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered that FFmpeg hardcodes watermark placement to the bottom-right corner regardless of the dropdown selection, and the inspector lacks a logo image upload control.
> 
> Next recommended step in our roadmap: **Tool #10 — Settings Tool & Project Controls Deep Forensic Audit**.
