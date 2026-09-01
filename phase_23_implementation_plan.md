# 🏛️ Phase 23 Implementation Plan: Generative Media Intelligence & Asset Proposal Engine

## 1. Executive Summary & Vision

With **Phase 20 (Studio Hub Core)**, **Phase 21 (Smart Editing AI)**, and **Phase 22 (Autonomous Storyboarding)** certified and frozen, KontentOS now bridges the gap between text/storyboards and concrete media production.

**Phase 23** introduces **Generative Media Intelligence**, enabling creators to generate:
1. **AI Voiceover (Text-to-Speech)** synchronized to narrative beats.
2. **Contextual Sound Effects (SFX)** matched to visual transition cues.
3. **Smart Background Music (BGM)** with automatic speech ducking.
4. **Contextual Visual & B-Roll Asset Proposals**.

---

## 2. Core Architectural Standard & Safety Invariant

> [!IMPORTANT]
> **Cardinal Safety Rule**: AI-generated media files MUST NEVER be inserted into the canonical timeline automatically.
> Generated media always enters an **Isolated Asset Proposal Sandbox** first, where creators can audition, regenerate, and select assets before an **Explicit 1-Click Atomic Reduction** commits them to the timeline with full `Ctrl+Z` Undo support.

```text
Prompt / Storyboard Beat Spoken Dialogue / SFX Cue
                      ↓
       Generative Media Engine (TTS / SFX / BGM)
                      ↓
          Isolated Asset Proposal Pool
       (Waveform Preview, Audio Audition, Metadata)
                      ↓
          Ghost Waveform Timeline Overlay
          (Translucent projection on track-audio-1)
                      ↓
             Creator Audition & Selection
                      ↓
          Explicit "Insert to Timeline" Click
                      ↓
       Atomic Timeline Transaction (APPLY_AUDIO_ASSETS)
                      ↓
             Single History Snapshot
          (Ctrl+Z Undo ← Baseline Restore)
```

---

## 3. Sub-Phase Roadmap

### 🎬 Phase 23A — Generative Audio Engine & Provider Abstraction
- **TTS Provider Abstraction**:
  - `BaseTtsProvider` interface (`synthesizeSpeech(text, voiceParams): Promise<GeneratedAudioResult>`).
  - `LocalWebSpeechProvider` (zero-latency, in-browser synthetic speech).
  - `DeterministicWavSynthesizer` (offline beep/tone/synthetic PCM generator for unit testing & CI).
  - Extensible cloud adapters (`ElevenLabsProvider`, `OpenAiTtsProvider`) with fallback to local synthesizer.
- **SFX Engine**:
  - Semantic sound library matching storyboard cues (`whoosh`, `impact`, `glitch`, `sub_drop`, `riser`, `bell`, `notification`).
  - Procedural sound effect synthesizer (Web Audio API oscillator + filter curves).
- **Smart BGM Engine**:
  - Harmonic loop composer / mood-based background audio generator (Energetic, Cinematic, Corporate, Chill, Dramatic).
  - BPM and duration synchronization.
- **Storage & Caching Strategy**:
  - Local caching in `/temp/kontentos-audio-cache/` and browser `IndexedDB`/`BlobUrl` registry.

---

### 🎛️ Phase 23B — Generative Asset Proposal Deck & Ghost Waveform Preview
- **Generative Media Deck UI** (Mounted on tool rail with `Volume2` / `Music` icon):
  - **Voiceover Studio Tab**: Voice style selector (Natural, Punchy, Calm, Dramatic, Fast), pitch/speed sliders, beat-by-beat voice preview.
  - **SFX Deck Tab**: Cue timeline visualizer, sound audition player with volume slider.
  - **BGM Selector Tab**: Mood selector, target volume slider, ducking sensitivity controller.
- **Ghost Waveform Timeline Overlay**:
  - Projects translucent dashed waveform bars on `track-audio-1`.
  - Zero canonical mutations to `editState.items`.
  - Interactive click-to-audition and scrub playhead.

---

### ⚡ Phase 23C — Atomic Asset Assembler & Audio Ducking Reducer Engine
- **Audio Asset Compiler** (`audio-compiler.ts`):
  - Pure transformation function compiling approved voiceover, SFX, and BGM items into canonical `TimelineItem` definitions on `track-audio-1`.
  - Calculates automatic audio ducking curves (lowering BGM volume by -14dB whenever voiceover or spoken dialogue is active).
- **Atomic Reducer Action (`APPLY_AUDIO_ASSETS`)**:
  - Dispatches assembled audio tracks in a single atomic transaction.
  - Updates composition duration if audio exceeds current video length.
  - Captures 1 single history state in `historyReducer`.
  - Full single-step `Ctrl+Z` Undo and `Ctrl+Y` Redo restoration.

---

### 🔒 Phase 23D — Master Independent HAT Audit & Phase Freeze
- 15-Pillar End-to-End Master HAT Audit.
- Real voiceover generation and waveform rendering.
- Physical FFmpeg composite export with mixed audio streams and ducking verification.
- Phase 20, 21, and 22 backward regression pass.
- Clean TypeScript compilation (`tsc --noEmit`).
- Official Phase 23 Freeze.

---

## 4. User Review & Approval Required

> [!IMPORTANT]
> Please review the architectural principles and sub-phase breakdown above.
> If this architecture meets your standards, approve this plan so we can commence **Phase 23A: Generative Audio Engine & Provider Abstraction**.
