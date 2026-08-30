"use client";

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/context/state-context';
import { useAuth } from '@/context/auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

const templateIdeas = [
  {
    id: 'template-1',
    category: 'viral',
    badge: 'TEMPLATE',
    badge_color: 'badge-cyan',
    title: 'POV: Trying to explain your remote internet job to family in 2026',
    hook_tip: 'Start with an exaggerated wide-eye stare. Cut rapidly between confusing tech buzzwords.',
    format: '15s POV Skit',
    velocity: '+94%',
    isTemplate: true,
  },
];

export function IdeaStudio() {
  const { state, setTab } = useAppState();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchIdeas = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (isDemoMode() || !isSupabaseConfigured()) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('ai_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setIdeas(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const combinedIdeas = [...ideas, ...templateIdeas];
  const filteredIdeas = activeFilter === 'all'
    ? combinedIdeas
    : combinedIdeas.filter(i => i.category === activeFilter);

  const regenerate = async () => {
    if (!user) return;
    setGenerating(true);

    const niche = state.creatorProfile.proNiche || 'Tech';
    if (isDemoMode() || !isSupabaseConfigured()) {
      setIdeas(prev => [{
        id: crypto.randomUUID(),
        category: 'viral',
        badge: 'AI GENERATED',
        badge_color: 'badge-purple',
        title: `The 3 ${niche} Secrets Nobody Talks About in 2026`,
        hook_tip: `Use negative framing: "Stop doing X in ${niche}..." and jump straight into point 1.`,
        format: '30s Fast Hook',
        velocity: '+99%',
      }, ...prev]);
      setGenerating(false);
      return;
    }

    await supabase.from('ai_ideas').insert({
      user_id: user.id,
      category: 'viral',
      badge: 'AI GENERATED',
      badge_color: 'badge-purple',
      title: `The 3 ${niche} Secrets Nobody Talks About in 2026`,
      hook_tip: `Use negative framing: "Stop doing X in ${niche}..." and jump straight into point 1.`,
      format: '30s Fast Hook',
      velocity: '+99%',
    });

    await fetchIdeas();
    setGenerating(false);
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Creator Radar & Idea Studio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Real-time viral benchmarks, high-retention prompts, and hook execution tips.
          </p>
        </div>
        <button onClick={() => setTab('studio')} className="btn btn-primary">
          Drop Raw Video
        </button>
      </div>

      <div className="card neo-raised">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create This Today</h2>
            <span className="badge badge-purple">{filteredIdeas.length} PROMPTS</span>
            {loading && <span className="badge badge-cyan">SYNCING</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {['all', 'comedy', 'viral', 'tech', 'finance'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`btn ${activeFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem', borderRadius: '999px' }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
            <button onClick={regenerate} disabled={generating} className="btn btn-primary">
              {generating ? 'Generating Ideas...' : 'Generate AI Ideas'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
          {filteredIdeas.map((idea, idx) => (
            <div key={idea.id || idx} className="card neo-raised" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: idea.isTemplate ? '1px dashed var(--border-subtle)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className={`badge ${idea.badge_color || 'badge-cyan'}`}>{idea.badge || 'IDEA'}</span>
                {idea.isTemplate && <span className="badge badge-green">TEMPLATE LIBRARY</span>}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35, minHeight: '3rem' }}>{idea.title}</h3>
              <div style={{ background: 'var(--bg-surface-card)', padding: '0.85rem', borderRadius: '8px', borderLeft: '2px solid var(--accent-primary)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-main)' }}>Hook Tip:</strong> {idea.hook_tip}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{idea.format}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 800 }}>{idea.velocity} Velo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
