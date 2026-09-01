# 📐 STUDIO HUB — SUB-WAVE 2D ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Architectural blueprint and mathematical specification for Sub-Wave 2D: Audio Mix Parity Engine (Auto Ducking & Audio Volume Parity).  
**Phase:** PHASE 15 — SUB-WAVE 2D (AUDIO MIX PARITY ENGINE)  
**Date:** 2026-08-30  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_2d_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: THE AUDIO PIPELINE GAP

We traced the complete audio routing lifecycle from Inspector state to FFmpeg filter graphs:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            AUDIO PIPELINE LIFECYCLE TRACE                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. INSPECTOR CONTROLS (RawStudioInspector.tsx:L1236-L1262)                                  │
│    • Primary Audio Master Volume slider (primaryVol: 0-100%)                                │
│    • Auto Ducking (Speech Reactive) checkbox (autoDuck: boolean)                            │
│    • Voice Cleanup checkbox (voiceCleanup: boolean)                                         │
│                                                                                             │
│ 2. PREVIEW AUDIO MIXER (VideoPreview.tsx:L688-L706)                                         │
│    • Calculates duckingGain = calculateDuckingGain(currentTime, primaryClips)              │
│    • Dynamically attenuates BGM audio element volume by -10dB when speech is active         │
│                                                                                             │
│ 3. COMPOSITION BUILDER (builder.ts:L96-L99)                                                 │
│    • Serializes audioSettings: { primaryVol, bgmVol, autoDuck, clips: audioClips }          │
│                                                                                             │
│ 4. FFMPEG PLANNER (ffmpeg-command-planner.ts:L260-L277) ──► 💥 STATIC AMIX OVERRIDE!       │
│    • Ignores autoDuck flag completely!                                                      │
│    • Blends BGM directly into dialogue with static amix (no sidechain compression)         │
│    • BGM plays at full uncompressed volume over dialogue in final MP4 export               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🧮 MATHEMATICAL SPECIFICATION: SPEECH-REACTIVE AUTO DUCKING IN FFMPEG

### The Filter Graph Architecture: `asplit` + `sidechaincompress` + `amix`

When `composition.audioSettings?.autoDuck === true` and both primary dialogue audio and BGM exist:

```text
               ┌───────────────────────┐
               │ Primary Audio Stream  │ [a_primary]
               └──────────┬────────────┘
                          │
                          ▼
                       asplit=2
                      /        \
                     /          \
          [a_main]  /            \  [a_sidechain] (Trigger Signal)
                   /              \
                  │                ▼
                  │     ┌─────────────────────────────────────────────────────────┐
                  │     │                   sidechaincompress                     │
                  │     │ threshold=0.125 : ratio=4 : attack=50 : release=300     │
                  │     └──────────────────────────┬──────────────────────────────┘
                  │                                │
                  │                                ▼
                  │                    [a_bgm_ducked] (Attenuated BGM)
                  │                                │
                  └──────────────┬─────────────────┘
                                 │
                                 ▼
                   amix=inputs=2:duration=first
                                 │
                                 ▼
                     [a_mixed] (Final Mixed Stream)
```

### FFmpeg Filter Parameters
* `threshold=0.125` ($-18\text{dB}$ trigger sensitivity for speech activity)
* `ratio=4` ($4:1$ gain compression ratio $\approx -10\text{dB}$ attenuation matching preview)
* `attack=50` ($50\text{ms}$ smooth ducking transition when speech begins)
* `release=300` ($300\text{ms}$ natural recovery when speech pauses)

---

## 3. 🔊 MASTER AUDIO VOLUME PARITY IN FFMPEG

1. **Primary Audio Stream Volume:**
   $$\text{Gain}_{\text{primary}} = \frac{\text{audioSettings.primaryVol}}{100}$$
   Applied via `volume=${Gain_primary}` on primary audio stream.
2. **Background Music Stream Volume:**
   $$\text{Gain}_{\text{bgm}} = \frac{\text{audioSettings.bgmVol}}{100}$$
   Applied via `volume=${Gain_bgm}` on BGM audio layers.
3. **Fallback When No Speech/Video Audio Exists:**
   If `videoLayers` has no audio and only BGM exists, BGM is routed directly to `[a_out]` without sidechaining.

---

## 4. 📁 FILES TO MODIFY IN SUB-WAVE 2D

1. [`src/lib/editing/canonical.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/canonical.ts):
   - Add `buildFfmpegAudioMixFilterGraph()` pure generator that compiles sidechain ducking and volume scaling graphs.
2. [`src/lib/rendering/ffmpeg-command-planner.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts):
   - In Step 7 (Audio Mixing), replace static `amix` with `buildFfmpegAudioMixFilterGraph()`.

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Missing primary audio stream breaking sidechain):** If primary video has no audio tracks, `asplit` on an empty stream would cause an FFmpeg filter error.
  - **Mitigation:** Verify `currentAudioPad` contains active audio or synthesized silence before applying `asplit`.
* **Risk (Audio / Video duration mismatch):** Using `duration=longest` in `amix` could make the exported video hang on a black screen while BGM finishes.
  - **Mitigation:** Enforce `duration=first` in `amix` to ensure exported video duration strictly matches the video timeline.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Script (`wave-2d-compiler-verify.ts`):**
   - Test with `autoDuck: true` $\to$ verify `asplit=2`, `sidechaincompress`, and `amix` exist in filter graph.
   - Test with `autoDuck: false` $\to$ verify standard `amix` without sidechaining.
   - Test primary volume scaling ($50\% \to 0.5$).
2. **Playwright UI Test (`wave-2d-ui-verify.spec.js`):**
   - Toggle Auto-Ducking in Audio inspector.
   - Verify Audio master slider interaction.
3. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a-compiler-verify.ts` (100% pass).
   - `wave-2b-compiler-verify.ts` (100% pass).
   - `wave-2c-compiler-verify.ts` (100% pass).

---

## 7. 🚦 READY FOR EXECUTION

The Sub-Wave 2D architecture is **fully designed and mathematically specified**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 2D implementation.
