import { NextRequest, NextResponse } from 'next/server';
import { parseVisualIntents, parseVisualIntentFromBeat } from '@/lib/ai/visual/intent-parser';
import { rankLocalAssetsAgainstIntent } from '@/lib/ai/visual/asset-matcher';
import { createProceduralVisualProposal } from '@/lib/ai/visual/procedural-visual-engine';
import { validateProposalIntegrity, sanitizeVisualText } from '@/lib/ai/visual/visual-validator';
import { VisualAssetProposal, VisualIntent } from '@/lib/ai/visual/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'generate_procedural';

    // 1. Intent Parsing Action
    if (action === 'parse_intents') {
      const beats = Array.isArray(body.beats) ? body.beats : [];
      const intents: VisualIntent[] = parseVisualIntents(beats);
      return NextResponse.json({ success: true, intents });
    }

    // 2. B-Roll Matching Action
    if (action === 'match_broll') {
      const intent: VisualIntent = body.intent || parseVisualIntentFromBeat(body.beat || { id: 'temp', title: 'Content' });
      const availableAssets = Array.isArray(body.assets) ? body.assets : [];
      const proposals = rankLocalAssetsAgainstIntent(intent, availableAssets, {
        aspectRatio: body.aspectRatio || '9:16',
        fitMode: body.fitMode || 'cover',
        minScoreThreshold: body.minScoreThreshold ?? 0.1
      });

      return NextResponse.json({ success: true, proposals });
    }

    // 3. Procedural Visual Generation Action
    if (action === 'generate_procedural') {
      const type = body.type || 'kinetic_title';
      const headline = sanitizeVisualText(body.headline || 'Impact Moment');
      const subtitle = sanitizeVisualText(body.subtitle || '');
      const theme = body.theme || 'vibrant_creator';
      const aspectRatio = body.aspectRatio || '9:16';
      const duration = Number(body.duration) || 4.0;
      const targetBeatId = body.targetBeatId;
      const startTime = Number(body.startTime) || 0;

      const proposal: VisualAssetProposal = createProceduralVisualProposal(
        type,
        headline,
        subtitle,
        theme,
        aspectRatio,
        duration,
        targetBeatId,
        startTime
      );

      const validation = validateProposalIntegrity(proposal);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Generated visual proposal failed validation', details: validation.errors },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, proposal });
    }

    return NextResponse.json(
      { error: `Unsupported visual action: ${action}` },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Visual Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process visual generation request', details: error.message },
      { status: 500 }
    );
  }
}
