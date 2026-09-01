import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { generateStructured, getAiGatewayStatus } from './gateway';
import { buildRenderRequestFromEditState } from '../rendering/builder';
import { buildRenderComposition } from '../rendering/composition-builder';
import { runLocalFfmpegRender, checkLocalFfmpegAvailable } from '../rendering/workers/local-ffmpeg-worker';
import { initialEditState } from '../editing/engine';
import { generateDeterministicStoryboard } from './storyboard-engine';
import { compileApprovedStoryboard } from '../editing/storyboard-compiler';
import { createProceduralVisualProposal } from './visual/procedural-visual-engine';
import { compileApprovedVisualAssets } from '../editing/visual-compiler';
import { generateTtsAudio } from './audio/tts-engine';
import { generatePlatformPackages } from '../publishing/packager';
import { buildPublishingQueueRecord } from '../data/publishing-queue-service';
import { buildRenderCompletionAuditReport } from '../data/render-completion-service';

export interface Phase25ECheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'skip';
  details: string;
}

export interface Phase25EReport {
  phase: '25E';
  passed: boolean;
  checks: Phase25ECheck[];
}

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    process.env[key] = value;
  }
}

function withEnv<T>(updates: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(updates)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return fn().finally(() => {
    previous.forEach((value, key) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });
}

function addCheck(checks: Phase25ECheck[], id: string, label: string, pass: boolean, details: string, skip = false) {
  checks.push({
    id,
    label,
    status: skip ? 'skip' : pass ? 'pass' : 'fail',
    details
  });
}

function assertFsContains(filePath: string, needle: string): boolean {
  return fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8').includes(needle);
}

export async function runPhase25ETruthAudit(): Promise<Phase25EReport> {
  loadLocalEnv();

  const checks: Phase25ECheck[] = [];
  const liveGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
  const liveFfmpeg = await checkLocalFfmpegAvailable();

  const gateway = await getAiGatewayStatus();
  const routeChecks = Object.entries(gateway.routes);
  addCheck(
    checks,
    'ai-gateway-route-map',
    'AI gateway route map',
    routeChecks.length > 0 && routeChecks.every(([, providers]) => providers[0] === 'gemini' && providers[providers.length - 1] === 'mock'),
    `Configured provider: ${gateway.configuredProvider}; routes: ${routeChecks.length}`
  );

  addCheck(
    checks,
    'ai-gateway-mock-indicator',
    'Explicit mock indicator',
    gateway.providers.some(p => p.provider === 'mock' && p.available),
    gateway.providers.find(p => p.provider === 'mock')?.error || 'Mock provider is available as the explicit fallback'
  );

  const mockModeResult = await withEnv({ AI_PROVIDER: 'mock' }, async () => {
    return generateStructured({
      capability: 'idea_generation',
      prompt: '{"idea":"phase 25e"}',
      schemaName: 'mock_truth_audit',
      timeoutMs: 3000
    });
  });

  addCheck(
    checks,
    'mock-fallback-visible',
    'Mock fallback stays visible',
    mockModeResult.provider === 'mock' && mockModeResult.degraded === true && mockModeResult.fallbackUsed === true,
    `provider=${mockModeResult.provider}, degraded=${mockModeResult.degraded}, fallbackUsed=${mockModeResult.fallbackUsed}`
  );

  if (liveGeminiKey) {
    const realGeminiResult = await withEnv({ AI_PROVIDER: 'gemini' }, async () => {
      return generateStructured<{ answer: string }>({
        capability: 'idea_generation',
        prompt: '{"answer":"return valid json"}',
        schemaName: 'gemini_truth_audit',
        timeoutMs: 12000,
        preferredProvider: 'gemini'
      });
    });

    addCheck(
      checks,
      'real-gemini-smoke',
      'Real Gemini smoke test',
      realGeminiResult.provider === 'gemini' && realGeminiResult.data !== null,
      realGeminiResult.error || 'Gemini returned a structured payload'
    );
  } else {
    addCheck(
      checks,
      'real-gemini-smoke',
      'Real Gemini smoke test',
      false,
      'Skipped because GEMINI_API_KEY / GOOGLE_GEMINI_API_KEY is not configured',
      true
    );
  }

  const failureLoggingResult = await withEnv(
    {
      AI_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'invalid-phase-25e-key',
      GOOGLE_GEMINI_API_KEY: '',
      OPENAI_API_KEY: '',
      AZURE_OPENAI_API_KEY: '',
      AZURE_OPENAI_ENDPOINT: '',
      OLLAMA_BASE_URL: 'http://127.0.0.1:65535'
    },
    async () => {
      return generateStructured({
        capability: 'script_generation',
        prompt: '{"script":"audit"}',
        schemaName: 'fallback_chain_audit',
        timeoutMs: 4000
      });
    }
  );

  addCheck(
    checks,
    'provider-failure-logging',
    'Provider failure logging',
    failureLoggingResult.provider === 'mock' && Boolean(failureLoggingResult.reason || failureLoggingResult.error),
    `provider=${failureLoggingResult.provider}; reason=${failureLoggingResult.reason || failureLoggingResult.error || 'none'}`
  );

  const rootChecks = [
    ['supabase-ai-events', 'supabase\\migrations\\20260828000007_ai_generation_events.sql', 'ai_generation_events'],
    ['supabase-audit-reports', 'supabase\\migrations\\20260828000000_initial_schema.sql', 'audit_reports'],
    ['supabase-projects', 'supabase\\migrations\\20260828000000_initial_schema.sql', 'projects'],
    ['supabase-publishing', 'supabase\\migrations\\20260828000008_data_flow_complete.sql', 'platform_preset']
  ] as const;

  for (const [id, relPath, needle] of rootChecks) {
    addCheck(
      checks,
      id,
      `Static contract: ${needle}`,
      assertFsContains(path.resolve(process.cwd(), relPath), needle),
      `${relPath} contains ${needle}`
    );
  }

  const storyboardPlan = generateDeterministicStoryboard({
    topic: 'Phase 25E truth audit',
    targetDuration: 6,
    tone: 'energetic',
    formatPreset: 'instagram-reels'
  });
  const selectedBeatIds = new Set(storyboardPlan.beats.map(beat => beat.id));
  const storyboardCompile = compileApprovedStoryboard(storyboardPlan, selectedBeatIds, [], { append: false });

  const visualProposal = createProceduralVisualProposal(
    'kinetic_title',
    'PHASE 25E',
    'Production truth audit',
    'corporate_clean',
    '9:16',
    3,
    storyboardPlan.beats[0]?.id,
    0
  );

  const visualState = {
    ...initialEditState,
    duration: storyboardCompile.totalDuration,
    items: [...storyboardCompile.newItems, ...compileApprovedVisualAssets([visualProposal], { ...initialEditState, duration: storyboardCompile.totalDuration }).newItems]
  };
  const auditProjectId = '11111111-1111-4111-8111-111111111111';

  const ttsAsset = await generateTtsAudio({
    text: 'Phase 25E truth audit confirmed the pipeline and fallback behavior.',
    wordsPerMinute: 150
  });
  addCheck(
    checks,
    'audio-sanity',
    'Local audio synthesis',
    ttsAsset.duration > 0 && ttsAsset.audioUrl.startsWith('data:audio/'),
    `Generated ${ttsAsset.duration.toFixed(2)}s synthetic voiceover`
  );

  const renderRequest = buildRenderRequestFromEditState(visualState as any, {
    mediaAssetId: path.resolve(process.cwd(), 'test_spoken_video.mp4'),
    platformPresetId: 'instagram-reels',
    quality: 'high',
    captionMode: 'burn',
    projectId: auditProjectId,
    projectTitle: 'Phase_25E_Truth_Audit',
    brandKit: { name: 'KontentOS', primaryFont: { family: 'Inter' } }
  });

  const composition = buildRenderComposition(renderRequest);
  const compositionValid = composition.timeline.duration > 0 && composition.timeline.layers.some(layer => layer.type === 'video');
  addCheck(
    checks,
    'render-composition',
    'Render composition bridge',
    compositionValid,
    `layers=${composition.timeline.layers.length}, duration=${composition.timeline.duration}`
  );

  if (liveFfmpeg) {
    const renderResult = await runLocalFfmpegRender(composition);
    addCheck(
      checks,
      'physical-render',
      'Physical FFmpeg render',
      renderResult.success === true && Boolean(renderResult.outputPath) && (renderResult.sizeBytes || 0) > 0,
      renderResult.success ? `output=${renderResult.outputPath}` : renderResult.error || 'Render failed'
    );

    if (renderResult.success) {
      const packages = await generatePlatformPackages({
        renderResult: {
          outputPath: renderResult.outputPath || '',
          durationSeconds: renderResult.durationSeconds || composition.timeline.duration,
          aspectRatio: '9:16'
        },
        storyboard: {
          title: storyboardPlan.title,
          beats: storyboardPlan.beats.map(beat => ({
            title: beat.title,
            voiceoverLine: beat.spokenText,
            visualDirective: beat.visualIntent
          }))
        },
        transcript: storyboardPlan.beats.map(beat => beat.spokenText).join(' '),
        targetPlatforms: ['youtube_shorts', 'instagram_reels', 'tiktok', 'linkedin', 'twitter_x'],
        creatorProfile: {
          brandTone: 'professional',
          creatorName: 'KontentOS',
          handle: '@kontentos',
          niche: 'Creator OS'
        }
      });

      const queueRecord = buildPublishingQueueRecord({
        userId: 'audit-user',
        projectId: auditProjectId,
        projectTitle: 'Phase 25E Truth Audit',
        packages: packages.map((pkg, index) => ({
          ...pkg,
          scheduledAt: index === 0 ? new Date(Date.now() + 3600000).toISOString() : undefined
        }))
      });

      const auditReport = buildRenderCompletionAuditReport(
        { id: 'job-phase-25e' } as any,
        renderRequest,
        {
          success: true,
          fileUrl: `file://${renderResult.outputPath}`,
          outputPath: renderResult.outputPath,
          sizeBytes: renderResult.sizeBytes,
          durationSeconds: renderResult.durationSeconds,
          logs: []
        } as any,
        'audit-user'
      );

      addCheck(
        checks,
        'publishing-package-bridge',
        'Publishing package bridge',
        queueRecord.queuedRecord.settings.publishingQueue.length === packages.length && Boolean(queueRecord.queuedRecord.scheduled_for),
        `queued=${queueRecord.selectedPackages.length}, scheduledFor=${queueRecord.scheduledFor || 'none'}`
      );

      addCheck(
        checks,
        'audit-report-bridge',
        'Audit report bridge',
        auditReport.project_id === renderRequest.projectId && auditReport.diagnostic_score >= 70,
        `project_id=${auditReport.project_id}, score=${auditReport.diagnostic_score}`
      );
    }
  } else {
    addCheck(
      checks,
      'physical-render',
      'Physical FFmpeg render',
      false,
      'Skipped because FFmpeg is not available on this host',
      true
    );
  }

  return {
    phase: '25E',
    passed: checks.every(check => check.status !== 'fail'),
    checks
  };
}

export async function runPhase25ETruthAuditCli() {
  const report = await runPhase25ETruthAudit();
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runPhase25ETruthAuditCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
