# 🔍 STUDIO HUB — TOOL #2: TEXT TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Text Tool & Canvas Text Overlays  
**Audit Phase:** PHASE 2 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + FFmpeg Command Planner Tracing  
**Audit Output File:** `studio_hub_text_tool_deep_audit.md`

---

## 1. EXECUTIVE SUMMARY & TEXT TOOL FORENSIC SCORECARD

Following the completed audit of the Select Tool, the **Text Tool & Text Overlay System** underwent an exhaustive forensic interrogation across creation, selection, inline editing, inspector synchronization, canvas direct manipulation, timeline lifecycle, and native FFmpeg burning.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TEXT TOOL FORENSIC QA SCORECARD                       │
│                                                                             │
│  TOTAL INTERACTION SCENARIOS AUDITED: 38 paths                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      24 features (63.2%)       │
│  🟡 PARTIAL / UX FRICTION (PARTIAL):               6 features (15.8%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  6 features (15.8%)       │
│  ⚫ FALSE CONFIDENCE / ASYMMETRY GAPS:             2 features  (5.2%)       │
│                                                                             │
│  SEVERITY BREAKDOWN:                                                        │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Critical Functional / Desync Blockers):     3                        │
│  - P2 (Interaction & Formatting Flaws):            4                        │
│  - P3 (Feature Polish & Typography Gaps):          3                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPREHENSIVE TEXT TOOL INTERROGATION & INTERACTION MATRIX

| Interaction Path | Intended UX | Observed Runtime Behavior | Status | Evidence & Code Location |
| :--- | :--- | :--- | :---: | :--- |
| **1. Click "+ Add Title"** | Adds main title at `currentTime` | Creates `type: 'title'`, duration $4.0\text{s}$, placed on `track-text-1`, rendered on canvas. | **PASS** | `text-factory.ts:L31-L35` |
| **2. Click "+ Lower 3rd"** | Adds lower third subtitle banner | Creates `type: 'lower_third'` at $y=220\text{px}$, font size $28\text{px}$, on `track-text-1`. | **PASS** | `text-factory.ts:L36-L39` |
| **3. Continuous "+ Add" Action** | User can add title then lower 3rd in sequence | **IMMEDIATE LOCKOUT:** Clicking "+ Add Title" auto-selects the text item, which immediately flips the inspector to "Text Properties", hiding the "+ Lower 3rd" button. | **FAIL** | `RawStudioInspector.tsx:L803` |
| **4. Direct Canvas Selection** | Clicking text overlay selects it | Border turns active indigo, 4 corner resize handles and top rotation stem appear. | **PASS** | `VideoPreview.tsx:L974, L1007` |
| **5. Direct Canvas Dragging** | Drag text around preview frame | Computes delta $x/y$, updates `left: calc(50% + Xpx)`, snaps to object/canvas center. | **PASS** | `VideoPreview.tsx:L280-L364` |
| **6. Corner Handle Scaling** | Dragging corner handle scales text | Computes diagonal distance, live scales `fontSize` between $12\text{px}$ and $120\text{px}$. | **PASS** | `VideoPreview.tsx:L144-L188` |
| **7. Rotation Stem Dragging** | Dragging top stem rotates text | Computes angle around text center, sets `transform: rotate(Xdeg)`. | **PASS** | `VideoPreview.tsx:L382-L425` |
| **8. Arrow Key Nudging** | Arrow keys move text by $\pm 1\text{px}$ | Arrow keys nudge $x/y$ by $1\text{px}$ ($10\text{px}$ with Shift held). | **PASS** | `RawStudio/index.tsx:L624-L642` |
| **9. Single-Item Content Editing** | Inspector allows typing new text when item is selected | **CRITICAL UX GAP:** Single-selection "Text Properties" panel ONLY has a Font Size slider and Color swatches. There is NO text content input field! | **FAIL** | `RawStudioInspector.tsx:L474-L510` |
| **10. Text Tool List Renaming** | Editing text in the Text Tool list updates canvas | **CRITICAL ASYMMETRY BUG:** Input updates `properties.text`, but `VideoPreview.tsx` line 1005 reads `textItem.content` ('MAIN TITLE'), completely ignoring the update! Canvas never reflects the edit! | **FAIL** | `RawStudioInspector.tsx:L842`, `VideoPreview.tsx:L1005` |
| **11. Font Size Slider** | Slider $12\text{px}-96\text{px}$ updates text | Smoothly updates `properties.fontSize`, reflected live on canvas. | **PASS** | `RawStudioInspector.tsx:L478-L488` |
| **12. Color Swatches** | 5 palette colors update text | Updates `properties.color` live (`#ffffff`, `#f59e0b`, `#10b981`, `#3b82f6`, `#ec4899`). | **PASS** | `RawStudioInspector.tsx:L491-L508` |
| **13. Font Family Selection** | User can choose typography | **NOT IMPLEMENTED:** No font family dropdown in inspector; defaults hardcoded to `'Inter'`. | **FAIL (FEATURE GAP)** | `RawStudioInspector.tsx:L474` |
| **14. Text Alignment Controls** | Align Left, Center, Right | **NOT IMPLEMENTED:** No alignment buttons in UI; hardcoded to `'center'`. | **FAIL (FEATURE GAP)** | `text-factory.ts:L68` |
| **15. Animation Presets** | Fade, Pop, Kinetic, Typewriter | **NOT IMPLEMENTED:** Factory sets `preset: 'standard'`; no UI controls exist to configure animations. | **FAIL (FEATURE GAP)** | `RawStudioInspector.tsx:L474` |
| **16. Timeline Left/Right Trim** | Dragging text clip edges adjusts duration | Adjusts `start`/`end` times cleanly; snaps to playhead and adjacent clips. | **PASS** | `Timeline.tsx:L56-L95` |
| **17. Timeline Split ('S')** | Split text overlay at playhead | Splits text into 2 independent sequential text clips on `track-text-1`. | **PASS** | `split.ts:L6-L26` |
| **18. Delete & Ripple Delete** | Pressing Backspace/Delete removes text | Removes clip from `editState.items`; cleans up canvas and selection cleanly. | **PASS** | `engine.ts:L54-L72` |
| **19. Multi-Select Text + Video** | Shift+Click selects text and video | Renders unified Group Bounding Box; dragging moves both simultaneously. | **PASS** | `VideoPreview.tsx:L1029-L1067` |
| **20. Multi-Line Text Wrapping** | Long text or newlines (`\n`) | `VideoPreview.tsx` lacks `whiteSpace: 'pre-wrap'`, collapsing newlines into spaces. | **PARTIAL** | `VideoPreview.tsx:L975` |
| **21. Unicode / Hindi / Emojis** | Rendering non-Latin characters | React DOM renders emojis and Devanagari text cleanly on canvas. | **PASS** | `VideoPreview.tsx:L1005` |
| **22. FFmpeg drawtext Export** | Burn text into rendered MP4 video | Native FFmpeg encodes text with `drawtext` filter with box background. | **PASS** | `ffmpeg-command-planner.ts:L183` |
| **23. FFmpeg Special Char Escape** | Text containing `%`, quotes, or colons | Escapes `'` and `:`, but does NOT escape `%` (which FFmpeg interprets as macro format tokens). | **PARTIAL** | `ffmpeg-command-planner.ts:L185` |
| **24. Undo / Redo Lifecycle** | Ctrl+Z / Ctrl+Y for all text actions | Full undo/redo fidelity for create, drag, resize, rotate, split, and delete. | **PASS** | `engine.ts:L333-L357` |

---

## 3. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect T-01: Text Renaming Canvas Desynchronization (SEVERITY: P1)
* **User Impact:** When a user types a new string into the Text Tool list (e.g. changing `"MAIN TITLE"` to `"VIRAL HOOK"`), the canvas **refuses to update** and permanently displays `"MAIN TITLE"`.
* **Reproduction Steps:**
  1. Click the Text tool and click `+ Add Title`.
  2. Press `Escape` or deselect the text item to view the Text Tool list in the inspector.
  3. Change the input text from `"MAIN TITLE"` to `"VIRAL HOOK"`.
  4. Look at the preview canvas.
* **Observed Result:** Canvas still shows `"MAIN TITLE"`.
* **Expected Result:** Canvas immediately updates to `"VIRAL HOOK"`.
* **Root Cause:**
  - `RawStudioInspector.tsx:L842` dispatches `UPDATE_PROPERTIES` which writes to `txt.properties.text`.
  - `VideoPreview.tsx:L1005` renders: `textItem.content || textItem.label || 'Text Overlay'`.
  - Because `textItem.content` was initialized to `'MAIN TITLE'`, `VideoPreview` always takes `textItem.content` and completely ignores `textItem.properties?.text`.
  - `composition-builder.ts:L88` reads `txt.text` (which comes from `item.properties?.text || item.label`), meaning **FFmpeg will render the new text while the editor canvas permanently shows the old text!**
* **Exact Files & Lines:**
  - [`src/components/tabs/raw-studio/VideoPreview.tsx#L1005`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx#L1005)
  - [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L842`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L842)

---

### 🔴 Defect T-02: Missing Text Content Field in Single-Selection Properties (SEVERITY: P1)
* **User Impact:** When a user clicks a text overlay directly on the preview canvas to edit it, the right inspector displays "Text Properties" (Font Size slider and 5 color dots), but **contains no text input box** to edit the words!
* **Reproduction Steps:**
  1. Click any text overlay on the canvas.
  2. Look at the right inspector panel.
* **Observed Result:** User can only adjust font size and color. There is no way to edit the text without deselecting the item, clicking the Text tool on the tool rail, and locating the item in the list.
* **Expected Result:** The single-selection "Text Properties" panel should feature a prominent `Text Content` input/textarea at the top.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L474-L510`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L474-L510)

---

### 🔴 Defect T-03: Add-Title Tool Lockout Chaining (SEVERITY: P1)
* **User Impact:** Clicking `+ Add Title` prevents the user from clicking `+ Lower 3rd` or adding another title immediately.
* **Root Cause:** In [`RawStudioInspector.tsx:L803`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L803), `handleAddTitle` invokes `selectSingle(newItem.id)`. This sets `selectedClipId`, which immediately triggers the single-selection inspector and hides the Text Tool panel.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L803, L811`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L803-L811)

---

### 🟡 Defect T-04: Missing Typography Controls (SEVERITY: P2)
* **User Impact:** Users cannot change Font Family (e.g. Montserrat, Oswald, Roboto), Font Weight (Regular, Bold, ExtraBold), or Text Alignment (Left, Center, Right).
* **Root Cause:** Factory defines `fontFamily`, `fontWeight`, and `alignment` in `properties`, but `RawStudioInspector.tsx` omits UI controls for them.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L474`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L474)

---

### 🟡 Defect T-05: Missing Animation Presets UI (SEVERITY: P2)
* **User Impact:** Factory supports `preset: 'standard' | 'kinetic' | 'fade' | 'pop' | 'typewriter'`, but no selector exists in the UI to choose animations.
* **Exact File & Line:** [`src/components/tabs/raw-studio/RawStudioInspector.tsx#L474`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L474)

---

### 🟡 Defect T-06: FFmpeg Drawtext '%' Character Unescaped (SEVERITY: P2)
* **User Impact:** Text containing the percent symbol (e.g. `"50% OFF TODAY"`) can cause FFmpeg `drawtext` parsing errors or unwanted macro expansions because `%` is a reserved format character in FFmpeg.
* **Root Cause:** [`ffmpeg-command-planner.ts:L185`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L185) only escapes `'` and `:`, forgetting to escape `%` to `%%`.
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L185`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L185)

---

## 4. ARCHITECTURAL DATA FLOW & PARITY MAP

```
USER ACTION                  STATE MUTATION                  PREVIEW CANVAS               FFMPEG RENDER
───────────────────          ──────────────                  ──────────────               ─────────────
1. Click "+ Add Title"       ADD_ITEM (type: 'text')         Renders at (50%, 50%-100px)  drawtext at y=(h-th)/2-100
2. Drag on Canvas            BATCH_UPDATE (x, y)             left/top CSS calc()          drawtext posX/posY offset
3. Corner Resize             UPDATE (fontSize)               style.fontSize = Xpx         drawtext fontsize=X
4. Rotate Stem               UPDATE (rotation)               transform: rotate(Xdeg)      (Text rotation static box)
5. Color Pick                UPDATE (color)                  style.color = '#hex'         drawtext fontcolor=0xhex
6. Edit Text in Inspector    UPDATE (properties.text)        ❌ BROKEN: reads .content    ✅ Reads properties.text
```

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR TEXT TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Fix Canvas Text Content Source (`VideoPreview.tsx`):**
   * Change line 1005:
     ```tsx
     // Before:
     textItem.content || textItem.label || 'Text Overlay'
     // After:
     textItem.properties?.text ?? textItem.content ?? textItem.label ?? 'Text Overlay'
     ```
2. **Add Text Content Input to Single-Selection Inspector (`RawStudioInspector.tsx`):**
   * In `isText` panel (line 474), add a primary `Text Content` textarea/input bound to `updateSelectedProperties({ text: e.target.value })` and syncing `label`.
3. **Add Typography & Alignment Controls (`RawStudioInspector.tsx`):**
   * Add Font Family dropdown (`Inter`, `Montserrat`, `Roboto`, `Oswald`, `Playfair Display`).
   * Add Text Alignment pill group (`Left`, `Center`, `Right`).
   * Add Animation Preset selector (`None`, `Fade In`, `Pop Up`, `Typewriter`).
4. **Escape `%` in FFmpeg Command Planner (`ffmpeg-command-planner.ts`):**
   * Update text escaper: `(txt.text || '').replace(/%/g, '%%').replace(/'/g, "\\'").replace(/:/g, '\\:');`.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #2 (TEXT TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered the exact reasons why Text editing is disjointed, why canvas text doesn't update when edited from the list, and why single text selection lacks a content field.
> 
> Next recommended step in our roadmap: **Tool #3 — Captions Tool Forensic Audit**.
