"use client";

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/context/state-context';
import { useAuth } from '@/context/auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuditWithProject {
  id: string;
  total_views: number | null;
  retention_3s: number | null;
  diagnostic_score: number | null;
  projects: { title: string; id: string } | null;
}

export function Dashboard() {
  const { state, setTab } = useAppState();
  const { user } = useAuth();
  const profile = state.creatorProfile;

  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalProjects: 0,
    scheduled: 0,
    totalViews: 0,
    retention: 0 as number | null,
    // Prior-period values for delta computation (previous 30 days)
    prevTotalViews: null as number | null,
    prevRetention: null as number | null,
    prevTotalProjects: null as number | null,
  });

  const [bestProject, setBestProject] = useState<{ title: string; id: string } | null>(null);
  const [hasAuditData, setHasAuditData] = useState(false);

  useEffect(() => {
    async function loadDashboardStats() {
      if (!user) return;
      setIsLoading(true);

      if (isDemoMode() || !isSupabaseConfigured()) {
        setStats({
          totalProjects: 0,
          scheduled: 0,
          totalViews: 0,
          retention: null,
          prevTotalViews: null,
          prevRetention: null,
          prevTotalProjects: null,
        });
        setBestProject(null);
        setHasAuditData(false);
        setIsLoading(false);
        return;
      }

      // ── Projects ──────────────────────────────────────────────────────────
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, created_at')
        .eq('user_id', user.id);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const scheduledCount = projects?.filter(
        p => p.status === 'queued' || p.status === 'scheduled'
      ).length || 0;

      // Prior-period project count (projects created between 60–30 days ago)
      const prevProjectCount = projects?.filter(p => {
        const d = new Date(p.created_at);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      }).length ?? null;

      // ── Audit Reports ─────────────────────────────────────────────────────
      const { data: audits } = await supabase
        .from('audit_reports')
        .select('id, total_views, retention_3s, diagnostic_score, projects(title, id)')
        .eq('user_id', user.id) as { data: AuditWithProject[] | null };

      let views = 0;
      let retentionSum: number | null = null;
      let bestScore = -1;
      let best: { title: string; id: string } | null = null;

      if (audits && audits.length > 0) {
        setHasAuditData(true);
        views = audits.reduce((acc, curr) => acc + (curr.total_views || 0), 0);
        const retentionValues = audits
          .map(a => a.retention_3s)
          .filter((v): v is number => v !== null && v !== undefined);
        retentionSum = retentionValues.length > 0
          ? Math.round(retentionValues.reduce((a, b) => a + b, 0) / retentionValues.length)
          : null;

        // Best project by diagnostic_score for AI Radar
        audits.forEach(a => {
          const score = a.diagnostic_score ?? 0;
          if (score > bestScore && a.projects?.title) {
            bestScore = score;
            best = a.projects;
          }
        });
        setBestProject(best);
      } else {
        setHasAuditData(false);
        setBestProject(null);
      }

      setStats({
        totalProjects: projects?.length || 0,
        scheduled: scheduledCount,
        totalViews: views,
        retention: retentionSum,
        prevTotalViews: null, // No per-day granularity in audit_reports — delta not available
        prevRetention: null,
        prevTotalProjects: prevProjectCount,
      });

      setIsLoading(false);
    }

    loadDashboardStats();
  }, [user]);

  // ── AI Radar suggestions (rules-based, derived from real queried data) ──
  const suggestions: { icon: string; title: string; body: string }[] = [];

  if (!isLoading) {
    if (!hasAuditData && stats.totalProjects === 0) {
      // Honest empty state for new users with no projects at all
      suggestions.push({
        icon: '📤',
        title: 'Upload your first video',
        body: 'Create a project in Studio and run an audit to unlock personalised suggestions.',
      });
    } else if (!hasAuditData && stats.totalProjects > 0) {
      suggestions.push({
        icon: '📊',
        title: 'Run your first audit',
        body: 'You have projects but no audit data yet. Head to Growth Intelligence to analyse them.',
      });
    } else {
      if (bestProject) {
        suggestions.push({
          icon: '✨',
          title: `Repurpose "${bestProject.title}"`,
          body: 'Your best-performing project this period — convert it into a LinkedIn PDF carousel.',
        });
      }
      if (stats.scheduled === 0) {
        suggestions.push({
          icon: '📅',
          title: 'Nothing scheduled this week',
          body: 'Queue at least one video in the Content Calendar to maintain publishing consistency.',
        });
      }
      if (stats.retention !== null && stats.retention < 50) {
        suggestions.push({
          icon: '⚡',
          title: 'Retention below 50%',
          body: 'Your 3-second retention average is low. Try opening with a stronger hook.',
        });
      }
    }
  }

  // ── Bar chart — no per-day data in schema. Kept for layout, labeled SAMPLE DATA ──
  const barChartData = [
    { day: 'Mon', val: 65, color: 'var(--accent-primary)' },
    { day: 'Tue', val: 82, color: 'var(--accent-primary)' },
    { day: 'Wed', val: 45, color: 'var(--accent-primary)' },
    { day: 'Thu', val: 95, color: 'var(--accent-primary)' },
    { day: 'Fri', val: 78, color: 'var(--accent-primary)' },
    { day: 'Sat', val: 110, color: 'var(--accent-tertiary)' },
    { day: 'Sun', val: 135, color: 'var(--accent-tertiary)' },
  ];

  // ── Delta renderer ────────────────────────────────────────────────────────
  function renderDelta(current: number, prev: number | null): React.ReactNode {
    if (prev === null || prev === 0) return null;
    const pct = Math.round(((current - prev) / prev) * 100);
    const up = pct >= 0;
    return (
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        color: up ? 'var(--accent-primary)' : '#ef4444',
        marginLeft: '0.35rem',
      }}>
        {up ? '↑' : '↓'} {Math.abs(pct)}% vs prev. 30d
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Screen Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Executive Intelligence Dashboard
            </h1>
            <span className="badge badge-neon">REAL-TIME SYNC</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{profile.name || 'Creator'}</strong>.{' '}
            {isLoading
              ? 'Loading your stats…'
              : <><strong>{stats.scheduled} tasks scheduled</strong> this week.</>
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Task 1: wired to 'brain' — the confirmed Creator Brain tab id from sidebar.tsx line 21 */}
          <button onClick={() => setTab('brain')} className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem' }}>
            <span>🧠 Open Creator Brain</span>
          </button>
          <button onClick={() => setTab('studio')} className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            <span>🎥 Enter Studio</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>

        {/* Audience Reach */}
        <div className="card neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audience Reach (30d)</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>public</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.totalViews > 0 ? (stats.totalViews / 1000).toFixed(1) + 'K' : '0'}
            {renderDelta(stats.totalViews, stats.prevTotalViews)}
          </div>
          {/* Task 2: conditional on isLoading — not hardcoded */}
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {isLoading ? 'Syncing…' : 'Last 30 days'}
          </div>
        </div>

        {/* 3-Sec Retention */}
        <div className="card neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>3-Sec Retention Avg</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>visibility</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.retention !== null ? `${stats.retention}%` : '—'}
            {stats.retention !== null && renderDelta(stats.retention, stats.prevRetention)}
          </div>
          {/* Task 3: conditional on real data presence */}
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-tertiary)', fontWeight: 600 }}>
            {isLoading
              ? 'Syncing…'
              : stats.retention === null
                ? 'Run an audit to see retention'
                : stats.retention >= 70
                  ? 'Strong hook performance'
                  : 'Needs a stronger hook'
            }
          </div>
        </div>

        {/* Project Pipeline */}
        <div className="card neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Project Pipeline</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>view_kanban</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.totalProjects || 0}
            {/* Task 9: delta computed from prior-period project creation dates */}
            {renderDelta(stats.totalProjects, stats.prevTotalProjects)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {isLoading ? 'Syncing…' : `${stats.scheduled} ready to publish`}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginTop: '0.5rem' }}>

        {/* Left: Performance Chart — Task 5: SAMPLE DATA badge since no per-day granularity in schema */}
        <div className="card neo-raised" style={{ gridColumn: 'span 8', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>High-Retention Cohort Performance</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Views tracking for top decile short-form content.</p>
            </div>
            {/* Task 6: removed fake Instagram/YouTube badges (no connected accounts in codebase).
                Replaced with a CTA to settings. Decision C: no social connections module exists yet. */}
            <button
              onClick={() => setTab('settings')}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>add_link</span>
              Connect platforms
            </button>
          </div>

          {/* Honest label: sample data, not fabricated as real */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>SAMPLE DATA</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Connect your accounts to see real daily performance
            </span>
          </div>

          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {barChartData.map((bar, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${bar.val}px`, background: bar.color, borderRadius: '6px', transition: 'all 0.3s ease' }}></div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Radar — Tasks 4, 7, 8 */}
        <div className="card neo-raised" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>AI Radar</h3>
            {/* Task 4: badge count = actual suggestions array length, not hardcoded */}
            {!isLoading && (
              <span className="badge badge-neon">
                {suggestions.length > 0 ? `${suggestions.length} ACTIONABLE` : 'ALL CLEAR'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {isLoading ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '0.85rem', background: 'var(--bg-surface-card)', borderRadius: '12px' }}>
                Loading suggestions…
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.85rem', background: 'var(--bg-surface-card)', borderRadius: '12px' }}>
                Nothing to act on right now — keep publishing!
              </div>
            ) : (
              suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface-card)',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    borderLeft: '3px solid var(--accent-primary)',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '2px' }}>
                    {s.icon} {s.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.body}</div>
                </div>
              ))
            )}
          </div>

          {/* Task 8: routes to Studio. Note: no project pre-load — would require
              adding an activeProjectId slot to state-context.tsx, which is cross-module
              state plumbing. Flagged per Decision C; simple navigation used instead. */}
          <button
            onClick={() => setTab('studio')}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }}
          >
            <span>⚡ Run Action</span>
          </button>
        </div>

      </div>

      {/* Decision A placeholder — Idea Studio (out of scope for this phase per product roadmap) */}
      <div className="card neo-raised" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>lightbulb</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>Idea Studio — Coming Soon</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Daily personalised content recommendations, opportunity scoring, and Creator Readiness Score.
          </div>
        </div>
      </div>

    </div>
  );
}
