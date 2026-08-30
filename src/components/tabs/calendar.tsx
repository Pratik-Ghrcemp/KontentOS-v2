"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

type CalendarPost = {
  id: string;
  day: string;
  time: string;
  platform: string;
  badgeClass: string;
  title: string;
  status: string;
  reachEst: string;
};

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Calendar() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('week');
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    platform: 'Instagram Reels',
    scheduledFor: '',
  });

  const fetchProjects = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (isDemoMode() || !isSupabaseConfigured()) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true });

    setPosts((data || []).map((project) => {
      const date = project.scheduled_for ? new Date(project.scheduled_for) : new Date(project.created_at);
      return {
        id: project.id,
        day: days[date.getDay()],
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        platform: project.platforms_targeted?.[0] || 'Omni-Channel',
        badgeClass: 'badge-purple',
        title: project.title,
        status: project.status || 'queued',
        reachEst: 'Estimating...',
      };
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleScheduleNew = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !form.title || !form.scheduledFor) return;
    setSaving(true);

    if (isDemoMode() || !isSupabaseConfigured()) {
      const date = new Date(form.scheduledFor);
      setPosts(prev => [...prev, {
        id: crypto.randomUUID(),
        day: days[date.getDay()],
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        platform: form.platform,
        badgeClass: 'badge-purple',
        title: form.title,
        status: 'queued',
        reachEst: 'Demo',
      }]);
      setForm({ title: '', platform: 'Instagram Reels', scheduledFor: '' });
      setSaving(false);
      return;
    }

    await supabase.from('projects').insert({
      user_id: user.id,
      title: form.title,
      status: 'queued',
      scheduled_for: new Date(form.scheduledFor).toISOString(),
      platforms_targeted: [form.platform],
    });

    setForm({ title: '', platform: 'Instagram Reels', scheduledFor: '' });
    await fetchProjects();
    setSaving(false);
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Omni-Channel Content Calendar
            </h1>
            <span className="badge badge-neon">6 PLATFORMS SYNCED</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Schedule real queued posts into Supabase and track platform-ready publishing windows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface-card)', padding: '3px', borderRadius: '12px', gap: '3px', border: '1px solid var(--border-subtle)' }}>
            {['week', 'month', 'queue'].map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`btn ${activeView === view ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => document.getElementById('schedule-post-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="btn btn-primary">
            + Schedule New
          </button>
        </div>
      </div>

      <div className="bento-grid">
        <div className="card neo-raised" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Publishing Pipeline</h3>
            {loading && <span className="badge badge-cyan">Syncing with DB...</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            {!loading && posts.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                No scheduled posts yet. Add your first queued post from the scheduling form.
              </div>
            )}

            {posts.map((post) => (
              <div key={post.id} style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
                <div style={{ width: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary-glow)', border: '2px solid var(--bg-surface-card)' }} />
                </div>

                <div style={{ flex: 1, background: 'var(--bg-surface-low)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-primary)', width: '80px' }}>{post.day}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-base)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>{post.time}</div>
                    </div>
                    <span className={`badge ${post.badgeClass}`}>{post.platform}</span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{post.title}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: post.status === 'published' ? '#10b981' : '#f59e0b' }}>{post.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reach Est: {post.reachEst}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card neo-raised">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>AI Publishing Optimization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {['Instagram Reels: Tue, 7:15 PM', 'LinkedIn: Wed, 8:00 AM', 'YouTube Shorts: Fri, 4:30 PM'].map(item => (
                <div key={item} style={{ background: 'var(--bg-surface-low)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>{item}</div>
              ))}
            </div>
          </div>

          <div className="card neo-pressed" style={{ background: 'var(--accent-primary-glow)', border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>Schedule a Post</h3>
            <form id="schedule-post-form" onSubmit={handleScheduleNew} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input className="form-input" placeholder="Post title" value={form.title} onChange={(event) => setForm(prev => ({ ...prev, title: event.target.value }))} required />
              <select className="form-select" value={form.platform} onChange={(event) => setForm(prev => ({ ...prev, platform: event.target.value }))}>
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
                <option>LinkedIn</option>
                <option>TikTok</option>
                <option>X</option>
              </select>
              <input className="form-input" type="datetime-local" value={form.scheduledFor} onChange={(event) => setForm(prev => ({ ...prev, scheduledFor: event.target.value }))} required />
              <button className="btn btn-primary" disabled={saving} style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem' }}>
                {saving ? 'Saving...' : 'Queue Post'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
