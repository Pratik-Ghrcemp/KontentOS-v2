# 📐 STUDIO HUB — SUB-WAVE 3E ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural specification for Sub-Wave 3E: Speech Intelligence & Auto Transcription Engine.  
**Phase:** PHASE 16 — SUB-WAVE 3E (SPEECH INTELLIGENCE & AUTO TRANSCRIPTION ENGINE)  
**Date:** 2026-08-31  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3e_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: CURRENT CAPTIONS & TRANSCRIPTION GAPS

We traced the Captions tool across `RawStudioInspector.tsx:L775-L870`, `index.tsx:L513-L526`, and `src/app/api/ai/transcribe/route.ts`:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           SPEECH INTELLIGENCE & CAPTION TRACE                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CURRENT GAPS IN CAPTIONS INSPECTOR (RawStudioInspector.tsx)                              │
│    • Lacks an editable Transcript Segment list: once captions are generated, users cannot   │
│      see, click, seek, or edit individual caption phrases in the inspector panel.          │
│    • Lacks dynamic caption preset switching (Hormozi, Neon, Minimal, Classic) directly      │
│      updating all active caption items.                                                     │
│    • Lacks a "Clear Captions" reset action.                                                 │
│                                                                                             │
│ 2. TARGET ARCHITECTURAL SPECIFICATION                                                       │
│    • Real-time Speech Transcription: sends audio/video blob to /api/ai/transcribe           │
│      (or generates time-calibrated phrases matching duration).                              │
│    • Timed phrase segmentation: creates synchronized TimelineItem objects with exact        │
│      start and end times on track-text-1.                                                   │
│    • Interactive Transcript Inspector: renders real-time list of all caption phrases with   │
│      inline text editing, seek-to-phrase buttons, and delete segment controls.              │
│    • Style Presets: Alex Hormozi (Gold/Black stroke), Neon Glow (Cyan), Minimal, Classic.   │
│    • Full 3-Way Parity: Inspector Editor ↔ Preview Canvas (WYSIWYG) ↔ FFmpeg Export.        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔤 TIMELINE DATA MODEL & SEGMENT SYNCHRONIZATION

Each transcribed speech phrase maps to a canonical `TimelineItem`:

```ts
export interface CaptionTimelineItem extends TimelineItem {
  type: 'caption';
  trackId: 'track-text-1';
  start: number; // in seconds (e.g. 0.0)
  end: number;   // in seconds (e.g. 2.4)
  label: string; // e.g. "Caption: NEVER GIVE UP"
  content: string; // e.g. "NEVER GIVE UP"
  properties: {
    fontFamily: string;
    fontSize: number;
    color: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    boxPadding?: number;
    preset?: 'hormozi' | 'neon' | 'minimal' | 'boxed';
    position?: 'top' | 'center' | 'bottom';
    borderWidth?: number;
    borderColor?: string;
  };
}
```

---

## 3. 🎬 INTERACTIVE TRANSCRIPT INSPECTOR UI

When `activeTool === 'captions'`:
1. **Hero Header**: Preset style selector (Hormozi, Neon, Minimal, Boxed) + "Regenerate Captions" + "Clear Captions".
2. **Interactive Phrase List**:
   - Time range badge: `[00:00.0 - 00:02.4]`.
   - Editable phrase textarea with instant state dispatch (`UPDATE_ITEM`).
   - "Seek to Time" trigger (`seekTo(start)`).
   - "Delete Phrase" button.
3. **Add Custom Segment**: "+ Add Subtitle Block at Playhead".

---

## 4. 📁 EXACT PRODUCTION FILES TO MODIFY

| File | Scope of Modification |
| :--- | :--- |
| [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx) | Replace static placeholder cards in `activeTool === 'captions'` with interactive transcript segment list, inline editors, preset switchers, and seek buttons. |
| [`src/components/tabs/raw-studio/index.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/index.tsx) | Enhance `handleGenerateCaptions` with clean regeneration (clearing old captions first) and selecting the first segment. |

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Caption overlap on regeneration):** Clicking "Auto Generate Captions" multiple times duplicating dozens of stacked captions on the timeline.
  - **Mitigation:** Regeneration clears existing `type === 'caption'` items before injecting the newly transcribed set.
* **Risk (Out of bounds time offsets):** Phrases extending past the total media duration.
  - **Mitigation:** Clamp end time to `Math.min(end, totalDuration)`.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Suite (`scratch/wave-3e-compiler-verify.ts`):**
   - Verify caption generation and segmentation data models.
   - Verify FFmpeg drawtext compilation for Alex Hormozi and Neon presets across generated segments.
2. **Playwright UI Suite (`scratch/wave-3e-captions-verify.spec.js`):**
   - Click "Auto Generate Captions" $\to$ assert transcript phrase list populates.
   - Edit phrase text in inspector $\to$ assert timeline item content and preview update.
   - Switch preset to "Neon" $\to$ assert visual styling updates.
   - Click "Clear All Captions" $\to$ assert timeline cleans up safely.
3. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - All previous test suites (Wave 1, 2A-2D, 3A-3D) passing 100%.

---

## 7. 🚦 READY FOR SURGICAL IMPLEMENTATION

The Sub-Wave 3E architecture is **fully designed and verified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3E implementation.
