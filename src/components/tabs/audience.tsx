"use client";

import React from 'react';
import { useAppState } from '@/context/state-context';

export function Audience() {
  const { state, setTab } = useAppState();
  
  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Audience Intelligence Hub
            </h1>
            <span className="badge badge-neon">DEEP PERSONA CRM</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Understand who watches, what triggers shares, and cultivate high-loyalty super-fans.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
            <span>📥 Export CSV Data</span>
          </button>
          <button onClick={() => setTab('growth')} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <span>🚀 Run Growth Experiment</span>
          </button>
        </div>
      </div>

      {/* 4 Key Audience Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        <div className="card neo-raised" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Community</span>
            <span className="badge badge-green">↑ 18.4%</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '0.25rem' }}>
            248,500
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Active across 6 connected platforms
          </div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Core Demographic</span>
            <span className="badge badge-neon">HIGH SPEND</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '0.25rem' }}>
            25 - 34 YRS
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            68% Founders, Engineers & Creators
          </div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Super-Fan Index</span>
            <span className="badge badge-purple">92 / 100</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '0.25rem' }}>
            14.2K VIPs
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Avg 4.8 comments & shares / month
          </div>
        </div>

        <div className="card neo-raised" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Geography</span>
            <span className="badge badge-cyan">GLOBAL TECH</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '0.25rem' }}>
            US • IN • UK
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tier-1 commercial purchasing power
          </div>
        </div>

      </div>

      <div className="bento-grid">
        
        {/* Left: Persona Clusters */}
        <div className="card neo-raised" style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Audience Persona Breakdown</h3>
            <span className="badge badge-neon">AI CLUSTERED</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            
            <div style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>The Builder (42%)</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>HIGH INTENT</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Software developers, Indie Hackers, and early-stage startup founders looking for technical automation workflows.</p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '12px', borderLeft: '4px solid var(--accent-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>The Scaler (35%)</span>
                <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>REVENUE FOCUSED</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mid-tier creators, marketers, and agency owners focusing on content ROI and conversion pipelines.</p>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-surface-low)', borderRadius: '12px', borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>The Casual Learner (23%)</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>AWARENESS</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Students, corporate professionals seeking side-hustles, drawn in by viral top-of-funnel listicles.</p>
            </div>

          </div>
        </div>

        {/* Right: Super-Fan CRM Activity */}
        <div className="card neo-raised" style={{ gridColumn: 'span 5' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Recent VIP Activity</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { handle: '@techfounder_xyz', action: 'Shared your latest Notion guide', time: '10 mins ago', icon: '🔁' },
              { handle: '@sarah_codes', action: 'Commented on 3 consecutive videos', time: '2 hours ago', icon: '💬' },
              { handle: '@indiehacker_jay', action: 'Saved your AI workflow carousel', time: '5 hours ago', icon: '💾' },
              { handle: '@dev_ops_life', action: 'Tagged a colleague in your post', time: 'Yesterday', icon: '🤝' },
              { handle: '@marketing_mike', action: 'Sent you an Instagram DM', time: 'Yesterday', icon: '✉️' }
            ].map((activity, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.25rem' }}>{activity.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{activity.handle}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activity.action} • {activity.time}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
            <span>Engage with VIPs</span>
          </button>
        </div>

      </div>
    </div>
  );
}
