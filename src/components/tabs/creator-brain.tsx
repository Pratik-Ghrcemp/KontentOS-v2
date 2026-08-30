"use client";

import React from 'react';
import { useAppState } from '@/context/state-context';

export function CreatorBrain() {
  const { state, setTab } = useAppState();
  const profile = state.creatorProfile;

  const platforms = [
    { id: 'instagram', name: 'Instagram Reels' },
    { id: 'youtube', name: 'YouTube Shorts' },
    { id: 'x', name: '𝕏 (Twitter)' },
    { id: 'threads', name: 'Threads' },
    { id: 'facebook', name: 'Facebook Watch' },
    { id: 'linkedin', name: 'LinkedIn' }
  ];

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>🧠 Creator Brain & Signature DNA</h1>
            <span className="badge badge-neon">ONLINE & LEARNING</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Your centralized AI memory bank. KontentOS learns your tone, audience hooks, and winning visual style over time.
          </p>
        </div>

        <button onClick={() => setTab('onboarding')} className="btn btn-primary">
          <span>⚡ Retrain Creator Brain</span>
        </button>
      </div>

      {/* Bento Grid: Brain Metrics & Archetype */}
      <div className="bento-grid" style={{ marginBottom: '2rem' }}>
        
        {/* Left: Voice DNA & Niche */}
        <div className="card neo-raised" style={{ gridColumn: 'span 7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>Creator Voice & Identity</h3>
            <span className="badge badge-purple">{profile.voiceArchetype || 'Dynamic Creator'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Operating Mode & Focus
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {profile.mode === 'viral' ? `⚡ Viral & Entertainment (${profile.selectedVibe || 'Comedy'})` : `🎯 Pro Authority (${profile.proNiche || 'General'} • ${profile.proSubNiche || 'Shorts'})`}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Signature Hook Formula & Catchphrase
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                "{profile.customCatchphrase || 'Bhai suno!'}" — {profile.hookFormula || 'Curiosity Gap'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-tertiary)', fontWeight: 700, marginBottom: '0.25rem' }}>
                Audience & Language Synchronization
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {profile.language || 'Multi-lingual'} • Live Audience Graph Synced
              </div>
            </div>
          </div>
        </div>

        {/* Right: Connected Channels & Memory Stats */}
        <div className="card neo-raised" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Omni-Channel Distribution</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
            {platforms.map(p => {
              const isConn = (profile.connectedPlatforms || []).includes(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'var(--bg-surface-low)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.name}</span>
                  <span className={`badge ${isConn ? 'badge-neon' : 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>
                    {isConn ? 'SYNCED' : 'READY'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Memory Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-surface-low)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary-light)' }}>42</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Saved Hooks</div>
            </div>
            <div style={{ background: 'var(--bg-surface-low)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-tertiary-light)' }}>12</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Winning Formats</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
