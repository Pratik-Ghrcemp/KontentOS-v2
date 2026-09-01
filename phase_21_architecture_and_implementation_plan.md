# PHASE 21 — SMART CREATOR INTELLIGENCE
## Refined Architecture, State Boundaries & Locked Implementation Plan

**Phase:** Phase 21 (Smart Creator Intelligence)  
**Status:** **SCOPE LOCKED — READY FOR IMPLEMENTATION**  
**Version:** 2.0.0-LOCKED  
**Author:** AntiGravity Architecture Engine  
**Prerequisite:** Phase 20 (Approved, Certified & Frozen)

---

## 🎯 EXECUTIVE SUMMARY & CORE PRINCIPLE

Phase 21 introduces **Smart Creator Intelligence** to Studio Hub with an immutable safety contract:

> 🛡️ **The Cardinal Safety Contract:**  
> **AI Must NEVER directly mutate canonical timeline state without explicit creator review and approval.**  
> 
> $$\text{CanonicalTimelineState (Read-Only)} \longrightarrow \text{AI Analysis Engine} \longrightarrow \text{AIProposalState (Ephemeral)}$$
> $$\longrightarrow \text{GhostPreviewRenderer} \longrightarrow \text{Creator Approval} \longrightarrow \text{compileApprovedProposal()} \longrightarrow \text{Atomic Mutation (historyReducer)}$$

---

## SECTION 1 — FINAL PHASE 21 SCOPE LOCK

### 1.1 In-Scope Capabilities (Locked for Phase 21)

| Sub-Phase | Core Deliverables | Classification |
| :--- | :--- | :---: |
| **Phase 21A** | **AI Infrastructure & Provider Core**<br>• Unified AI Provider Abstraction (`openai`, `azure`, `anthropic`, `local_ollama`, `mock`)<br>• Local Ollama REST client (`http://localhost:11434`) + Diagnostic API (`GET /api/ai/ollama/status`)<br>• Strict AI JSON validation pipeline & untrusted output sanitizer<br>• Deterministic heuristic fallback rules engine (100% offline & zero LLM failure risk) | **MUST HAVE** |
| **Phase 21B** | **AI Hook Intelligence Engine**<br>• Whisper transcript density & curiosity heuristic analyzer<br>• Structured hook proposal model (Start/End timestamps, reasoning, confidence score 0–100)<br>• Hook preview card UI in Studio Hub Inspector (Read-only, zero direct mutation) | **MUST HAVE** |
| **Phase 21C** | **AI Editing Suggestions & Ghost Preview Layer**<br>• Pacing, cutaway, kinetic zoom, and headline overlay suggestion generator<br>• Independent `AIProposalState` completely separated from canonical `EditState`<br>• Non-destructive `GhostPreviewRenderer` (amber translucent overlays on timeline and canvas)<br>• Interactive Creator Selection & Approval Modal<br>• `compileApprovedProposal()` atomic dispatcher into `historyReducer`<br>• Seamless single-step `Ctrl+Z` Undo / `Ctrl+Y` Redo | **MUST HAVE** |

---

### 1.2 Explicit Future Phase Backlog (Out of Scope for Phase 21)

The following items are **explicitly deferred** to prevent scope creep and maintain absolute stability:

* ❌ **Script-to-Video Timeline Generation** $\longrightarrow$ *Deferred to Phase 22 (Autonomous Storyboarding)*
* ❌ **Autonomous AI Agent Workflows (Unattended Editing)** $\longrightarrow$ *Deferred to Phase 22*
* ❌ **AI Voice / TTS Generation & Lip-Sync** $\longrightarrow$ *Deferred to Phase 23 (Audio Studio)*
* ❌ **Generative Video Backgrounds (Runway/Sora)** $\longrightarrow$ *Deferred to Phase 23*
* ❌ **Direct Social Media Auto-Publishing** $\longrightarrow$ *Deferred to Phase 24 (Distribution)*

---

## SECTION 2 — CANONICAL VS PROPOSAL STATE BOUNDARY

To prevent state corruption, ghost item leakage, and UI re-render thrashing, **canonical timeline state is strictly decoupled from AI proposal state**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CANONICAL TIMELINE STATE                           │
│                      (Managed by historyReducer)                            │
│                                                                             │
│   editState: EditState {                                                    │
│     tracks: Track[];                                                        │
│     items: TimelineItem[];   <── Ground truth active clips                  │
│     selection: string[];                                                    │
│     duration: number;                                                       │
│   }                                                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (READ-ONLY INPUT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI PROPOSAL STATE (EPHEMERAL)                        │
│                    (Isolated from historyReducer)                           │
│                                                                             │
│   aiProposalState: AiProposalStore {                                        │
│     proposals: AiProposal[];                                                │
│     selectedProposalIds: string[];                                          │
│     activePreviewId: string | null;                                         │
│     isAnalyzing: boolean;                                                   │
│     analysisMetrics: PacingMetrics | null;                                  │
│   }                                                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GHOST PREVIEW RENDERER                              │
│  • Renders proposed cuts/zooms as amber dashed overlays on Canvas & Timeline│
│  • items[] is NEVER touched during preview                                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Upon Explicit User Click "Apply Selected")
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       compileApprovedProposal()                             │
│  • Validates bounds & resolves timeline conflicts                           │
│  • Emits single atomic action: dispatch({ type: 'APPLY_AI_SUGGESTIONS' })   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ATOMIC HISTORY TRANSACTION                            │
│  • historyReducer records exactly ONE snapshot in past[]                    │
│  • Pressing Ctrl+Z instantly rolls back all applied AI edits in 1 step      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 3 — UNTRUSTED AI OUTPUT VALIDATION PIPELINE

AI outputs (whether from Local Ollama, Cloud LLM, or Heuristics) are treated as **untrusted data**. Every payload passes through a strict 6-stage validation pipeline before reaching the proposal state:

```
[Raw LLM JSON String]
         │
         ▼ (Stage 1: Strict JSON Schema Parser)
[Parsed Object or Schema Error]
         │
         ▼ (Stage 2: Timestamp Sanity & Range Inversion Guard)
  • Check: startTime >= 0
  • Check: endTime > startTime
  • Check: (endTime - startTime) >= 0.2s (Minimum sensible cut/zoom duration)
  • Check: endTime <= projectDuration
         │
         ▼ (Stage 3: Boundary & Target Track Collision Check)
  • Check: Target track exists and is unlocked
  • Check: Source media asset ID matches genuine ingested assets
         │
         ▼ (Stage 4: Destructive Overlap Check)
  • Check: Two proposed deletions do not overlap the same sub-interval
         │
         ▼ (Stage 5: Confidence & Hallucination Sanitizer)
  • Clamp confidence to [0, 100]
  • Strip invalid HTML / script tags from explanation strings
         │
         ▼ (Stage 6: Normalized Output)
[Validated AiProposal[] ready for UI Proposal Layer]
```

---

## SECTION 4 — PROPOSAL OPERATION SCHEMA & DATA MODEL

```typescript
// Proposed src/lib/ai/suggestions-types.ts

export type AiProposalType = 'hook' | 'silence_cut' | 'filler_cut' | 'punch_zoom' | 'headline_overlay' | 'broll_gap';

export interface TimelineOperation {
  op: 'insert_item' | 'delete_range' | 'split_clip' | 'apply_effect' | 'add_overlay';
  trackId: string;
  targetItemId?: string;
  timeRange: { start: number; end: number };
  data?: {
    text?: string;
    scale?: number;
    color?: string;
    stylePreset?: string;
    ripple?: boolean;
  };
}

export interface AiProposal {
  id: string;
  type: AiProposalType;
  title: string;
  reasoning: string;
  sourceEvidence: string; // e.g. "Spoken phrase: 'it saves hours of work'"
  confidence: number; // 0 to 100
  timeRange: { start: number; end: number };
  operations: TimelineOperation[];
  isValidated: boolean;
  validationWarnings?: string[];
}

export interface AiProposalState {
  proposals: AiProposal[];
  selectedIds: Set<string>;
  previewingId: string | null;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  errorMessage?: string;
  lastAnalysisTimestamp?: string;
}
```

---

## SECTION 5 — PROPOSAL CONFLICT RESOLUTION

When a creator selects multiple proposals simultaneously, the `compileApprovedProposal()` compiler resolves potential structural conflicts using deterministic rules:

1. **Overlapping Cut Deduplication:** If Proposal A cuts `[2.0s - 3.5s]` and Proposal B cuts `[3.0s - 4.5s]`, the compiler merges them into a unified cut interval `[2.0s - 4.5s]`.
2. **Zoom on Deleted Clip Guard:** If a zoom proposal falls inside a time range selected for ripple deletion, the zoom proposal is automatically pruned with a helpful creator notification.
3. **Ripple Order Sorting:** All deletions are sorted in **descending chronological order** (from end of timeline to beginning) so earlier clip indices and timestamps remain stable during ripple operations.

---

## SECTION 6 — ATOMIC APPLY & CANCELLATION CONTRACTS

### 6.1 Atomic Apply Contract
```typescript
// Added to src/lib/editing/engine.ts
case 'APPLY_AI_SUGGESTIONS': {
  const { operations } = action.payload;
  let nextState = { ...state };

  // Execute all operations in a single synchronous pass
  for (const op of operations) {
    nextState = executeAtomicOperation(nextState, op);
  }

  return {
    ...nextState,
    duration: recalculateDuration(nextState.items)
  };
}
```
* **Atomicity:** Results in exactly **one** entry on the `historyState.past` stack.
* **Undo:** Pressing `Ctrl+Z` reverts all applied proposals instantly in 1 step.
* **Redo:** Pressing `Ctrl+Y` re-applies the full proposal batch cleanly.

### 6.2 Cancellation Contract
* Long-running AI operations utilize standard `AbortController` signals.
* Clicking `"Cancel"` in the UI triggers `abortController.abort()`, releasing HTTP connections to Ollama/Cloud without locking the browser thread.
* Partial/aborted AI responses are discarded; the UI returns to the clean `idle` state immediately.

---

## SECTION 7 — LOCAL OLLAMA INTEGRATION & FAILURE FALLBACKS

```
                       [AI Suggestion Request]
                                  │
                                  ▼
                ┌───────────────────────────────────┐
                │ Check Local Ollama Status         │
                │ (GET /api/ai/ollama/status)       │
                └─────────────────┬─────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
                 ▼ (If Ollama Available)           ▼ (If Ollama Offline / 404 / Error)
     ┌───────────────────────┐         ┌─────────────────────────────────┐
     │ Invoke Local LLM      │         │ Invoke Deterministic Heuristic  │
     │ (Llama 3 / Mistral)   │         │ Rules Engine (100% Offline)     │
     └───────────┬───────────┘         └────────────────┬────────────────┘
                 │                                      │
                 └──────────────────┬───────────────────┘
                                    │
                                    ▼
                     [Sanitize & Validate Schema]
                                    │
                                    ▼
                     [Render in AIProposalState]
```

### Deterministic Heuristic Fallback Specifications
If Ollama is not installed or unreachable, the heuristic engine generates guaranteed valid proposals using:
1. **Hook Heuristic:** Identifies speech segments with highest lexical density, questions (`?`), or superlative terms (*"best"*, *"secret"*, *"saves"*).
2. **Pacing Heuristic:** Identifies uninterrupted monologue intervals exceeding 5.0 seconds to propose kinetic zooms and lower-third headline anchors.
3. **Zero Failure Mode:** Creators are never blocked with a broken modal or crash if Ollama is absent.

---

## SECTION 8 — SUB-PHASE IMPLEMENTATION BREAKDOWN

### 🟢 Phase 21A — AI Infrastructure & Provider Core
* **Tasks:**
  1. Create `src/lib/ai/ollama-client.ts` with model discovery and structured JSON completion helpers.
  2. Implement diagnostic route `GET /api/ai/ollama/status` returning installation and health state.
  3. Create `src/lib/ai/validation-pipeline.ts` with strict schema validation and range sanity checks.
  4. Create `src/lib/ai/heuristic-fallback.ts` with deterministic rule-based suggestions.
* **Deliverable:** Fully audited AI infrastructure passing unit tests with mock and live Ollama endpoints.

---

### 🟢 Phase 21B — AI Hook Generator
* **Tasks:**
  1. Create `src/lib/ai/hook-generator.ts` accepting real Whisper transcripts and extracting top 3 viral teasers.
  2. Implement route `POST /api/ai/generate-hooks`.
  3. Build `HookInspectorCard.tsx` inside Studio Hub's Inspector panel with playhead seek, confidence pill, and rationale display.
* **Deliverable:** Creators can upload media, generate real Whisper captions, and view 3 verified hook recommendations.

---

### 🟢 Phase 21C — AI Editing Suggestions & Ghost Preview
* **Tasks:**
  1. Create `src/lib/ai/suggestions-engine.ts` generating zoom, pacing, and overlay proposals.
  2. Create `src/components/tabs/raw-studio/GhostTimelineOverlay.tsx` rendering non-destructive ghost proposals.
  3. Implement `compileApprovedProposal()` in `src/lib/editing/proposal-compiler.ts`.
  4. Register `APPLY_AI_SUGGESTIONS` action in `src/lib/editing/engine.ts`.
  5. Add `AiIntelligencePanel.tsx` to Studio Hub tool rail (`Sparkles` icon).
* **Deliverable:** Full end-to-end flow: Ingest $\to$ Whisper $\to$ Suggestions $\to$ Ghost Preview $\to$ Creator Selects $\to$ Creator Approves $\to$ Atomic Mutation $\to$ `Ctrl+Z` Undo $\to$ Production FFmpeg Export.

---

## SECTION 9 — TEST SUITE & HAT ACCEPTANCE CRITERIA

| Test Gate | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- |
| **Gate 1: Provider & Ollama Diagnostic** | Automated API Integration Test | `/api/ai/ollama/status` returns structured health state; offline fallback executes cleanly. |
| **Gate 2: Untrusted Output Sanitization** | Pure Unit Test Suite | Malformed timestamps, inverted ranges, and script injections are caught and discarded. |
| **Gate 3: AI Hook Extraction** | Real Spoken Video Fixture | `test_spoken_video.mp4` Whisper transcript generates valid hook proposals with confidence $\ge 80\%$. |
| **Gate 4: Non-Destructive Ghost Previews** | Playwright Browser Automation | Ghost elements render with amber borders; `editState.items` length remains unchanged before approval. |
| **Gate 5: Atomic Undo/Redo Integrity** | Playwright E2E Transaction Test | Approving 3 proposals mutates timeline; pressing `Ctrl+Z` restores exact pre-AI state in 1 frame. |
| **Gate 6: Physical FFmpeg Export Parity** | FFprobe Physical Inspection | Exported MP4 reflects approved AI cuts and visual overlays; file is valid and playable. |
| **Gate 7: Frozen Phase 20 Regression** | Master Playwright Regression Suite | Zero regression against frozen Smart Cut, Captions, and Export suites. |

---

## 🔒 PHASE 21 SCOPE LOCK STATUS

# 🟢 READY FOR IMPLEMENTATION

* **Scope Boundaries:** Strictly locked (Script-to-Video and autonomous agents deferred to Phase 22+).
* **State Safety:** `CanonicalTimelineState` is 100% protected behind `AIProposalState` and `compileApprovedProposal()`.
* **Output Validation:** Comprehensive 6-stage validation pipeline defined for all untrusted AI inputs.
* **Offline Resilience:** Guaranteed fallback via Local Ollama and Deterministic Heuristics.

*(Standing by for explicit user authorization to begin Wave 1 / Phase 21A implementation.)*
