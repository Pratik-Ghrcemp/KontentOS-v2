import { AiAnalysisRequest, AiAnalysisResult, AiDiagnosticsSummary, AiProposal } from './proposal-types';
import { getOllamaStatus, generateOllamaStructured } from './ollama-client';
import { generateHeuristicProposals } from './heuristic-fallback';
import { validateAiProposals } from './validation-pipeline';

export interface AIProviderStatus {
  available: boolean;
  provider: string;
  baseUrl?: string;
  models?: string[];
  selectedModel?: string | null;
  error?: string;
}

export interface AIProvider {
  name: string;
  status(): Promise<AIProviderStatus>;
  generateProposals(request: AiAnalysisRequest): Promise<{ proposals: any[]; rawResponse?: any; error?: string }>;
}

export class OllamaAiProvider implements AIProvider {
  name = 'ollama';

  async status() {
    const s = await getOllamaStatus(2000);
    return {
      available: s.available,
      provider: s.provider,
      baseUrl: s.baseUrl,
      models: s.models,
      selectedModel: s.selectedModel,
      error: s.error
    };
  }

  async generateProposals(request: AiAnalysisRequest) {
    const transcriptSummary = request.transcript.slice(0, 50).map(t => 
      `[${t.startTime.toFixed(2)}s - ${t.endTime.toFixed(2)}s]: "${t.text}"`
    ).join('\n');

    const prompt = `Analyze this video transcript (total duration: ${request.projectDuration.toFixed(2)}s) and generate structured editing proposals.
Transcript:
${transcriptSummary}

Generate a JSON object with a "proposals" array. Each proposal must follow this exact format:
{
  "id": "unique-string",
  "kind": "hook" | "cut" | "zoom" | "headline" | "pacing",
  "title": "short descriptive title",
  "startTime": number (in seconds),
  "endTime": number (in seconds),
  "confidence": number (between 0 and 100),
  "reasoning": "clear explanation of why this edit is recommended",
  "sourceEvidence": "quote from transcript",
  "source": "ollama"
}`;

    const res = await generateOllamaStructured<{ proposals: any[] }>(prompt, {
      model: request.model,
      temperature: 0.2,
      timeoutMs: 15000
    });

    if (!res.success || !res.data) {
      return { proposals: [], error: res.error || 'Ollama generation failed' };
    }

    const proposals = Array.isArray(res.data) ? res.data : (res.data.proposals || []);
    return { proposals, rawResponse: res.data };
  }
}

export class HeuristicAiProvider implements AIProvider {
  name = 'heuristic';

  async status() {
    return { available: true, provider: 'heuristic' };
  }

  async generateProposals(request: AiAnalysisRequest) {
    const proposals = generateHeuristicProposals(request);
    return { proposals };
  }
}

// Global registry of AI providers
const providers: Map<string, AIProvider> = new Map<string, AIProvider>();
providers.set('ollama', new OllamaAiProvider());
providers.set('heuristic', new HeuristicAiProvider());

export function registerAiProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getAiProvider(name: string): AIProvider | undefined {
  return providers.get(name);
}

/**
 * Master AI Dispatch Function
 * Automatically routes request to Ollama, and gracefully falls back to Heuristics if offline.
 */
export async function dispatchAiAnalysis(request: AiAnalysisRequest): Promise<AiAnalysisResult> {
  const startTime = Date.now();
  let providerToUse = request.preferredProvider || 'ollama';
  let fallbackActivated = false;
  let rawProposals: any[] = [];
  let providerError: string | undefined;

  const ollamaProvider = providers.get('ollama')!;
  const heuristicProvider = providers.get('heuristic')!;

  if (providerToUse === 'ollama') {
    const ollamaStatus = await ollamaProvider.status();
    if (ollamaStatus.available) {
      const ollamaRes = await ollamaProvider.generateProposals(request);
      if (ollamaRes.proposals && ollamaRes.proposals.length > 0) {
        rawProposals = ollamaRes.proposals;
      } else {
        fallbackActivated = true;
        providerError = ollamaRes.error || 'Ollama returned empty proposals. Activating deterministic fallback.';
      }
    } else {
      fallbackActivated = true;
      providerError = ollamaStatus.error || 'Ollama is offline. Activating deterministic fallback.';
    }
  }

  // Fallback activation
  if (fallbackActivated || providerToUse === 'heuristic' || rawProposals.length === 0) {
    const heuristicRes = await heuristicProvider.generateProposals(request);
    rawProposals = heuristicRes.proposals;
    providerToUse = 'heuristic';
  }

  // Pass all proposals through the strict validation pipeline
  const validationReport = validateAiProposals(rawProposals, {
    projectDuration: request.projectDuration,
    availableTrackIds: request.availableTrackIds
  });

  const latencyMs = Date.now() - startTime;
  const diagnostics: AiDiagnosticsSummary = {
    providerSelected: providerToUse,
    providerAvailable: true,
    fallbackActivated,
    totalGeneratedCount: rawProposals.length,
    validatedCount: validationReport.validatedProposals.length,
    rejectedCount: validationReport.rejectedProposals.length,
    rejectionReasons: validationReport.rejectedProposals.flatMap(r => r.reasons),
    latencyMs
  };

  return {
    success: validationReport.validatedProposals.length > 0,
    provider: providerToUse,
    proposals: validationReport.validatedProposals,
    diagnostics,
    error: providerError
  };
}
