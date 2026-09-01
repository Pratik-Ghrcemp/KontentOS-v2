/**
 * Phase 21A: AI Proposal & Analysis Type Definitions
 * 
 * Strict separation of concerns: AiProposal types are completely isolated
 * from canonical timeline items to ensure zero automatic or unapproved mutations.
 */

export type AiProposalKind = 'hook' | 'cut' | 'zoom' | 'headline' | 'pacing';
export type AiProposalStatus = 'proposed' | 'validated' | 'rejected';
export type AiProposalSource = 'gemini' | 'openai' | 'azure-openai' | 'ollama' | 'heuristic' | 'anthropic' | 'mock';

export interface AiProposalData {
  text?: string;
  scale?: number;
  color?: string;
  stylePreset?: string;
  ripple?: boolean;
  suggestedHeadline?: string;
}

export interface AiProposal {
  id: string;
  kind: AiProposalKind;
  title: string;
  startTime: number;
  endTime: number;
  confidence: number; // Normalized strictly between 0 and 100
  reasoning: string;
  source: AiProposalSource;
  status: AiProposalStatus;
  targetTrackId?: string;
  sourceEvidence?: string;
  data?: AiProposalData;
  validationWarnings?: string[];
}

export interface AiTranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface AiAnalysisRequest {
  transcript: AiTranscriptSegment[];
  projectDuration: number;
  availableTrackIds?: string[];
  task?: 'analyze' | 'hooks' | 'pacing' | 'editing_suggestions';
  preferredProvider?: 'gemini' | 'ollama' | 'heuristic' | 'openai' | 'azure-openai';
  model?: string;
}

export interface AiDiagnosticsSummary {
  providerSelected: string;
  providerAvailable: boolean;
  fallbackActivated: boolean;
  totalGeneratedCount: number;
  validatedCount: number;
  rejectedCount: number;
  rejectionReasons: string[];
  latencyMs: number;
}

export interface AiAnalysisResult {
  success: boolean;
  provider: string;
  model?: string;
  proposals: AiProposal[];
  diagnostics: AiDiagnosticsSummary;
  error?: string;
}

export interface OllamaStatus {
  available: boolean;
  provider: 'ollama';
  baseUrl: string;
  models: string[];
  selectedModel?: string | null;
  error?: string;
}
