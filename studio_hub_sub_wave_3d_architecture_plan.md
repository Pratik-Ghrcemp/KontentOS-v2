# 📐 STUDIO HUB — SUB-WAVE 3D ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural specification and timeline hydration design for Sub-Wave 3D: Structural Template Engine.  
**Phase:** PHASE 16 — SUB-WAVE 3D (STRUCTURAL TEMPLATE ENGINE)  
**Date:** 2026-08-31  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3d_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: CURRENT TEMPLATE LIMITATIONS

We traced the Elements tool's Templates tab in `RawStudioInspector.tsx:L1002-L1023`:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           STRUCTURAL TEMPLATE LIFECYCLE TRACE                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CURRENT MOCK BEHAVIOR (RawStudioInspector.tsx:L1012)                                     │
│    • Renders 4 template cards (Viral Hook, Educational, Product Demo, Quick Tips).          │
│    • Clicking a template only triggers showToast('Applied ... template').                   │
│    • ZERO timeline items, text tracks, lower-thirds, or structural layers are generated!   │
│                                                                                             │
│ 2. TARGET ARCHITECTURAL SPECIFICATION                                                       │
│    • Create canonical template definition library (src/lib/editing/templates.ts).           │
│    • Dynamic timeline hydration: calculates layer start/end times relative to actual video   │
│      duration (or fallback 15s).                                                            │
│    • Safe track allocation: inserts multi-tier structured layers (Hook, Body, CTA) into     │
│      track-text-1 and track-text-2 while strictly preserving primary video assets.          │
│    • Immediate Preview and Export serialization parity.                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧩 CANONICAL TEMPLATE DEFINITIONS & TIMELINE HYDRATION

Each structural template dynamically calibrates its item durations to the composition's total duration ($T_{\text{total}}$):

```text
1. "Viral Hook-Body-CTA" (High Retention 3-Part Architecture)
   ├── [0.0s ➔ 3.0s]             Hook Title (Top-Center y: -140, Font 44, Gold #facc15)
   ├── [3.0s ➔ T_total - 3.0s]   Body Lower-Third (Bottom-Center y: 140, Font 28, White #fff)
   └── [T_total - 3.0s ➔ T_total] CTA Final Badge (Center y: 0, Font 38, Cyan #06b6d4)

2. "Educational Breakdown" (3-Phase Tutorial Framework)
   ├── [0.0s ➔ T_total * 0.33]   Step 1 Badge: "📌 STEP 1: The Foundation" (Top y: -130)
   ├── [T_total * 0.33 ➔ 0.66]   Step 2 Badge: "⚡ STEP 2: The Core Action" (Top y: -130)
   └── [T_total * 0.66 ➔ T_total]Step 3 Badge: "🎯 STEP 3: The Result" (Top y: -130)

3. "Product Showcase / Demo" (Feature Highlighting)
   ├── [0.0s ➔ T_total]          Persistent Header Pill: "✨ FEATURE SPOTLIGHT" (Top y: -180)
   ├── [1.5s ➔ 5.0s]             Feature Callout: "🔥 10x Faster Workflow" (Center y: -40)
   └── [T_total - 4.0s ➔ T_total]Offer / CTA Box: "🛒 Link in Bio • 20% OFF" (Bottom y: 130)

4. "Myth vs. Reality" (High Engagement Contrast)
   ├── [0.0s ➔ T_total * 0.5]    Myth Card: "❌ MYTH: Hard Work Alone Wins" (Rose Accent)
   └── [T_total * 0.5 ➔ T_total] Reality Card: "✅ REALITY: Smart Systems Scale" (Emerald Accent)
```

---

## 3. 🛡️ SAFE HYDRATION & IDEMPOTENCY ALGORITHM

```ts
export function applyStructuralTemplate(
  template: StructuralTemplate,
  currentItems: TimelineItem[],
  totalDuration: number,
  mode: 'replace_overlays' | 'append' = 'replace_overlays'
): TimelineItem[] {
  const durationSec = totalDuration > 0 ? totalDuration : 15;
  const newTemplateItems = template.generateItems(durationSec);

  if (mode === 'replace_overlays') {
    // Preserve primary video and audio tracks, replace existing text/overlay items
    const preservedItems = currentItems.filter(i => i.type === 'video' || i.type === 'audio');
    return [...preservedItems, ...newTemplateItems];
  }

  return [...currentItems, ...newTemplateItems];
}
```

---

## 4. 📁 EXACT PRODUCTION FILES TO MODIFY

| File | Scope of Modification |
| :--- | :--- |
| [`src/lib/editing/templates.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/templates.ts) [NEW] | Create canonical structural template engine with definitions for Viral Hook, Educational, Product Demo, and Myth Buster. |
| [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx) | Connect template cards in `elementsTab === 'templates'` to `applyStructuralTemplate`, dispatch `ADD_ITEM` actions, and select first generated item. |

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Overwriting user's primary video clips):** Applying a template removing existing media clips.
  - **Mitigation:** Strict type filtering: template hydration only inserts `text` and `overlay` items into `track-text-1` and `track-text-2`, never mutating `type: 'video'` clips.
* **Risk (Zero or negative duration clips on short videos):** Applying template on a 2-second clip causing CTA start time ($T - 3\text{s} = -1\text{s}$) to be negative.
  - **Mitigation:** Dynamic clamping: `Math.max(0, ...)` and proportional segmenting when total duration $< 6\text{s}$.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Suite (`scratch/wave-3d-compiler-verify.ts`):**
   - Test `generateItems` for all 4 templates at durations $15\text{s}$, $5\text{s}$, and $60\text{s}$.
   - Verify non-overlapping time ranges and valid coordinates.
2. **Playwright UI Suite (`scratch/wave-3d-template-verify.spec.js`):**
   - Open Elements $\to$ Templates $\to$ Click "Viral Hook-Body-CTA".
   - Assert 3 new timeline items appear on timeline lanes.
   - Assert preview renders the hook title with correct styling.
3. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - All previous test suites (Wave 1, 2A-2D, 3A-3C) passing 100%.

---

## 7. 🚦 READY FOR SURGICAL IMPLEMENTATION

The Sub-Wave 3D architecture is **fully designed and verified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3D implementation.
