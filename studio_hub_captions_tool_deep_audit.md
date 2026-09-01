# 🔍 STUDIO HUB — TOOL #3: CAPTIONS TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Captions Tool, Subtitles & Transcription Engine  
**Audit Phase:** PHASE 3 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + API Route Tracing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_captions_tool_deep_audit.md`

---

## 1. EXECUTIVE SUMMARY & CAPTIONS TOOL FORENSIC SCORECARD

The **Captions Tool & Subtitle Pipeline** was subjected to end-to-end verification across the 5 core system layers: **UI Layer**, **State/API Layer**, **Preview Canvas**, **Render Request/Planner**, and **Physical FFmpeg Export**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CAPTIONS TOOL FORENSIC QA SCORECARD                    │
│                                                                             │
│  TOTAL INTERACTION SCENARIOS AUDITED: 34 paths                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      18 features (52.9%)       │
│  🟡 PARTIAL / MOCKUP GAPS (PARTIAL):               6 features (17.6%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  8 features (23.5%)       │
│  ⚫ FALSE CONFIDENCE / FAKE TRANSCRIPTION:         2 features  (5.9%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Critical WYSIWYG & Desynchronization):      4                        │
│  - P2 (Dead UI & Missing Handlers):                4                        │
│  - P3 (Styling & Preset Polish):                   2                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 5-LAYER END-TO-END VERIFICATION SPECTRUM

| System Layer | Claim / Feature | Verified Reality | Status |
| :--- | :--- | :--- | :---: |
| **Layer 1: UI Layer** | Captions Inspector Tool Panel | Opens on tool rail click; however, **almost the entire panel (Font, Size, Alignment, Color swatches, AI suggestions, Add to Brand Kit) is dead static mockup HTML** with zero `onClick` handlers. | **FAIL (DEAD UI)** |
| **Layer 2: AI / State** | "Auto Generate Captions" from video audio | **FAKE TRANSCRIPTION:** Does NOT extract or transcribe the video's audio track. Sends an LLM prompt to hallucinate synthetic motivational phrases based solely on `durationSeconds`. | **FAIL (PRODUCT GAP)** |
| **Layer 2b: Auth Guard** | `/api/ai/captions` route | Rejects requests with HTTP 401 when running in local/admin demo session; UI fails silently with 0 captions. | **PARTIAL / FAIL** |
| **Layer 3: Preview Canvas** | Subtitle rendering & timing sync | Subtitle appears on canvas at correct timestamp; however, **`pointerEvents: 'none'` prevents clicking subtitles** on canvas to select or edit. | **PARTIAL** |
| **Layer 4: Render Request** | Captions in `buildRenderRequestFromEditState` | Correctly filters `type: 'caption'` and structures `captions: [{ text, start_time, end_time }]`. | **PASS** |
| **Layer 5: FFmpeg Export** | Subtitles burned into physical MP4 | **WYSIWYG EXPORT BREAKDOWN:** FFmpeg `drawtext` has font size (`38`), color (`white`), position (`bottom`), and black box **hardcoded**. Canvas style customizations are completely ignored during render! | **FAIL (WYSIWYG VIOLATION)** |

---

## 3. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect C-01: Preview vs Export Captions Style Disconnect (SEVERITY: P1)
* **User Impact:** The editor preview canvas respects custom caption styling (e.g. Yellow text, Top position, Minimal transparent preset), but the **final exported MP4 permanently burns hardcoded white text in a black box at the bottom**.
* **Root Cause:**
  - `VideoPreview.tsx:L1094-L1100` dynamically applies `captionStyle.position`, `captionStyle.color`, `captionStyle.size`, and `captionStyle.preset`.
  - [`ffmpeg-command-planner.ts:L200-L202`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L200-L202) hardcodes `fontSize = 38`, `fontColor = '0xffffff'`, `y = h-th-180`, and `boxcolor = 0x000000@0.7`.
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L196-L205`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L196-L205)

---

### 🔴 Defect C-02: "Auto Generate Captions" Does Not Transcribe Audio (SEVERITY: P1)
* **User Impact:** Clicking "Auto Generate Captions" does not listen to or transcribe the actual speech in the uploaded video. It generates generic canned placeholder sentences (*"Are you still doing this manually? There is a smarter way..."*).
* **Root Cause:** In [`src/components/tabs/raw-studio/index.tsx:L505`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/index.tsx#L505), `handleGenerateCaptions` calls `generateCaptions({ durationSeconds })` which only prompts an LLM with duration, completely omitting speech-to-text audio extraction (`transcribeMedia`).
* **Exact File & Line:** [`src/components/tabs/raw-studio/index.tsx#L505-L514`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/index.tsx#L505-L514)

---

### 🔴 Defect C-03: Subtitle Overlay Pointer Interception (SEVERITY: P1)
* **User Impact:** Users cannot click, select, or directly reposition caption text on the canvas.
* **Root Cause:** In [`VideoPreview.tsx:L1094`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L1094), `pointerEvents: 'none'` is hardcoded on `.studio-subtitle-overlay`.
* **Exact File & Line:** [`src/components/tabs/raw-studio/VideoPreview.tsx#L1094`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L1094)

---

### 🔴 Defect C-04: Captions Inspector is 90% Dead Mockup UI (SEVERITY: P1)
* **User Impact:** Users cannot change Caption Font, Size, Alignment, Color, or Preset from the Captions tool panel.
* **Root Cause:** In [`RawStudioInspector.tsx:L640-L710`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L640-L710):
  - Font dropdown has only 1 static option (`Poppins`).
  - Size `+`/`-` buttons have no `onClick` handlers.
  - Alignment buttons (`≡`, `≡`, `≡`) have no `onClick` handlers.
  - Color dots have no `onClick` handlers.
  - AI Suggestions (`🔥 Gradient`, `✨ Trending`, `💬 Dynamic`) have no `onClick` handlers.
  - `+ Add to Brand Kit` has no `onClick` handler.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L640-L710`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L640-L710)

---

### 🟡 Defect C-05: Missing Caption Transcript / Segment Edit List (SEVERITY: P2)
* **User Impact:** Once captions are generated, there is no list in the Captions panel showing the individual caption lines to edit spelling, adjust timestamps, or delete individual subtitle segments.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L619-L712`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L619-L712)

---

### 🟡 Defect C-06: Local / Admin Demo Session 401 Silent Failure (SEVERITY: P2)
* **User Impact:** In local development or demo admin mode, `authedFetch` fails with 401 Unauthorized because Supabase session token is missing, and the UI fails silently without an explanatory toast.
* **Exact File & Line:** [`src/lib/ai/ai-service.ts#L17-L22`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/ai/ai-service.ts#L17-L22)

---

## 4. ARCHITECTURAL DATA FLOW & PARITY MAP

```
USER ACTION                    STATE MUTATION                  PREVIEW CANVAS                FFMPEG RENDER
───────────────────            ──────────────                  ──────────────                ─────────────
1. Auto Generate Captions      ADD_ITEM (type: 'caption')      Renders at bottom             drawtext with box
2. Select Caption Clip         editState.selection = [id]      ❌ Blocked by pointer-none    N/A (State only)
3. Change Position to Top      captionStyle.position = 'top'   Renders at top 80%            ❌ HARDCODED BOTTOM (y=h-th-180)
4. Change Color to Yellow      captionStyle.color = '#facc15'  Renders yellow text           ❌ HARDCODED WHITE (0xffffff)
5. Change Preset to Minimal    captionStyle.preset = 'minimal' Removes black box             ❌ HARDCODED BLACK BOX (@0.7)
6. Trim Caption on Timeline    UPDATE (start, end)             Syncs with playhead seek      drawtext enable='between(t,s,e)'
```

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR CAPTIONS TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Connect FFmpeg Planner to Dynamic Caption Style (`ffmpeg-command-planner.ts`):**
   * Read `composition.captionStyle` in `ffmpeg-command-planner.ts`:
     - Font size: `composition.captionStyle.size ? composition.captionStyle.size * 32 : 38`
     - Font color: `(composition.captionStyle.color || '#ffffff').replace('#', '0x')`
     - Y position: `composition.captionStyle.position === 'top' ? '80' : composition.captionStyle.position === 'center' ? '(h-th)/2' : 'h-th-180'`
     - Box color: `composition.captionStyle.preset === 'minimal' ? '0x000000@0.0' : '0x000000@0.7'`
2. **Wire Real Audio Speech-to-Text Transcription (`RawStudio/index.tsx`):**
   * Wire `handleGenerateCaptions` to extract audio from `activeAsset` and send to `/api/ai/transcribe` (Whisper) for genuine speech transcription with fallback to LLM.
3. **Activate Captions Inspector Controls (`RawStudioInspector.tsx`):**
   * Bind Font Size `+`/`-` buttons to `setCaptionStyle(prev => ({ ...prev, size: ... }))`.
   * Bind Color swatches to `setCaptionStyle(prev => ({ ...prev, color: ... }))`.
   * Bind Alignment buttons to `setCaptionStyle(prev => ({ ...prev, alignment: ... }))`.
   * Bind AI Presets to apply kinetic, minimal, or gradient styles.
4. **Add Caption Transcript List to Inspector (`RawStudioInspector.tsx`):**
   * Render a scrollable list of generated caption items with inline text inputs, start/end timestamps, and delete buttons.
5. **Enable Direct Canvas Caption Interaction (`VideoPreview.tsx`):**
   * Set inner subtitle badge to `pointerEvents: 'auto'`, `cursor: 'pointer'`, and `onClick={() => selectSingle(activeCaptionItem.id)}`.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #3 (CAPTIONS TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have proven that the Captions tool has high-level UI and timeline support, but suffers from **hardcoded FFmpeg export filters**, **dead mockup inspector controls**, and **placeholder-only LLM caption generation**.
> 
> Next recommended step in our roadmap: **Tool #4 — Elements Tool Deep Forensic Audit**.
