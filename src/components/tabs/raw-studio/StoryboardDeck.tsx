"use client";

import React, { useState } from 'react';
import { 
  Clapperboard, Sparkles, Wand2, Play, Check, CheckSquare, 
  Square, RefreshCw, Type, Eye, Volume2, ArrowRight, 
  Layers, Clock, Film, Zap, MessageSquare, HelpCircle, ShieldCheck, CheckCircle
} from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { StoryboardPlan, StoryboardBeat, StoryboardBeatRole, StoryboardTone, StoryboardFormat } from '@/lib/ai/storyboard-types';
import { compileApprovedStoryboard } from '@/lib/editing/storyboard-compiler';

const PRESET_TOPICS = [
  'How to scale a SaaS business with AI in 2026',
  '3 mistakes beginners make when editing short videos',
  'Why morning routines don’t work (and what to do instead)',
  'How I automated my content creation in 5 minutes'
];

const ROLE_COLORS: Record<StoryboardBeatRole, { bg: string; text: string; border: string }> = {
  hook: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
  problem: { bg: '#ffe4e6', text: '#e11d48', border: '#f43f5e' },
  solution: { bg: '#d1fae5', text: '#059669', border: '#10b981' },
  proof: { bg: '#e0f2fe', text: '#0284c7', border: '#0ea5e9' },
  call_to_action: { bg: '#f3e8ff', text: '#7e22ce', border: '#a855f7' },
  transition: { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' }
};

export function StoryboardDeck() {
  const {
    storyboardPlan,
    setStoryboardPlan,
    selectedBeatIds,
    setSelectedBeatIds,
    activeBeatIndex,
    setActiveBeatIndex,
    seekTo,
    showToast,
    dispatch,
    editState
  } = useRawStudio();

  const [inputMode, setInputMode] = useState<'topic' | 'script'>('topic');
  const [topic, setTopic] = useState('How to scale a SaaS business with AI in 2026');
  const [rawScript, setRawScript] = useState('');
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [tone, setTone] = useState<StoryboardTone>('energetic');
  const [formatPreset, setFormatPreset] = useState<StoryboardFormat>('instagram-reels');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const [appendMode, setAppendMode] = useState<boolean>(true);

  const handleApplyStoryboard = () => {
    if (!storyboardPlan || selectedBeatIds.size === 0) {
      showToast('Please select at least 1 beat to apply.');
      return;
    }

    const compileResult = compileApprovedStoryboard(
      storyboardPlan,
      selectedBeatIds,
      editState?.items || [],
      { append: appendMode }
    );

    if (compileResult.newItems.length === 0) {
      showToast('No valid timeline items compiled from selected beats.');
      return;
    }

    dispatch({
      type: 'APPLY_STORYBOARD',
      payload: compileResult
    });

    // Clear ghost previews so concrete items are visually prominent
    setSelectedBeatIds(new Set());
    setActiveBeatIndex(null);

    showToast(`✅ Assembled ${compileResult.newItems.length} storyboard items onto timeline! (Undo with Ctrl+Z)`);
  };

  const handleGenerate = async () => {
    if (inputMode === 'topic' && !topic.trim()) {
      showToast('Please enter a video topic or concept.');
      return;
    }
    if (inputMode === 'script' && !rawScript.trim()) {
      showToast('Please enter or paste your video script.');
      return;
    }

    setIsGenerating(true);
    showToast('Generating AI Storyboard & Visual Beat Deck...');

    try {
      const res = await fetch('/api/ai/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: inputMode === 'topic' ? topic.trim() : undefined,
          rawText: inputMode === 'script' ? rawScript.trim() : undefined,
          targetDuration,
          tone,
          formatPreset,
          wordsPerMinute: 150
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.plan) {
        const plan: StoryboardPlan = data.plan;
        setStoryboardPlan(plan);
        // Select all beats by default
        const allIds = new Set(plan.beats.map(b => b.id));
        setSelectedBeatIds(allIds);
        showToast(`AI Storyboard created: ${plan.beats.length} beats generated!`);
      } else {
        throw new Error(data.error || 'Failed to generate storyboard.');
      }
    } catch (err: any) {
      console.error('[StoryboardDeck Error]:', err);
      showToast(`Error: ${err.message || 'Failed to generate storyboard'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleBeatSelection = (id: string) => {
    const updated = new Set(selectedBeatIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedBeatIds(updated);
  };

  const handleSelectAll = () => {
    if (!storyboardPlan) return;
    setSelectedBeatIds(new Set(storyboardPlan.beats.map(b => b.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBeatIds(new Set());
  };

  const handlePreviewBeat = (beat: StoryboardBeat, index: number) => {
    setActiveBeatIndex(index);
    seekTo(beat.estimatedStartTime);
    showToast(`Jumped to Beat ${index + 1}: ${beat.role.toUpperCase()} (t=${beat.estimatedStartTime.toFixed(1)}s)`);
  };

  const updateBeatSpokenText = (beatId: string, newText: string) => {
    if (!storyboardPlan) return;
    const updatedBeats = storyboardPlan.beats.map(b => {
      if (b.id === beatId) {
        return { ...b, spokenText: newText };
      }
      return b;
    });
    setStoryboardPlan({ ...storyboardPlan, beats: updatedBeats });
  };

  return (
    <div className="storyboard-deck-container" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', color: 'var(--accent-amber, #f59e0b)' }}>
            <Clapperboard size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>AI Storyboard Intelligence</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Script-to-Video scene planning with live Ghost Preview</span>
          </div>
        </div>
      </div>

      {/* Input Form / Mode Switcher */}
      <div style={{ background: 'var(--bg-surface-elevated, var(--bg-surface))', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-base)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setInputMode('topic')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: inputMode === 'topic' ? 600 : 500,
              background: inputMode === 'topic' ? 'var(--bg-surface)' : 'transparent',
              color: inputMode === 'topic' ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> From Topic / Idea
          </button>
          <button
            type="button"
            onClick={() => setInputMode('script')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '0.75rem',
              fontWeight: inputMode === 'script' ? 600 : 500,
              background: inputMode === 'script' ? 'var(--bg-surface)' : 'transparent',
              color: inputMode === 'script' ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Type size={14} /> From Raw Script
          </button>
        </div>

        {/* Dynamic Input */}
        {inputMode === 'topic' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Video Concept or Topic:</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 3 secret strategies for rapid YouTube growth..."
              style={{
                padding: '8px 10px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)'
              }}
            />
            {/* Topic Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
              {PRESET_TOPICS.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(pt)}
                  style={{
                    fontSize: '0.65rem',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {pt.slice(0, 28)}...
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Paste Script or Voiceover Draft:</label>
            <textarea
              rows={4}
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
              placeholder="Paste your voiceover script or dialogue sentences here..."
              style={{
                padding: '8px 10px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {/* Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target Duration</label>
            <select
              value={targetDuration}
              onChange={(e) => setTargetDuration(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-main)' }}
            >
              <option value={15}>15s (Quick Hook)</option>
              <option value={30}>30s (Standard Reel)</option>
              <option value={60}>60s (Deep Dive)</option>
              <option value={90}>90s (Explainer)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as StoryboardTone)}
              style={{ width: '100%', padding: '6px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-main)' }}
            >
              <option value="energetic">⚡ Energetic</option>
              <option value="educational">🎓 Educational</option>
              <option value="storytelling">📖 Storytelling</option>
              <option value="sales">💼 Direct Sales</option>
              <option value="casual">☕ Casual Chat</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Format</label>
            <select
              value={formatPreset}
              onChange={(e) => setFormatPreset(e.target.value as StoryboardFormat)}
              style={{ width: '100%', padding: '6px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-main)' }}
            >
              <option value="instagram-reels">📱 9:16 Vertical</option>
              <option value="youtube-landscape">🖥️ 16:9 Landscape</option>
            </select>
          </div>
        </div>

        {/* Generate Trigger */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            marginTop: '4px',
            padding: '10px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            opacity: isGenerating ? 0.7 : 1
          }}
        >
          {isGenerating ? (
            <>
              <RefreshCw size={16} className="animate-spin" /> Structuring Storyboard Beats...
            </>
          ) : (
            <>
              <Wand2 size={16} /> Generate AI Storyboard Plan
            </>
          )}
        </button>
      </div>

      {/* Storyboard Deck & Beats */}
      {storyboardPlan && storyboardPlan.beats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Deck Header Summary */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{storyboardPlan.title}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {storyboardPlan.beats.length} Beats • ~{storyboardPlan.estimatedTotalDuration}s Total • Provider: <strong style={{ color: 'var(--accent-primary)' }}>{storyboardPlan.provider}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Beat Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {storyboardPlan.beats.map((beat, idx) => {
              const isSelected = selectedBeatIds.has(beat.id);
              const isActive = activeBeatIndex === idx;
              const roleStyle = ROLE_COLORS[beat.role] || ROLE_COLORS.solution;

              return (
                <div
                  key={beat.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1.5px solid ${isActive ? 'var(--accent-primary)' : isSelected ? roleStyle.border : 'var(--border-subtle)'}`,
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  {/* Card Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => toggleBeatSelection(beat.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>

                      {/* Role Badge */}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.border}`
                        }}
                      >
                        {beat.role}
                      </span>

                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {beat.title}
                      </span>
                    </div>

                    {/* Timing & Seek */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ⏱️ {beat.estimatedStartTime.toFixed(1)}s - {(beat.estimatedStartTime + beat.estimatedDuration).toFixed(1)}s ({beat.estimatedDuration.toFixed(1)}s)
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePreviewBeat(beat, idx)}
                        title="Jump playhead to this beat"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Play size={10} /> Preview
                      </button>
                    </div>
                  </div>

                  {/* Spoken Text / Voiceover */}
                  <div style={{ background: 'var(--bg-base)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, marginBottom: '2px' }}>
                      <Volume2 size={11} /> Voiceover / Dialogue:
                    </div>
                    {editingBeatId === beat.id ? (
                      <textarea
                        rows={2}
                        value={beat.spokenText}
                        onChange={(e) => updateBeatSpokenText(beat.id, e.target.value)}
                        onBlur={() => setEditingBeatId(null)}
                        autoFocus
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.75rem', resize: 'vertical' }}
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingBeatId(beat.id)}
                        title="Click to edit dialogue"
                        style={{ cursor: 'text' }}
                      >
                        "{beat.spokenText}"
                      </div>
                    )}
                  </div>

                  {/* Visual Intent & B-roll Tags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-main)' }}>🎬 Visual Intent:</strong> {beat.visualIntent}
                    </div>

                    {beat.brollKeywords.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                        {beat.brollKeywords.map((kw, ki) => (
                          <span
                            key={ki}
                            style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-base)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--accent-primary)'
                            }}
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggested Headline & Sound Design */}
                  {(beat.suggestedHeadline || beat.soundCue) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '4px', fontSize: '0.68rem' }}>
                      {beat.suggestedHeadline && (
                        <span style={{ color: 'var(--accent-amber, #f59e0b)', fontWeight: 600 }}>
                          🔤 Headline: {beat.suggestedHeadline}
                        </span>
                      )}
                      {beat.soundCue && (
                        <span style={{ color: 'var(--accent-cyan, #06b6d4)' }}>
                          ⚡ SFX: {beat.soundCue}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assembly Bridge Callout */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <ShieldCheck size={16} /> Ghost Preview Active — Zero Timeline Mutations
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Dashed ghost cards on the timeline visualize your storyboard timing. The timeline will not change until you explicitly assemble.
            </div>
          </div>

          {/* Assembly Actions Panel */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Apply to Canonical Timeline
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={appendMode}
                  onChange={(e) => setAppendMode(e.target.checked)}
                />
                Append to existing clips
              </label>
            </div>

            <button
              type="button"
              onClick={handleApplyStoryboard}
              disabled={selectedBeatIds.size === 0}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: selectedBeatIds.size > 0 ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-base)',
                color: selectedBeatIds.size > 0 ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: selectedBeatIds.size > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: selectedBeatIds.size > 0 ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle size={16} /> Apply {selectedBeatIds.size} Selected Storyboard Beats
            </button>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              ⚡ Creates editable video slots, headlines & captions in 1 atomic action (Undo with Ctrl+Z)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
