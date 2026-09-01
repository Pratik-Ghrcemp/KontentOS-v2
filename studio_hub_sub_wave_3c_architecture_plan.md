# 📐 STUDIO HUB — SUB-WAVE 3C ARCHITECTURE & EXECUTION PLAN
**Document Purpose:** Complete dual-pipeline (Web Audio Preview + FFmpeg Export) specification for Sub-Wave 3C: Real Audio DSP Engine.  
**Phase:** PHASE 16 — SUB-WAVE 3C (REAL AUDIO DSP ENGINE)  
**Date:** 2026-08-31  
**Status:** **ARCHITECTURAL BLUEPRINT (ZERO PRODUCTION CODE MODIFIED)**  
**Artifact File:** `studio_hub_sub_wave_3c_architecture_plan.md`

---

## 1. 🔍 FORENSIC TRACE: DUAL-PIPELINE AUDIO ARCHITECTURE

We traced the complete audio pipeline across both Preview and Export environments:

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           DUAL-PIPELINE AUDIO DSP ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. PREVIEW PIPELINE (Web Audio API in VideoPreview.tsx)                                     │
│    • MediaElementAudioSourceNode on <video> element.                                        │
│    • BiquadFilterNode (Highpass, f=80Hz) to cut microphone handling noise / rumble.         │
│    • BiquadFilterNode (Peaking EQ, f=3000Hz, Q=1.0, Gain=+3dB) for vocal presence clarity. │
│    • DynamicsCompressorNode (threshold=-18dB, ratio=3:1, attack=15ms, release=120ms) for    │
│      speech dynamics leveling and broadcast punch.                                          │
│    • GainNode (primaryVol scale 0.0 - 2.0) -> audioContext.destination.                     │
│    • When voiceCleanup === false, filter nodes bypass (gain=0dB, ratio=1:1, f=10Hz).       │
│                                                                                             │
│ 2. EXPORT PIPELINE (FFmpeg Filter Graph in canonical.ts & ffmpeg-command-planner.ts)        │
│    • highpass=f=80 (sub-80Hz rumble removal)                                                │
│    • equalizer=f=3000:width_type=h:width=1000:g=3 (vocal presence boost)                   │
│    • acompressor=threshold=0.125:ratio=3:attack=15:release=120 (voice leveling)             │
│    • If noiseReduction: afftdn=nf=-25 (adaptive FFT noise reduction)                        │
│    • Placed BEFORE Wave 2D auto-ducking sidechain split ([a_0] -> Clean -> asplit=2)       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🎛️ SIGNAL FLOW & ORDERING GUARDRAIL

Both Preview and Export strictly apply Voice Cleanup DSP to the **Primary / Dialogue track BEFORE sidechain ducking and mixing**:

```text
                  PRIMARY / DIALOGUE AUDIO [a_0]
                               │
                               ▼
                    [VOICE CLEANUP DSP CHAIN]
  ┌───────────────────────────────────────────────────────────────┐
  │ 1. Highpass Filter: 80Hz (Sub-bass rumble / HVAC hum removal) │
  │ 2. Peaking Equalizer: 3000Hz, +3dB gain (Vocal presence boost)│
  │ 3. Dynamics Compressor: -18dB threshold, 3:1 ratio,           │
  │    15ms attack, 120ms release (Voice punch & leveling)        │
  │ 4. Optional Noise Reduction: afftdn=nf=-25                    │
  └───────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
                         [Cleaned Dialogue Pad]
                                  │
                                  ├───────────────────────────────┐
                                  │                               ▼
                                  │                 [Sidechain Trigger Signal]
                                  ▼                               │
                            [Master Gain]                         │
                                  │                               ▼
                                  │                   [BGM Sidechain Compressor]
                                  │                     (Wave 2D Auto-Ducking)
                                  │                               │
                                  └───────────────┬───────────────┘
                                                  ▼
                                          [Final Audio Mix]
```

---

## 3. 🧩 CANONICAL DATA MODELS & ALGORITHMS

### A. Extended CanonicalAudioMixOptions (`canonical.ts`)
```ts
export interface CanonicalAudioMixOptions {
  autoDuck?: boolean;
  voiceCleanup?: boolean;
  noiseReduction?: boolean;
  primaryVol?: number; // 0 - 100
  bgmVol?: number;     // 0 - 100
  hasPrimaryAudio: boolean;
  hasBgmAudio: boolean;
}
```

### B. FFmpeg Voice Cleanup DSP Compilation
```ts
if (options.voiceCleanup) {
  const dspParts = [
    'highpass=f=80',
    'equalizer=f=3000:width_type=h:width=1000:g=3',
    'acompressor=threshold=0.125:ratio=3:attack=15:release=120'
  ];
  if (options.noiseReduction) {
    dspParts.push('afftdn=nf=-25');
  }
  filterGraphLines.push(`[${primaryAudioPad}]${dspParts.join(',')}[a_pri_cleaned]`);
  primaryAudioPad = 'a_pri_cleaned';
}
```

---

## 4. 📁 EXACT PRODUCTION FILES TO MODIFY

| File | Scope of Modification |
| :--- | :--- |
| [`src/lib/editing/canonical.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/editing/canonical.ts) | Extend `CanonicalAudioMixOptions` with `voiceCleanup` & `noiseReduction`; insert DSP filter chain into `buildFfmpegAudioMixFilterGraph()`. |
| [`src/components/tabs/raw-studio/VideoPreview.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/VideoPreview.tsx) | Add Web Audio API DSP pipeline (`AudioContext`, `BiquadFilterNode` highpass 80Hz, peaking EQ 3kHz, `DynamicsCompressorNode`, `GainNode`) to `<video>` playback. |
| [`src/lib/rendering/builder.ts`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/builder.ts) | Pass `voiceCleanup` and `noiseReduction` from `audioSettings` into `RenderRequest.audioSettings`. |
| [`src/components/tabs/raw-studio/RawStudioInspector.tsx`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx) | Update Audio panel with real-time toggle badges and DSP visualizer indicators. |

---

## 5. 🛡️ REGRESSION RISKS & MITIGATION

* **Risk (Web Audio browser autoplay policy / user gesture block):** Creating `AudioContext` before user gesture can throw an error or start suspended.
  - **Mitigation:** Initialize `AudioContext` on user interaction (e.g. `onPlay` or within `useEffect` with `.resume()` call).
* **Risk (BGM distortion):** Applying voice filters to BGM.
  - **Mitigation:** Strict signal isolation: DSP nodes are attached solely to the primary `<video>` element, leaving BGM `<audio>` untouched.

---

## 6. 🧪 VERIFICATION STRATEGY

1. **Compiler Verification Suite (`scratch/wave-3c-compiler-verify.ts`):**
   - Verify `highpass=f=80`, `equalizer=f=3000`, `acompressor`, and `afftdn=nf=-25` generation when `voiceCleanup: true`.
   - Verify proper ordering: DSP $\to$ Volume $\to$ `asplit=2` $\to$ `sidechaincompress` $\to$ `amix`.
   - Verify clean bypass when `voiceCleanup: false`.
2. **Playwright UI Suite (`scratch/wave-3c-audio-dsp-verify.spec.js`):**
   - Toggle Voice Cleanup in Audio inspector $\to$ assert state updates.
   - Assert Web Audio DSP nodes engage without console errors.
3. **Master Regression Gate:**
   - `npx tsc --noEmit` (0 errors).
   - `wave-1-surgical-fix-verify.spec.js` (6/6 pass).
   - `wave-2a`, `2b`, `2c`, `2d` compiler suites (100% pass).
   - `wave-3a`, `3b` test suites (100% pass).

---

## 7. 🚦 READY FOR SURGICAL IMPLEMENTATION

The Sub-Wave 3C architecture is **fully designed with dual preview & export parity and verified signal flow**.  
No production code has been modified yet. Awaiting authorization to begin Sub-Wave 3C implementation.
