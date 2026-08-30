"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

export function GrowthHub() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudits() {
      if (!user) return;
      setLoading(true);

      if (isDemoMode() || !isSupabaseConfigured()) {
        setAudits([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('audit_reports')
        .select(`
          id, total_views, retention_3s, diagnostic_score, issues, ai_coach_tip,
          projects(title, platforms_targeted)
        `)
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const mapped = data.map(audit => {
          const pTitle = (audit.projects as any)?.title || 'Unknown Video';
          const platforms = (audit.projects as any)?.platforms_targeted || [];
          
          let score = audit.diagnostic_score || 0;
          let label = '🔥 Top Performance';
          let color = 'var(--accent-primary)';
          if (score < 60) {
            label = '🚨 Needs Major Fixes';
            color = '#ef4444';
          } else if (score < 80) {
            label = '⚠️ Average (Pacing Flaws)';
            color = '#f59e0b';
          }

          return {
            id: audit.id,
            title: pTitle,
            platformName: `📱 ${platforms[0] || 'Reels'}`,
            views: (audit.total_views || 0).toLocaleString(),
            retention3s: `${audit.retention_3s || 0}%`,
            statusLabel: label,
            statusColor: color,
            diagnosticScore: score,
            issues: audit.issues || [],
            coachingTip: audit.ai_coach_tip || "Consider optimizing the hook."
          };
        });
        setAudits(mapped);
      } else {
        setAudits([]);
      }
      setLoading(false);
    }
    
    loadAudits();
  }, [user]);

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>📈 Growth Intelligence & Diagnostics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            AI-powered video audits, retention breakdowns, and personalized coaching to fix broken hooks.
          </p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
          <span>🔄 Sync Channel Analytics</span>
        </button>
      </div>

      <div className="bento-grid">
        {/* Left Side: Deep Diagnostics List */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card neo-raised">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Deep Video Audits</h3>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveFilter('all')} style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', borderRadius: '999px' }}>All Posts</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {audits.map((video) => (
                <div key={video.id} style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{video.platformName}</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{video.title}</div>
                    </div>
                    <span className="badge" style={{ background: 'var(--bg-surface-card)', color: video.statusColor, border: `1px solid ${video.statusColor}` }}>
                      {video.statusLabel}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Views</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{video.views}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>3-Second Retention</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{video.retention3s}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Diagnostic Score</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: video.diagnosticScore < 60 ? '#ef4444' : video.diagnosticScore > 90 ? 'var(--accent-primary)' : '#f59e0b' }}>
                        {video.diagnosticScore}/100
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Algorithmic Roadblocks</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {video.issues.map((issue: any, idx: number) => (
                        <li key={idx} style={{ marginBottom: '0.4rem' }}>
                          <strong style={{ color: issue.severity === 'win' ? 'var(--accent-primary)' : 'var(--text-main)' }}>{issue.type}:</strong> {issue.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: 'var(--accent-primary-glow)', border: '1px solid var(--accent-primary)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                      <span>🤖 AI Coach Recommendation</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {video.coachingTip}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Overall Channel Health */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card neo-raised">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>Channel Health</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span>Audience Retention Avg</span>
                  <span style={{ color: 'var(--accent-primary)' }}>64%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-low)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '64%', background: 'var(--accent-primary)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span>Posting Consistency (30D)</span>
                  <span style={{ color: '#10b981' }}>High (4.2/wk)</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-low)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', background: '#10b981' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <span>Hashtag / SEO Reach</span>
                  <span style={{ color: '#f59e0b' }}>Moderate</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-low)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '45%', background: '#f59e0b' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card neo-raised" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Next Masterclass</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', opacity: 0.9 }}>
              Unlock the "Retain & Gain: Advanced Hook Psychology" 15-minute playbook.
            </p>
            <button className="btn" style={{ width: '100%', background: '#fff', color: 'var(--accent-primary)', fontWeight: 800 }}>
              Start Module ⚡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
