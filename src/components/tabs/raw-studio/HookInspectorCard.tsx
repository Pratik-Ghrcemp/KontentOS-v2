"use client";

import React, { useState, useMemo } from 'react';
import { Sparkles, Zap, Play, Clock, ShieldCheck, AlertCircle, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { useRawStudio } from './RawStudioContext';
import { AiProposal } from '@/lib/ai/proposal-types';

export function HookInspectorCard() {
  const { editState, seekTo, showToast } = useRawStudio();
  const [hooks, setHooks] = useState<AiProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<'general' | 'viral' | 'educational' | 'sales'>('general');
  const [activeProvider, setActiveProvider] = useState<'ollama' | 'heuristic' | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  // Extract caption segments from canonical timeline
  const captionItems = useMemo(() => 
    editState.items.filter(item => item.type === 'caption').sort((a, b) => a.start - b.start),
    [editState.items]
  );

  const hasCaptions = captionItems.length > 0;

  const handleGenerateHooks = async () => {
    if (!hasCaptions) {
      showToast('Generate captions first in the Captions tool to analyze speech hooks.');
      return;
    }

    setIsLoading(true);
    try {
      const transcript = captionItems.map(item => ({
        text: item.content || item.label || '',
        startTime: item.start,
        endTime: item.end
      }));

      const res = await fetch('/api/ai/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          projectDuration: editState.duration || 10,
          options: {
            maxHooks: 4,
            goal: selectedGoal
          }
        })
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.proposals)) {
        setHooks(data.proposals);
        setActiveProvider(data.provider);
        setLastAnalyzedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast(`Discovered ${data.proposals.length} high-retention hook recommendations.`);
      } else {
        showToast(data.error || 'Unable to generate hook recommendations.');
      }
    } catch (err: any) {
      showToast(`Hook analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (hook: AiProposal) => {
    // Non-destructive navigation only: seeks playhead to hook start time
    seekTo(hook.startTime);
    showToast(`Jumped to hook at ${hook.startTime.toFixed(2)}s (Preview Only — timeline unchanged)`);
  };

  return (
    <div className="studio-panel-stack animate-fade-in" style={{ padding: '1.25rem', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Zap size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>AI Hook Intelligence</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High-retention opening teasers</span>
          </div>
        </div>

        {activeProvider && (
          <span className="badge" style={{
            fontSize: '0.68rem',
            background: activeProvider === 'ollama' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: activeProvider === 'ollama' ? 'var(--accent-green)' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}>
            {activeProvider === 'ollama' ? '⚡ Local Ollama' : '🛡️ Heuristic Fallback'}
          </span>
        )}
      </div>

      {/* Non-destructive Safety Notice */}
      <div style={{
        padding: '0.65rem 0.85rem',
        borderRadius: '6px',
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '1rem'
      }}>
        <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.73rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
          <strong>Non-Destructive Mode:</strong> Suggestions are recommendations for review. Clicking a hook seeks the playhead without altering your timeline.
        </span>
      </div>

      {/* Goal Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
          Video Strategy / Goal
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {(['general', 'viral', 'educational', 'sales'] as const).map(goal => (
            <button
              key={goal}
              onClick={() => setSelectedGoal(goal)}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: selectedGoal === goal ? 600 : 400,
                background: selectedGoal === goal ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                border: selectedGoal === goal ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                color: selectedGoal === goal ? 'var(--accent-amber)' : 'var(--text-muted)',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Action Trigger Button */}
      <button
        className="btn btn-primary"
        onClick={handleGenerateHooks}
        disabled={isLoading || !hasCaptions}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'var(--accent-amber)',
          color: '#000000',
          border: 'none',
          boxShadow: '0 2px 10px rgba(245, 158, 11, 0.25)',
          cursor: (!hasCaptions || isLoading) ? 'not-allowed' : 'pointer',
          opacity: (!hasCaptions || isLoading) ? 0.6 : 1,
          marginBottom: '1.25rem'
        }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Analyzing Spoken Retention Signals...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {hooks.length > 0 ? 'Regenerate AI Hooks' : 'Analyze & Discover Hooks'}
          </>
        )}
      </button>

      {/* Content Area / Proposals List */}
      {!hasCaptions ? (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          borderRadius: '8px',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>No Transcript Found</div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
            Generate speech captions in the <strong>Captions</strong> tool first to evaluate spoken viral hooks.
          </div>
        </div>
      ) : hooks.length === 0 && !isLoading ? (
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          borderRadius: '8px',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          <Zap size={28} style={{ margin: '0 auto 8px', color: 'var(--accent-amber)', opacity: 0.6 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Ready to Analyze</div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
            Click above to discover the top 3–4 high-retention opening hooks in your raw footage.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Recommended Opening Candidates ({hooks.length})</span>
            {lastAnalyzedAt && <span>Updated {lastAnalyzedAt}</span>}
          </div>

          {hooks.map((hook, index) => {
            const duration = (hook.endTime - hook.startTime).toFixed(1);
            return (
              <div
                key={hook.id}
                onClick={() => handleCardClick(hook)}
                className="card hover-border"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Top Row: Hook Kind & Confidence Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'var(--accent-amber)',
                      background: 'rgba(245, 158, 11, 0.12)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Option #{index + 1}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {hook.title}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: hook.confidence >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)',
                    background: hook.confidence >= 85 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {hook.confidence}% Fit
                  </span>
                </div>

                {/* Spoken Quote Evidence */}
                {hook.sourceEvidence && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-main)',
                    background: 'var(--bg-card)',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    borderLeft: '2px solid var(--accent-amber)',
                    fontStyle: 'italic',
                    marginBottom: '8px'
                  }}>
                    "{hook.sourceEvidence}"
                  </div>
                )}

                {/* Plain-language Reasoning */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, marginBottom: '10px' }}>
                  {hook.reasoning}
                </div>

                {/* Footer: Timestamps & Seek Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{hook.startTime.toFixed(2)}s – {hook.endTime.toFixed(2)}s ({duration}s)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                    <Play size={10} fill="currentColor" />
                    <span>Click to Preview</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
