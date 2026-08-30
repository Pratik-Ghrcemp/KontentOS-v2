"use client";

import React, { useEffect, useState } from 'react';
import { useAppState } from '@/context/state-context';
import { useAuth } from '@/context/auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

type BrandDeal = {
  id: string;
  brand_name: string;
  deal_amount: number;
  status: string;
  deliverables?: string[] | null;
};

export function Monetization() {
  const { state } = useAppState();
  const { user } = useAuth();
  const profile = state.creatorProfile;
  const [customViews, setCustomViews] = useState(50000);
  const [customCpm, setCustomCpm] = useState(35);
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [stats, setStats] = useState({ closed: 0, pipeline: 0, count: 0 });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    brandName: '',
    dealAmount: '',
    status: 'negotiating',
    deliverables: '1x Reel, 1x LinkedIn Carousel',
  });

  const calculateStats = (items: BrandDeal[]) => {
    const closed = items
      .filter(deal => deal.status === 'invoiced' || deal.status === 'paid')
      .reduce((sum, deal) => sum + Number(deal.deal_amount || 0), 0);
    const pipeline = items
      .filter(deal => deal.status === 'negotiating' || deal.status === 'production')
      .reduce((sum, deal) => sum + Number(deal.deal_amount || 0), 0);
    const count = items.filter(deal => deal.status === 'negotiating' || deal.status === 'production').length;
    setStats({ closed, pipeline, count });
  };

  const loadDeals = React.useCallback(async () => {
    if (!user) return;
    if (isDemoMode() || !isSupabaseConfigured()) {
      setDeals([]);
      calculateStats([]);
      return;
    }

    const { data } = await supabase
      .from('brand_deals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rows = (data || []) as BrandDeal[];
    setDeals(rows);
    calculateStats(rows);
  }, [user]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleNewDeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !form.brandName || !form.dealAmount) return;
    setSaving(true);

    if (isDemoMode() || !isSupabaseConfigured()) {
      const nextDeal: BrandDeal = {
        id: crypto.randomUUID(),
        brand_name: form.brandName,
        deal_amount: Number(form.dealAmount),
        status: form.status,
        deliverables: form.deliverables.split(',').map(item => item.trim()).filter(Boolean),
      };
      const nextDeals = [nextDeal, ...deals];
      setDeals(nextDeals);
      calculateStats(nextDeals);
      setForm({ brandName: '', dealAmount: '', status: 'negotiating', deliverables: '1x Reel, 1x LinkedIn Carousel' });
      setSaving(false);
      return;
    }

    await supabase.from('brand_deals').insert({
      user_id: user.id,
      brand_name: form.brandName,
      deal_amount: Number(form.dealAmount),
      status: form.status,
      deliverables: form.deliverables.split(',').map(item => item.trim()).filter(Boolean),
    });

    setForm({ brandName: '', dealAmount: '', status: 'negotiating', deliverables: '1x Reel, 1x LinkedIn Carousel' });
    await loadDeals();
    setSaving(false);
  };

  const calculateBundleRate = (views: number, cpm: number) => {
    const baseReel = (views / 1000) * cpm;
    const dedicatedVideo = baseReel * 2.2;
    const newsletterSponsor = 1200;
    const fullBundle = (baseReel + dedicatedVideo + newsletterSponsor) * 0.85;
    return {
      reel: Math.round(baseReel),
      dedicated: Math.round(dedicatedVideo),
      newsletter: newsletterSponsor,
      bundle: Math.round(fullBundle),
    };
  };

  const rates = calculateBundleRate(customViews, customCpm);

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>Monetization Command Center</h1>
            <span className="badge badge-purple">DEALS CRM & RATE CARD</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage brand partnerships, calculate rate cards, and track real creator revenue records.
          </p>
        </div>
        <button onClick={() => document.getElementById('new-deal-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="btn btn-primary">
          + New Brand Deal
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          ['Closed Revenue (YTD)', `$${stats.closed.toLocaleString()}`, 'Real-time invoiced tracking'],
          ['Active Pipeline', `$${stats.pipeline.toLocaleString()}`, `Avg deal size: $${stats.count > 0 ? Math.round(stats.pipeline / stats.count).toLocaleString() : 0}`],
          ['Creator CPM Benchmark', `$${customCpm.toFixed(2)}`, `Niche: ${profile.proNiche || 'Tech & AI'}`],
          ['90-Day Projection', `$${(stats.closed + stats.pipeline + 12000).toLocaleString()}`, 'Based on current pipeline velocity'],
        ].map(([label, value, caption]) => (
          <div key={label} className="card neo-raised" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, margin: '0.5rem 0 0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{caption}</div>
          </div>
        ))}
      </div>

      <div className="bento-grid">
        <div className="card neo-raised" style={{ gridColumn: 'span 7' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Active Deal CRM Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {deals.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                No active deals in pipeline. Add your first brand deal with the form.
              </div>
            )}

            {deals.map(deal => (
              <div key={deal.id} style={{ background: 'var(--bg-surface-low)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{deal.brand_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{deal.deliverables?.join(' + ') || 'Custom deliverables'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: deal.status === 'invoiced' || deal.status === 'paid' ? 'var(--text-main)' : 'var(--accent-primary)' }}>${Number(deal.deal_amount || 0).toLocaleString()}</div>
                  <div className={`badge ${deal.status === 'paid' || deal.status === 'invoiced' ? 'badge-green' : deal.status === 'production' ? 'badge-purple' : 'badge-neon'}`} style={{ fontSize: '0.6rem' }}>
                    {deal.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card neo-pressed" style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>New Deal</h3>
            <form id="new-deal-form" onSubmit={handleNewDeal} style={{ display: 'grid', gap: '0.75rem' }}>
              <input className="form-input" placeholder="Brand name" value={form.brandName} onChange={(event) => setForm(prev => ({ ...prev, brandName: event.target.value }))} required />
              <input className="form-input" type="number" min="0" step="100" placeholder="Deal amount" value={form.dealAmount} onChange={(event) => setForm(prev => ({ ...prev, dealAmount: event.target.value }))} required />
              <select className="form-select" value={form.status} onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value }))}>
                <option value="negotiating">Negotiating</option>
                <option value="production">Production</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
              </select>
              <input className="form-input" placeholder="Deliverables, comma separated" value={form.deliverables} onChange={(event) => setForm(prev => ({ ...prev, deliverables: event.target.value }))} />
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Deal'}</button>
            </form>
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>Dynamic Rate Card</h3>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>Avg Views per Post</span><span>{customViews.toLocaleString()}</span>
            </label>
            <input type="range" min="10000" max="500000" step="5000" value={customViews} onChange={e => setCustomViews(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)', marginBottom: '1rem' }} />
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>Target CPM ($)</span><span>${customCpm}</span>
            </label>
            <input type="range" min="10" max="100" step="1" value={customCpm} onChange={e => setCustomCpm(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)', marginBottom: '1rem' }} />
            <div style={{ background: 'var(--bg-base)', borderRadius: '12px', padding: '1rem', display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1x Instagram Reel</span><strong>${rates.reel.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>1x Dedicated YT Video</span><strong>${rates.dedicated.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Newsletter Shoutout</span><strong>${rates.newsletter.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.75rem', color: 'var(--accent-primary)' }}><strong>Premium Bundle</strong><strong>${rates.bundle.toLocaleString()}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
