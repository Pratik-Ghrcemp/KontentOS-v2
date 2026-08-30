"use client";

import React from 'react';
import { useAppState } from '@/context/state-context';

export function MediaKit() {
  const { state } = useAppState();
  const profile = state.creatorProfile;

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Professional Creator Media Kit
            </h1>
            <span className="badge badge-green">LIVE VERIFIED STATS</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Shareable, high-converting partnership deck for agency reps and inbound brand sponsors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
            <span>🔗 Copy Live Link</span>
          </button>
          <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <span>📥 Download PDF Deck</span>
          </button>
        </div>
      </div>

      {/* Hero Creator Profile Card */}
      <div className="card neo-raised" style={{ padding: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', fontWeight: 900, fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px var(--accent-primary-glow)' }}>
            {(profile.name || 'C').charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>{profile.name || 'Creator Profile'}</h2>
              <span className="badge badge-neon">VERIFIED PARTNER</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '4px' }}>
              {profile.handle || '@creator'} • {profile.proNiche || 'Tech & AI Systems'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '540px', lineHeight: 1.4 }}>
              Creating high-impact short-form breakdowns and actionable guides on AI automation, software engineering, and the future of creator work.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>248K+</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Audience</div>
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>8.6%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Engagement</div>
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>2.4M</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly Views</div>
          </div>
        </div>
      </div>

      {/* Channel Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div className="card neo-raised" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📸</span>
            <span className="badge badge-neon">TOP CHANNEL</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2px' }}>85,400</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Instagram Followers</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 700 }}>11.2% Reel Engagement</div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>▶️</span>
            <span className="badge badge-purple">FAST GROWING</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2px' }}>92,100</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>YouTube Subscribers</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-tertiary)', fontWeight: 700 }}>94% Short Retention</div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>💼</span>
            <span className="badge badge-cyan">HIGH B2B VALUE</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2px' }}>44,200</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>LinkedIn Followers</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>+620 C-Level Audience</div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>𝕏</span>
            <span className="badge badge-green">HIGH REACH</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '2px' }}>26,800</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>X / Twitter Followers</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700 }}>64K Avg Impressions</div>
        </div>

      </div>

      <div className="bento-grid">
        <div className="card neo-raised" style={{ gridColumn: 'span 12' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Past Brand Partnerships</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', opacity: 0.6 }}>
            {/* Logos represent past partnerships */}
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Notion</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Framer</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Vercel</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Stripe</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Shopify</div>
          </div>
        </div>
      </div>

    </div>
  );
}
