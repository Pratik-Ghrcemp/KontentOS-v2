# 🧭 KontentOS Architecture & Review Dossier for Claude

**Project**: KontentOS (AI-Powered Creator Operating System)  
**Primary Anchor Engine**: Studio Hub (Non-Destructive AI Video Creation & DAW Engine)  
**Corpus / Context**: Complete Codebase & Architectural Dossier  
**Certified Version**: Phase 25G (Production Demo Frozen)  

---

## 📌 1. What is KontentOS? (The High-Level Concept)

**KontentOS** is an end-to-end **AI-Powered Operating System for Digital Creators and Content Teams**.
Rather than being a loose collection of standalone tools, KontentOS unifies the entire creator lifecycle into a cohesive feedback loop:

```text
               ┌────────────────────────────────────────────────────────┐
               │              KONTENTOS CREATOR ECOSYSTEM               │
               └────────────────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     ▼                      ▼                      ▼
           1. CREATOR BRAIN         2. IDEA STUDIO        3. STUDIO HUB
           (DNA & Voice Print)    (Generative Scripts)    (HERO Production)
                     │                      │                      │
                     ▼                      ▼                      ▼
           4. PUBLISHING DECK       5. CONTENT CALENDAR   6. GROWTH & CRM
           (Multi-Platform)       (Scheduling Matrix)    (Audience & Rev)
```

---

## 🎬 2. The Hero Module: Studio Hub (`src/components/tabs/raw-studio/`)

The core intelligence and technical crown jewel of KontentOS is **Studio Hub**.

### Key Architectural Invariants:
1. **Non-Destructive AI Collaboration Model**:
   - Upstream AI models (Gemini / OpenAI / Ollama / Mock) produce `AiProposal` objects.
   - Proposals are placed into an isolated **Proposal Sandbox**.
   - They render as dashed **Ghost Timeline Overlays** on the multi-track timeline.
   - The canonical timeline (`editState.items`) is **NEVER** modified until explicit creator approval.

2. **Atomic Reducer Transactions & 1-Step Undo/Redo**:
   - Applying a batch of 5 AI enhancements commits in a single reducer action (`APPLY_AI_SUGGESTIONS`).
   - A single `Ctrl+Z` reverts the entire batch to the exact pre-application state.

3. **Multi-Track Non-Linear Video Architecture**:
   - Sub-frame playhead scrubbing, split (`S`), trim, snap-to-grid, transitions, multi-clip group selection and dragging.
   - Multi-layer support: Video tracks, overlay kinetic cards, caption layers, background music (BGM), sound effects (SFX), and freehand drawing vectors (0–1000 coordinate space).

4. **Real-Time WebAudio DSP & Audio Ducking**:
   - 3-band parametric voice EQ: 80Hz Highpass + 3kHz Peaking + Dynamics Compressor.
   - Auto-ducking reduces BGM volume by $-14\text{dB}$ when speech timestamps are active.

5. **Physical FFmpeg Rendering Engine**:
   - Spawns local FFmpeg binaries (`local-ffmpeg-worker.ts`) to compile multi-layer video, burned kinetic captions, and audio ducking into physical `2.1MB` MP4 files.

6. **Unified Multi-Provider AI Gateway & Observability**:
   - Fallback Chain: **Google Gemini 1.5 Flash (Primary)** $\to$ **OpenAI / Azure** $\to$ **Ollama (Local LLM)** $\to$ **Deterministic Mock Engine**.
   - Real-time in-browser observability drawer showing active provider, latency, and explicit fallback telemetry (`AI: GEMINI LIVE` vs `AI: MOCK FALLBACK`).

---

## 🌐 3. The Surrounding Ecosystem Modules

| Module | Navigation Route | Architectural Responsibility | Connectivity to Studio Hub |
|---|---|---|---|
| **Intelligence Dashboard** | `dashboard` | Executive KPI overview, viral velocity score, pending queue, and AI insights. | Ingests latest render performance and triggers new project drafts. |
| **Studio Hub** | `movie_edit` | Flagship non-linear video DAW, AI proposal sandbox, and FFmpeg export engine. | **The Hero Production Hub**. |
| **Growth Intelligence** | `trending_up` | Hook retention analytics, audience drop-off curves, platform distribution metrics. | Feeds retention patterns into Studio Hub's AI hook scoring algorithms. |
| **Content Calendar** | `calendar_month` | Matrix schedule, drag-and-drop publishing timeline, multi-platform release slots. | Directly receives finished packages from Studio Hub's Publishing Deck. |
| **Monetization Hub** | `payments` | Sponsorship tracker, affiliate revenue attribution, brand deal pipeline. | Tracks ROI on exported and published content assets. |
| **Audience CRM** | `group` | Superfan tiering, comment sentiment analysis, community engagement scoring. | Identifies high-converting viewer segments for content targeting. |
| **Media Kit** | `badge` | Dynamic live rate card, creator statistics, brand sponsorship deck generator. | Aggregates verified metrics from Growth Intelligence. |
| **Creator Brain** | `psychology` | Creator DNA profile, tone-of-voice embeddings, brand safety rules. | Injects Creator DNA system prompts into the Unified AI Gateway. |
| **User Settings** | `settings` | Provider API keys (Gemini, OpenAI), cloud storage credentials, render defaults. | Configures runtime environment for AI Gateway and database. |

---

## 🧪 4. What Has Been Completed & Certified (Phases 20–25G)

- **Phase 20–24**: Timeline engine, geometry, WebAudio DSP, local Whisper transcription, Alex Hormozi caption styling, Freehand drawing canvas.
- **Phase 25A**: Cross-platform package generator (Instagram Reels, TikTok, YouTube Shorts, LinkedIn, X).
- **Phase 25B**: Live device preview decks with character/hashtag constraint checking.
- **Phase 25C**: Cross-system ecosystem bridges (Idea $\to$ Studio $\to$ Render $\to$ Calendar $\to$ Analytics).
- **Phase 25D**: Unified Multi-Provider AI Gateway (Gemini, OpenAI, Ollama, Deterministic Mock).
- **Phase 25E**: Truth audit & Physical FFmpeg render certification (`14/14 Checks 100% Passed`).
- **Phase 25F**: 1-Click Showcase Demo Reel (`<500ms` load), AI Observability Drawer, Help Center Architecture Modal.
- **Phase 25G**: AI Suggestion Explainability drawers, reload persistence safety, Master Demo Readiness Audit (`10/10 Gates 100% Green`).

---

## 🔍 5. Current Gaps & Suggested Future Directions for Claude Review

1. **Phase 26 (Performance Intelligence Loop)**:
   - Closing the loop between post-publishing metrics (retention drop-offs) and AI Storyboard generation.
2. **Cloud Serverless Rendering**:
   - Adding a remote AWS Lambda / GPU FFmpeg rendering backend for heavy 4K exports in addition to the local Node worker.
3. **Direct OAuth Platform Publishing**:
   - Moving from sandboxed publishing packages to direct Instagram/YouTube Graph API token authorization.

---

## 🚀 How to Run & Test
```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript Typecheck
npm run typecheck

# 3. Run Physical FFmpeg Render & Truth Audit
npm run test:phase-25e

# 4. Run 10-Gate Master Demo Readiness Audit
npm run test:demo-readiness

# 5. Start Development Server
npm run dev
# Open http://localhost:3000
```
