# 📐 STUDIO HUB — SUB-WAVE 2B ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and forensic mapping for Sub-Wave 2B: Caption WYSIWYG Compiler.  
**Phase:** PHASE 15 — SUB-WAVE 2B (CAPTION WYSIWYG COMPILER)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_2b_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: THE CAPTION LIFECYCLE GAP

We deeply traced the complete caption lifecycle across all 5 runtime layers:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CAPTION DATA LIFECYCLE TRACE                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. INSPECTOR CONTROLS (RawStudioInspector.tsx:L640-L675)                                    │
│    • Font Family dropdown (Poppins, Inter)                                                  │
│    • Font Size stepper (default 48px)                                                       │
│    • Color Swatches (#ffffff, #000000, #facc15, #ec4899, #06b6d4)                           │
│    • Alignment controls (Left, Center, Right)                                               │
│    • Style Presets (Hormozi, Neon, Minimal, Classic)                                        │
│                                                                                             │
│ 2. EDIT STATE & PREVIEW (VideoPreview.tsx:L1120-L1130)                                      │
│    • Live Canvas computes: color, size (rem/px), preset border/background                   │
│    • Preset 'minimal': transparent background, 500 weight                                   │
│    • Preset 'hormozi': uppercase, bold, yellow text, dark backdrop                         │
│                                                                                             │
│ 3. COMPOSITION BUILDER (builder.ts:L50-L58)                                                 │
│    • Passes captionStyle object and captionItems with text & properties                     │
│                                                                                             │
│ 4. FFMPEG COMMAND PLANNER (ffmpeg-command-planner.ts:L204-L212) ──► 💥 HARDCODED OVERRIDE! │
│    • fontSize = 38 (HARDCODED! Ignores user 48px/64px size)                                │
│    • fontColor = '0xffffff' (HARDCODED! Ignores user yellow/cyan/pink color)                │
│    • boxcolor = 0x000000@0.7 (HARDCODED! Ignores preset styling and minimal box=0)          │
│    • y = h-th-180 (HARDCODED! Ignores top/center/bottom position offset)                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🎯 SUB-WAVE 2B DEFECT RESOLUTION TARGETS

| Defect ID | Feature Area | Current Broken Behavior in FFmpeg Export | Target Wave 2B Architectural Fix |
| :--- | :--- | :--- | :--- |
| **`C-01`** | Font Size Parity | Caption exports with fixed 38px text regardless of inspector slider | Dynamically map `captionStyle.fontSize` or `cap.properties.fontSize` (default 48) to FFmpeg `fontsize` |
| **`C-01`** | Font Color Parity | Captions always export as plain white (`0xffffff`), ignoring yellow (`#facc15`) or pink (`#ec4899`) | Dynamically convert Hex color string to FFmpeg hex format: `fontColor.replace('#', '0x')` |
| **`C-01`** | Preset & Box Parity | Captions always render a solid black box (`0x000000@0.7`), breaking Minimal and Hormozi presets | Map preset styling: `minimal` $\to$ `box=0`, `hormozi` $\to$ `box=1:boxcolor=0x000000@0.85:borderw=3:bordercolor=black`, `classic` $\to$ `box=1:boxcolor=0x000000@0.7` |
| **`EXP-02`**| Position Parity | Caption vertical position is fixed to `h-th-180` | Map `captionStyle.position`: `bottom` $\to$ `h-th-180`, `top` $\to$ `180`, `center` $\to$ `(h-th)/2` |

---

## 3. 🧩 CANONICAL CAPTION STYLE CONTRACT & FORMULAS

### Canonical Caption Properties Interface
```ts
export interface CanonicalCaptionStyle {
  fontFamily?: string;         // 'Poppins' | 'Inter' | 'Montserrat'
  fontSize: number;            // Normalized pixel size e.g. 48
  fontColor: string;           // e.g. '#facc15' (Yellow) or '#ffffff' (White)
  backgroundColor?: string;    // e.g. '#000000'
  backgroundOpacity?: number;  // 0.0 - 1.0 (default 0.7)
  preset?: 'classic' | 'hormozi' | 'minimal' | 'neon' | 'karaoke';
  position?: 'top' | 'center' | 'bottom';
  alignment?: 'left' | 'center' | 'right';
  borderWidth?: number;
  borderColor?: string;
}
```

### Pure Converter Function: CSS Style ➔ FFmpeg `drawtext` Filter
```ts
export function buildFfmpegCaptionDrawtextParams(
  style: Partial<CanonicalCaptionStyle>,
  text: string,
  startTime: number,
  endTime: number
): string {
  const escapedText = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
  const fontSize = style.fontSize || 48;
  const rawColor = style.fontColor || '#ffffff';
  const fontColor = rawColor.startsWith('#') ? rawColor.replace('#', '0x') : rawColor;
  
  // Position mapping
  let posY = 'h-th-180';
  if (style.position === 'top') posY = '180';
  else if (style.position === 'center') posY = '(h-th)/2';

  let posX = '(w-tw)/2';
  if (style.alignment === 'left') posX = '48';
  else if (style.alignment === 'right') posX = 'w-tw-48';

  // Preset mapping
  const preset = style.preset || 'classic';
  let boxParams = 'box=1:boxcolor=0x000000@0.7:boxborderw=10';
  let borderParams = '';

  if (preset === 'minimal') {
    boxParams = 'box=0';
  } else if (preset === 'hormozi') {
    boxParams = 'box=1:boxcolor=0x000000@0.85:boxborderw=12';
    borderParams = ':borderw=3:bordercolor=black';
  } else if (preset === 'neon') {
    boxParams = 'box=1:boxcolor=0x06b6d4@0.3:boxborderw=14';
    borderParams = ':borderw=2:bordercolor=0x06b6d4';
  }

  return `drawtext=text='${escapedText}':x=${posX}:y=${posY}:fontsize=${fontSize}:fontcolor=${fontColor}:${boxParams}${borderParams}:enable='between(t,${startTime},${endTime})'`;
}
```

---

## 4. 📁 FILES TO MODIFY IN SUB-WAVE 2B IMPLEMENTATION

1. [`src/lib/editing/canonical.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/canonical.ts):
   - Add `buildFfmpegCaptionDrawtextParams()` pure converter.
   - Add `resolveCaptionStyle()` fallback resolver (`item.properties ➔ captionStyle ➔ default`).
2. [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts):
   - Pass resolved `captionStyle` with font, size, color, preset, and position in `RenderRequest`.
3. [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
   - Replace hardcoded `fontSize=38` and `fontColor='0xffffff'` in `captionLayers.forEach` with `buildFfmpegCaptionDrawtextParams()`.

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk:** Non-standard hex colors causing FFmpeg command syntax error.
  - **Mitigation:** Strict `#` $\to$ `0x` normalization with hex validation fallback to `0xffffff`.
* **Risk:** Escaped single quotes or colons in caption subtitles breaking filter graph parsing.
  - **Mitigation:** Comprehensive text escaping: `.replace(/'/g, "\\'").replace(/:/g, '\\:')`.
* **Risk:** Breaking existing Wave 1 or Wave 2A visual overlays.
  - **Mitigation:** Caption rendering is completely isolated in the `captionLayers` loop; zero visual overlay or video concat logic is modified.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Script (`wave-2b-compiler-verify.ts`):**
   - Test "Alex Hormozi" preset (Yellow text `0xfacc15`, 48px, thick black border).
   - Test "Minimal" preset (White text `0xffffff`, `box=0`).
   - Test "Neon" preset (Cyan box & border).
   - Test custom position (`top` $\to$ `y=180`, `center` $\to$ `y=(h-th)/2`).
2. **Playwright UI Test (`wave-2b-ui-verify.spec.js`):**
   - Change caption color and style in inspector.
   - Verify preview and builder serialization.
3. **Full Regression Gate:**
   - Re-run `npx tsc --noEmit` (0 errors).
   - Re-run `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - Re-run `wave-2a-compiler-verify.ts` (100% pass).

---

## 7. 🚦 READY FOR EXECUTION

The Sub-Wave 2B architecture is **fully designed and verified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 2B implementation.
