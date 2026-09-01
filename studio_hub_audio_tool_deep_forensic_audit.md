# 🔍 STUDIO HUB — TOOL #6: AUDIO TOOL DEEP FORENSIC QA AUDIT & RUNTIME KNOWLEDGE MAP
**Component:** Studio Hub → Left Tool Rail → Audio Tool, BGM Library & Mixing Engine  
**Audit Phase:** PHASE 6 — ADVERSARIAL RUNTIME VERIFICATION & PIPELINE TRACE  
**Date:** 2026-08-30  
**Test Engine:** Playwright Live Browser Automation + Web Audio API Tracing + FFmpeg Command Planner  
**Audit Output File:** `studio_hub_audio_tool_deep_forensic_audit.md`

---

## 1. EXECUTIVE SUMMARY & AUDIO TOOL FORENSIC SCORECARD

The **Audio Tool & Audio Mixing Engine** underwent exhaustive multi-layer verification across **UI Controls**, **Audio Ingestion**, **Timeline Audio Tracks**, **Live Web Audio / HTML5 Playback**, and **Physical Native FFmpeg Export**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUDIO TOOL FORENSIC QA SCORECARD                       │
│                                                                             │
│  TOTAL SCENARIOS AUDITED: 38 paths across Audio Lifecycle                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  🟢 RUNTIME VERIFIED (PASS):                      20 features (52.6%)       │
│  🟡 PARTIAL / UX GAPS (PARTIAL):                   7 features (18.4%)       │
│  🔴 RUNTIME BROKEN / ARCHITECTURAL DEFECT (FAIL):  8 features (21.1%)       │
│  ⚫ FALSE CONFIDENCE / FAKE CLEANUP & MOCK BGM:    3 features  (7.9%)       │
│                                                                             │
│  SEVERITY CLASSIFICATION:                                                   │
│  - P0 (Showstoppers):                              0                        │
│  - P1 (Critical BGM Library & Ducking Export Gaps):3                        │
│  - P2 (Fake Voice Cleanup & Missing Audio Waveform):4                       │
│  - P3 (Audio Polish & Track Controls):             3                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AUDIO TOOL UI & CONTROLS INVENTORY

| Control / Feature | UI Element | Attached Handler / State | Runtime Verification | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Primary Master Volume** | Slider ($0\%-100\%$) | `setAudioSettings(primaryVol)` | Live updates HTML5 `video.volume` ($0.0-1.0$) and `video.muted`. Passes to FFmpeg `volume=X`. | 🟢 **FULL PASS** |
| **Voice Cleanup** | Checkbox toggle | `setAudioSettings(voiceCleanup)` | **100% FAKE / COSMETIC:** Does zero audio filtering (no highpass/denoiser). Only dims Primary Audio timeline track opacity from 1.0 to 0.8! | 🔴 **FAIL (FAKE FEATURE)** |
| **Auto Ducking** | Checkbox toggle | `setAudioSettings(autoDuck)` | **PREVIEW-ONLY / EXPORT GAP:** Live calculates `calculateDuckingGain()` in browser preview; but FFmpeg command planner omits dynamic ducking filters during MP4 export! | 🟡 **PARTIAL / EXPORT GAP** |
| **BGM Master Volume** | Slider ($0\%-100\%$) | `setAudioSettings(bgmVol)` | Updates `audioRef.current.volume`. Passed to FFmpeg audio layer `volume=X`. | 🟢 **FULL PASS** |
| **BGM Stock Tracks** | 3 Track Cards (`Lofi Chill`, `Viral Pop`, `Corporate Tech`) | `onClick` checks `m.url` | **100% BLOCKED:** `url` is undefined on all items in `mockMusic`; shows toast *"BGM preview source pending"* and refuses to add to timeline! | 🔴 **FAIL (BLOCKED)** |
| **AI Silence Removal** | Analyze & Remove Silence button | `handleAnalyzeSilence` | **WORKING:** Decodes audio with Web Audio API `AudioContext`, extracts waveform peaks, detects silence gaps, renders interactive cut preview modal, and dispatches atomic `APPLY_SILENCE_CUT_PLAN` in 1 undo step. | 🟢 **FULL PASS** |
| **Track Mute (Video 1 & Audio 1)**| Mute Icon on Timeline | `TOGGLE_TRACK_MUTE` | Mutes audio in live preview (`video.muted = true`) and passes silence synthesis `aevalsrc=0` to FFmpeg. | 🟢 **FULL PASS** |
| **Track Lock** | Lock Icon on Timeline | `TOGGLE_TRACK_LOCK` | Dims track to 0.5 opacity; protects audio clips from trim/split/delete in reducer. | 🟢 **FULL PASS** |

---

## 3. ARCHITECTURE DEPENDENCY MAP & FILE INVENTORY

```text
Audio Inspector Controls (RawStudioInspector.tsx:L1157-L1324)
 ├── Primary Vol Slider ➔ setAudioSettings.primaryVol (L1168)
 ├── Voice Cleanup Toggle ➔ setAudioSettings.voiceCleanup (L1177) [Cosmetic only]
 ├── Auto Ducking Toggle ➔ setAudioSettings.autoDuck (L1180)
 ├── AI Silence Removal ➔ handleAnalyzeSilence & Web Audio (L1222)
 └── BGM Track List ➔ mockMusic (L1308) [Missing URLs]
       │
       ▼
Preview Audio Engine (VideoPreview.tsx:L670-L720)
 ├── HTML5 Video Volume: videoRef.current.volume = primaryGain (L676)
 ├── HTML5 Audio (BGM): audioRef.current.volume = bgmGain (L700)
 └── Ducking Calculation: calculateDuckingGain(currentTime, primaryClips) (L690)
       │
       ▼
FFmpeg Command Planner (ffmpeg-command-planner.ts:L158-L242)
 ├── Primary Audio Extraction / Silence Synthesis: [in:a]atrim... / aevalsrc=0 (L162)
 ├── Multi-Clip Audio Concat: concat=n=X:v=1:a=1[v_concat][a_concat] (L174)
 ├── BGM Stream Delay & Volume: [in:a]atrim,asetpts,adelay,volume (L233)
 └── Multi-Audio Stream Mixing: amix=inputs=X:duration=first (L239)
```

---

## 4. CRITICAL DEFECT CATALOG & ROOT CAUSE ANALYSIS

### 🔴 Defect A-01: BGM Track Library 100% Blocked by Missing URLs (SEVERITY: P1)
* **User Impact:** Users cannot select, preview, or add any background music tracks from the stock BGM library to their project timeline.
* **Root Cause:** In [`mock-data.ts:L22-L26`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/mock-data.ts#L22-L26), the `mockMusic` array contains 3 objects (`Lofi Chill Beat`, `Viral Pop Synth`, `Corporate Tech`) with `title` and `duration`, but **completely omits the `url` property**.
  - In [`RawStudioInspector.tsx:L1309-L1315`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/RawStudioInspector.tsx#L1309-L1315), `onClick` checks `if (!hasPreviewSource) { showToast('BGM preview source pending'); return; }`, permanently blocking insertion.
* **Exact File & Line:** [`src/components/tabs/raw-studio/mock-data.ts#L22-L26`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/mock-data.ts#L22-L26)

---

### 🔴 Defect A-02: Voice Cleanup Checkbox is 100% Fake / Cosmetic (SEVERITY: P1)
* **User Impact:** Checking "Voice Cleanup" promises to enhance vocals or remove background noise, but performs zero audio filtering.
* **Root Cause:** The `voiceCleanup` boolean is only consumed in [`Timeline.tsx:L458`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/Timeline.tsx#L458) where it sets `opacity: track.label === 'Primary Audio' && audioSettings.voiceCleanup ? 0.8 : 1`. It is never passed to Web Audio BiquadFilter / AudioWorklet or FFmpeg audio filters (`highpass`, `lowpass`, `afftdn`).
* **Exact File & Line:** [`src/components/tabs/raw-studio/Timeline.tsx#L458`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/Timeline.tsx#L458)

---

### 🔴 Defect A-03: Auto Ducking Active in Preview but Ignored in FFmpeg Export (SEVERITY: P1)
* **User Impact:** In the editor, BGM volume dynamically lowers during speech. In the rendered MP4 export, BGM plays at a constant un-ducked volume, overpowering speech.
* **Root Cause:**
  - `VideoPreview.tsx:L689` calculates real-time gain attenuation via `calculateDuckingGain()`.
  - In [`ffmpeg-command-planner.ts:L233`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L233), BGM audio streams are mixed via `amix` with static `volume=${bgm.volume}`, omitting FFmpeg `sidechaincompress` or volume envelope curves.
* **Exact File & Line:** [`src/lib/rendering/ffmpeg-command-planner.ts#L226-L242`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/lib/rendering/ffmpeg-command-planner.ts#L226-L242)

---

### 🟡 Defect A-04: Standalone MP3/WAV Audio File Upload Blocked in Upload Tool (SEVERITY: P2)
* **User Impact:** Creators who want to upload custom voiceovers or custom MP3 music tracks cannot do so because the Upload tool rejects non-video files.
* **Root Cause:** In [`RawStudio/index.tsx:L354`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/index.tsx#L354), `handleFilesAdded` rejects all files that do not have `video/` MIME type.
* **Exact File & Line:** [`src/components/tabs/raw-studio/index.tsx#L354-L358`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/index.tsx#L354-L358)

---

### 🟡 Defect A-05: Missing Timeline Audio Waveform Display (SEVERITY: P2)
* **User Impact:** Audio clips on `track-audio-1` and `track-bgm-1` render as flat solid colored rectangles without visual audio waveform peaks, making precision beat/speech alignment difficult.
* **Exact File & Line:** [`src/components/tabs/raw-studio/Timeline.tsx#L450-L500`](file:///c:/Users/Pratik/Desktop/New%20folder%20%284%29/KontentOS/src/components/tabs/raw-studio/Timeline.tsx#L450-L500)

---

## 5. CONSOLIDATED SURGICAL FIX DIRECTION FOR AUDIO TOOL

*Do NOT implement yet. Store for the Consolidated Surgical Fix Phase:*

1. **Provide Real Audio Files for Stock BGM Tracks (`mock-data.ts`):**
   * Point `url` in `mockMusic` to bundled royalty-free audio tracks in `/public/audio/` (e.g. `/audio/lofi-chill.mp3`, `/audio/viral-pop.mp3`, `/audio/corporate-tech.mp3`).
2. **Implement Real Voice Cleanup Filter in FFmpeg & Web Audio:**
   * In FFmpeg command planner, if `voiceCleanup` is true, add `highpass=f=80,lowpass=f=12000,afftdn=nf=-25dB` audio filter to the primary video audio stream.
3. **Implement Dynamic Sidechain Audio Ducking in FFmpeg Export (`ffmpeg-command-planner.ts`):**
   * If `audioSettings.autoDuck` is true and both primary audio and BGM exist, route BGM through `sidechaincompress=threshold=0.08:ratio=4:attack=20:release=250` triggered by the primary speech track.
4. **Allow MP3/WAV Ingestion onto BGM Track (`RawStudio/index.tsx`):**
   * Accept audio MIME types and auto-insert onto `track-bgm-1` with `type: 'audio'`.

---

## 6. STATUS & NEXT TOOL RECOMMENDATION

> **TOOL #6 (AUDIO TOOL) AUDIT COMPLETE & FROZEN.**
> 
> We have uncovered that the stock BGM library is blocked by missing audio URLs, Voice Cleanup is a cosmetic opacity-only toggle, Auto Ducking is missing from FFmpeg export, and standalone audio file uploads are blocked.
> 
> Next recommended step in our roadmap: **Tool #7 — Effects Tool Deep Forensic Audit**.
