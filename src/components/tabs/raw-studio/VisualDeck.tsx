"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Clapperboard, Sparkles, Image as ImageIcon, Film, Layers, CheckSquare, Square, 
  Eye, RefreshCw, Zap, Tag, Clock, ArrowUpRight, SlidersHorizontal, Check, X, ShieldCheck
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { VisualAssetProposal, AspectRatio, FitMode } from '@/lib/ai/visual/types';
import { parseVisualIntentFromBeat } from '@/lib/ai/visual/intent-parser';
import { rankLocalAssetsAgainstIntent } from '@/lib/ai/visual/asset-matcher';
import { createProceduralVisualProposal, THEME_PALETTES } from '@/lib/ai/visual/procedural-visual-engine';
import { compileApprovedVisualAssets } from '@/lib/editing/visual-compiler';

export function VisualDeck() {
  const { 
    assets, 
    storyboardPlan, 
    editState,
    dispatch,
    visualProposals = [], 
    setVisualProposals, 
    selectedVisualIds = new Set(), 
    setSelectedVisualIds,
    previewVisualModalAsset,
    setPreviewVisualModalAsset,
    showToast,
    seekTo
  } = useRawStudio();

  const [activeTab, setActiveTab] = useState<'broll' | 'procedural' | 'ai_image'>('broll');
  const [isScanning, setIsScanning] = useState(false);
  const [enableKenBurnsMotion, setEnableKenBurnsMotion] = useState(true);

  // Procedural Form State
  const [headline, setHeadline] = useState('3X YOUR WORKFLOW');
  const [subtitle, setSubtitle] = useState('The 15-Minute Daily Framework');
  const [graphicType, setGraphicType] = useState<'kinetic_title' | 'graphic_card' | 'gradient_backdrop'>('kinetic_title');
  const [theme, setTheme] = useState<string>('neon_cyber');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [duration, setDuration] = useState<number>(4.0);

  // AI Image Form State
  const [imagePrompt, setImagePrompt] = useState('Futuristic creator workspace with neon lighting and high tech monitors');
  const [imageStyle, setImageStyle] = useState('vibrant_creator');

  // Toggle single visual proposal
  const toggleProposal = (id: string) => {
    setSelectedVisualIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select All Proposals
  const handleSelectAll = () => {
    const allIds = new Set(visualProposals.map(p => p.id));
    setSelectedVisualIds(allIds);
    showToast(`Selected all ${visualProposals.length} visual proposals for ghost overlay`);
  };

  // Deselect All Proposals
  const handleDeselectAll = () => {
    setSelectedVisualIds(new Set());
    showToast('Deselected all visual proposals');
  };

  // 1. Generate B-Roll Matches from Storyboard Beats & Project Media
  const handleScanBRoll = async () => {
    setIsScanning(true);
    try {
      const beats = (storyboardPlan?.beats && storyboardPlan.beats.length > 0)
        ? storyboardPlan.beats
        : [
            {
              id: 'beat-1-hook',
              title: 'High Impact Hook',
              role: 'hook',
              visualHook: 'Dramatic close-up of professional working on laptop',
              spokenText: 'Here is the hidden secret top creators never tell you.',
              bRollIdeas: ['person working on laptop', 'busy desk workspace', 'clock ticking'],
              estimatedStartTime: 0.0,
              estimatedDuration: 4.5
            },
            {
              id: 'beat-2-solution',
              title: 'Core Framework',
              role: 'solution',
              visualHook: 'Organized digital dashboard and calendar view',
              spokenText: 'By batching content into 30 minute sprint blocks, output triples.',
              bRollIdeas: ['calendar schedule app', 'smooth typing hands', 'analytics growth chart'],
              estimatedStartTime: 4.5,
              estimatedDuration: 6.0
            }
          ];

      const matchableAssets = assets.length > 0
        ? assets.map(a => ({
            id: a.id,
            name: a.fileName || a.projects?.title || 'Project Media',
            title: a.fileName || a.projects?.title || 'Project Media',
            url: a.previewUrl || a.storage_path,
            asset_type: a.asset_type === 'raw_video' ? 'video' : 'image',
            tags: [a.mime_type?.split('/')[1] || 'media', 'project', 'broll']
          }))
        : [
            { id: 'mock-1', name: 'laptop_productivity_dark.mp4', title: 'laptop_productivity_dark.mp4', asset_type: 'video', tags: ['laptop', 'productivity', 'dark'], url: '/test_spoken_video.mp4' },
            { id: 'mock-2', name: 'analytics_growth_chart.png', title: 'analytics_growth_chart.png', asset_type: 'image', tags: ['analytics', 'growth', 'chart'], url: '/test_spoken_video.mp4' },
            { id: 'mock-3', name: 'creator_studio_setup.mp4', title: 'creator_studio_setup.mp4', asset_type: 'video', tags: ['studio', 'creator', 'lighting'], url: '/test_spoken_video.mp4' }
          ];

      const newProposals: VisualAssetProposal[] = [];

      beats.forEach(beat => {
        const intent = parseVisualIntentFromBeat(beat);
        const ranked = rankLocalAssetsAgainstIntent(intent, matchableAssets, { aspectRatio, minScoreThreshold: 0.1 });
        if (ranked.length > 0) {
          newProposals.push(ranked[0]); // Best match
          if (ranked.length > 1) newProposals.push(ranked[1]);
        }
      });

      if (newProposals.length === 0) {
        // Fallback procedural card
        const fallback = createProceduralVisualProposal('kinetic_title', 'ATTENTION CREATORS', 'Core Concept', 'neon_cyber', aspectRatio, 4.5);
        newProposals.push(fallback);
      }

      setVisualProposals(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const filtered = newProposals.filter(p => !existingIds.has(p.id));
        return [...prev, ...filtered];
      });

      // Auto-select newly found proposals
      setSelectedVisualIds(prev => {
        const next = new Set(prev);
        newProposals.forEach(p => next.add(p.id));
        return next;
      });

      showToast(`Generated ${newProposals.length} B-Roll proposals matched to storyboard!`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to scan B-Roll matches');
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Generate Procedural Graphic Card
  const handleGenerateProcedural = () => {
    try {
      const proposal = createProceduralVisualProposal(
        graphicType,
        headline || 'IMPACT MOMENT',
        subtitle,
        theme,
        aspectRatio,
        duration,
        storyboardPlan?.beats[0]?.id || 'custom-beat',
        0.0
      );

      setVisualProposals(prev => [proposal, ...prev]);
      setSelectedVisualIds(prev => {
        const next = new Set(prev);
        next.add(proposal.id);
        return next;
      });
      showToast(`Generated procedural ${graphicType.replace('_', ' ')} (${aspectRatio})`);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to generate procedural graphic');
    }
  };

  // 3. Generate AI Image Scene Proposal
  const handleGenerateImage = () => {
    try {
      const proposal = createProceduralVisualProposal(
        'graphic_card',
        imagePrompt.slice(0, 30).toUpperCase(),
        `Prompt: "${imagePrompt}"`,
        imageStyle,
        aspectRatio,
        duration,
        undefined,
        0.0
      );
      proposal.type = 'ai_image';
      proposal.title = `AI Visual: ${imagePrompt.slice(0, 24)}...`;

      setVisualProposals(prev => [proposal, ...prev]);
      setSelectedVisualIds(prev => {
        const next = new Set(prev);
        next.add(proposal.id);
        return next;
      });
      showToast('Generated AI visual scene proposal');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to generate AI visual');
    }
  };

  // 4. Atomic Approval & Insertion to Timeline
  const handleApproveVisuals = () => {
    const selectedProposals = visualProposals.filter(p => selectedVisualIds.has(p.id));
    if (selectedProposals.length === 0) {
      showToast('No visual proposals selected for insertion');
      return;
    }

    try {
      const compileResult = compileApprovedVisualAssets(selectedProposals, editState, {
        enableKenBurns: enableKenBurnsMotion
      });

      if (compileResult.newItems.length === 0) {
        showToast('Compilation resulted in 0 items');
        return;
      }

      // Single Atomic Reducer Transaction
      dispatch({
        type: 'APPLY_VISUAL_ASSETS',
        payload: { newItems: compileResult.newItems }
      });

      // Clear approved proposals from ghost selections
      const approvedIds = new Set(compileResult.approvedProposalIds);
      setSelectedVisualIds(prev => {
        const next = new Set(prev);
        approvedIds.forEach(id => next.delete(id));
        return next;
      });

      showToast(`Inserted ${compileResult.newItems.length} visual asset(s) to timeline with Ken Burns motion`);
    } catch (err: any) {
      console.error('Visual approval error:', err);
      showToast('Failed to insert visual assets to timeline');
    }
  };

  return (
    <div className="visual-deck-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Deck Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🎨</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Visual Intelligence Deck
            </h3>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Phase 24</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            B-Roll Matching, Procedural Graphics & Ghost Visual Preview
          </p>
        </div>

        {/* Non-Destructive Invariant Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <ShieldCheck size={12} />
          <span>Ghost Mode</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-low)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        <button
          className={`btn ${activeTab === 'broll' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => setActiveTab('broll')}
          aria-label="subtab-broll"
        >
          <Clapperboard size={13} /> B-Roll Matcher
        </button>
        <button
          className={`btn ${activeTab === 'procedural' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => setActiveTab('procedural')}
          aria-label="subtab-procedural"
        >
          <Sparkles size={13} /> Graphics & Titles
        </button>
        <button
          className={`btn ${activeTab === 'ai_image' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => setActiveTab('ai_image')}
          aria-label="subtab-ai-image"
        >
          <ImageIcon size={13} /> AI Visuals
        </button>
      </div>

      {/* TAB 1: B-ROLL MATCHER */}
      {activeTab === 'broll' && (
        <div className="card hover-border" style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Storyboard Semantic B-Roll Matcher
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              {assets.length} Media Ingested
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Analyzes your storyboard beat intents and ranks matching video clips from your project media with Ken Burns motion curves.
          </p>

          <button
            className="btn btn-primary"
            disabled={isScanning}
            onClick={handleScanBRoll}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}
          >
            {isScanning ? (
              <><RefreshCw size={14} className="animate-spin" /> Scanning & Ranking Media...</>
            ) : (
              <><Clapperboard size={14} /> Scan Project Media for B-Roll Matches</>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: PROCEDURAL GRAPHICS */}
      {activeTab === 'procedural' && (
        <div className="card hover-border" style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Headline Text
            </label>
            <input
              type="text"
              className="input"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. 3X YOUR OUTPUT"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Subtitle (Optional)
            </label>
            <input
              type="text"
              className="input"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. The 15-Minute Daily Framework"
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Theme Palette
              </label>
              <select
                className="input"
                value={theme}
                onChange={e => setTheme(e.target.value)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
              >
                <option value="neon_cyber">Neon Cyber</option>
                <option value="vibrant_creator">Vibrant Creator</option>
                <option value="minimal_dark">Minimal Dark</option>
                <option value="corporate_clean">Corporate Clean</option>
                <option value="warm_editorial">Warm Editorial</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Aspect Ratio
              </label>
              <select
                className="input"
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
              >
                <option value="9:16">9:16 (Reels/Shorts)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerateProcedural}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}
          >
            <Sparkles size={14} /> Generate Procedural Graphic Card
          </button>
        </div>
      )}

      {/* TAB 3: AI VISUALS */}
      {activeTab === 'ai_image' && (
        <div className="card hover-border" style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Visual Scene Prompt
            </label>
            <textarea
              className="input"
              rows={2}
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder="Describe visual scene for AI generation..."
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Visual Style
              </label>
              <select
                className="input"
                value={imageStyle}
                onChange={e => setImageStyle(e.target.value)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
              >
                <option value="vibrant_creator">Vibrant Creator</option>
                <option value="neon_cyber">Neon Cyber</option>
                <option value="minimal_dark">Minimal Dark</option>
                <option value="corporate_clean">Corporate Clean</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Aspect Ratio
              </label>
              <select
                className="input"
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.45rem' }}
              >
                <option value="9:16">9:16 (Vertical)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleGenerateImage}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '0.25rem' }}
          >
            <ImageIcon size={14} /> Generate AI Visual Scene Proposal
          </button>
        </div>
      )}

      {/* PROPOSAL POOL STATUS & BATCH CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Visual Proposals</span>
          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{visualProposals.length}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({selectedVisualIds.size} selected)</span>
        </div>

        {visualProposals.length > 0 && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleSelectAll}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              Select All
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDeselectAll}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {/* PROPOSALS GALLERY STACK */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {visualProposals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg-surface-low)', borderRadius: '10px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Film size={28} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
            No visual proposals yet. Click <strong>Scan B-Roll</strong> or <strong>Generate Graphics</strong> to create ghost overlays.
          </div>
        ) : (
          visualProposals.map(proposal => {
            const isSelected = selectedVisualIds.has(proposal.id);
            const isSvg = proposal.previewUrl?.startsWith('data:image/svg+xml');

            return (
              <div
                key={proposal.id}
                className="card hover-border"
                style={{
                  padding: '0.75rem',
                  background: isSelected ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-surface-low)',
                  border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleProposal(proposal.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  title={isSelected ? 'Deselect Proposal' : 'Select for Ghost Overlay'}
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>

                {/* Thumbnail Preview */}
                <div 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    background: '#09090b', 
                    flexShrink: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPreviewVisualModalAsset(proposal)}
                  title="Click to inspect high-resolution preview"
                >
                  {isSvg ? (
                    <Image src={proposal.previewUrl} alt={proposal.title} fill unoptimized sizes="64px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
                      <Film size={18} style={{ color: 'var(--accent-cyan)' }} />
                      <span style={{ fontSize: '0.6rem' }}>B-Roll</span>
                    </div>
                  )}
                </div>

                {/* Proposal Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proposal.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      {proposal.aspectRatio}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      {(proposal.relevanceScore * 100).toFixed(0)}% Match
                    </span>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                      {proposal.kenBurns.motion.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {proposal.suggestedDuration.toFixed(1)}s
                    </span>
                  </div>
                </div>

                {/* Inspect Action Button */}
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPreviewVisualModalAsset(proposal);
                    seekTo(proposal.suggestedStartTime || 0);
                  }}
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Inspect High-Res Modal"
                >
                  <Eye size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* EXPLICIT APPROVAL ACTION CARD */}
      {visualProposals.length > 0 && selectedVisualIds.size > 0 && (
        <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.4)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                🚀 Approve & Insert Visuals ({selectedVisualIds.size} selected)
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Converts selected proposals into canonical timeline layers with Ken Burns pan/zoom keyframes.
              </div>
            </div>
          </div>

          {/* Ken Burns Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={enableKenBurnsMotion}
              onChange={(e) => setEnableKenBurnsMotion(e.target.checked)}
            />
            <span>Apply Deterministic Ken Burns Motion (Pan & Zoom Curves)</span>
          </label>

          <button
            className="btn btn-primary"
            onClick={handleApproveVisuals}
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-purple, #a855f7)', borderColor: 'var(--accent-purple, #a855f7)' }}
          >
            <Sparkles size={14} /> Insert Selected Visuals ({selectedVisualIds.size}) to Timeline
          </button>
        </div>
      )}

      {/* HIGH RESOLUTION INSPECTION MODAL */}
      {previewVisualModalAsset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', width: '90%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🖼️</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  {previewVisualModalAsset.title}
                </h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px', border: 'none' }}
                onClick={() => setPreviewVisualModalAsset(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* High Res Canvas Preview */}
            <div style={{ width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
              {previewVisualModalAsset.previewUrl?.startsWith('data:image/svg+xml') ? (
                <Image src={previewVisualModalAsset.previewUrl} alt="Preview" fill unoptimized sizes="480px" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Film size={36} style={{ color: 'var(--accent-cyan)', margin: '0 auto 8px auto' }} />
                  <div>B-Roll Clip: {previewVisualModalAsset.title}</div>
                </div>
              )}
            </div>

            {/* Metadata Info */}
            <div style={{ background: 'var(--bg-surface-low)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aspect Ratio:</span>
                <span style={{ fontWeight: 600 }}>{previewVisualModalAsset.aspectRatio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Motion Style:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{previewVisualModalAsset.kenBurns.motion} (Ken Burns)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Suggested Duration:</span>
                <span style={{ fontWeight: 600 }}>{previewVisualModalAsset.suggestedDuration.toFixed(1)}s</span>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setPreviewVisualModalAsset(null)}
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
