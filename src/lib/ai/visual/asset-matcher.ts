import { VisualIntent, VisualAssetProposal, AspectRatio, FitMode, KenBurnsConfig } from './types';
import { extractKeywords } from './intent-parser';

export interface MatchableAsset {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  file_url?: string;
  previewUrl?: string;
  asset_type?: string;
  type?: string;
  tags?: string[];
  duration?: number | string;
  width?: number;
  height?: number;
}

/**
 * Pure helper function to score relevance between a MatchableAsset and a VisualIntent.
 */
export function calculateAssetRelevanceScore(asset: MatchableAsset, intent: VisualIntent): number {
  let score = 0.0;

  const assetName = (asset.name || asset.title || '').toLowerCase();
  const assetTags = (asset.tags || []).map(t => t.toLowerCase());
  const assetKeywords = extractKeywords(assetName);

  // 1. Tag Exact Match (High Confidence)
  intent.keywords.forEach(kw => {
    if (assetTags.includes(kw.toLowerCase())) {
      score += 0.35;
    }
  });

  // 2. Primary Subject Match
  const primaryTokens = extractKeywords(intent.primarySubject);
  primaryTokens.forEach(token => {
    if (assetName.includes(token) || assetTags.includes(token)) {
      score += 0.30;
    }
  });

  // 3. Keyword Token Overlap
  const sharedTokens = assetKeywords.filter(k => intent.keywords.includes(k));
  if (sharedTokens.length > 0) {
    score += Math.min(0.30, sharedTokens.length * 0.15);
  }

  // 4. Search Query Substring Matching
  intent.searchQueries.forEach(query => {
    const queryLower = query.toLowerCase();
    if (assetName.includes(queryLower) || assetTags.some(t => queryLower.includes(t))) {
      score += 0.25;
    }
  });

  // Fallback base score for any existing video/image asset
  const isVisualType = asset.asset_type === 'video' || asset.asset_type === 'image' || asset.type === 'video' || asset.type === 'image';
  if (isVisualType && score === 0.0) {
    score = 0.15; // Baseline presence
  }

  return Math.min(1.0, Math.max(0.0, Number(score.toFixed(2))));
}

/**
 * Deterministic Ken Burns Motion generator based on visual intent motion style.
 */
export function getKenBurnsConfig(motionStyle?: string): KenBurnsConfig {
  switch (motionStyle) {
    case 'fast_punch_zoom':
      return { motion: 'zoom_in', startScale: 100, endScale: 120 };
    case 'slow_push_dramatic':
      return { motion: 'zoom_in', startScale: 100, endScale: 112 };
    case 'dynamic_pan_reveal':
      return { motion: 'pan_left', startScale: 110, endScale: 110, startX: 40, endX: -40 };
    case 'subtle_drift_focus':
      return { motion: 'subtle_drift', startScale: 102, endScale: 108 };
    case 'steady_punch_in':
      return { motion: 'zoom_in', startScale: 100, endScale: 115 };
    default:
      return { motion: 'subtle_drift', startScale: 100, endScale: 108 };
  }
}

/**
 * Matches and ranks available project media assets against a VisualIntent.
 */
export function rankLocalAssetsAgainstIntent(
  intent: VisualIntent,
  availableAssets: MatchableAsset[],
  options: { aspectRatio?: AspectRatio; fitMode?: FitMode; minScoreThreshold?: number } = {}
): VisualAssetProposal[] {
  const minThreshold = options.minScoreThreshold ?? 0.1;
  const aspectRatio: AspectRatio = options.aspectRatio || '9:16';
  const fitMode: FitMode = options.fitMode || 'cover';

  const proposals: VisualAssetProposal[] = [];

  availableAssets.forEach((asset, idx) => {
    const score = calculateAssetRelevanceScore(asset, intent);
    if (score < minThreshold) return;

    const sourceUrl = asset.url || asset.file_url || asset.previewUrl || '';
    const assetTitle = asset.name || asset.title || `B-Roll Clip ${idx + 1}`;
    const format = (asset.asset_type === 'image' || asset.type === 'image') ? 'png' : 'mp4';

    const proposal: VisualAssetProposal = {
      id: `prop-broll-${asset.id || idx}-${Date.now()}`,
      type: 'b_roll',
      title: assetTitle,
      description: `Matched local asset for "${intent.primarySubject}" (Score: ${(score * 100).toFixed(0)}%)`,
      previewUrl: sourceUrl,
      sourcePathOrData: sourceUrl,
      relevanceScore: score,
      targetBeatId: intent.beatId,
      suggestedStartTime: intent.suggestedStartTime || 0,
      suggestedDuration: intent.targetDuration || 4.0,
      aspectRatio,
      fitMode,
      kenBurns: getKenBurnsConfig(intent.motionStyle),
      metadata: {
        format,
        width: asset.width || (aspectRatio === '9:16' ? 1080 : 1920),
        height: asset.height || (aspectRatio === '9:16' ? 1920 : 1080),
        tags: asset.tags || intent.keywords.slice(0, 3),
        isLocalMatch: true,
        matchedFileName: asset.name || asset.title
      },
      createdAt: new Date().toISOString()
    };

    proposals.push(proposal);
  });

  // Sort descending by relevance score
  return proposals.sort((a, b) => b.relevanceScore - a.relevanceScore);
}
