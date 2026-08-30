"use client";

import React, { useState } from 'react';
import { useAppState } from '@/context/state-context';
import { Settings as SettingsIcon, RefreshCw, Save } from 'lucide-react';

export function Settings() {
  const { state, setTab, updateProfile } = useAppState();
  const profile = state.creatorProfile;

  const [name, setName] = useState(profile.name || '');
  const [handle, setHandle] = useState(profile.handle || '');
  const [watermark, setWatermark] = useState(profile.includeWatermark ?? true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({
        name,
        handle,
        includeWatermark: watermark
      });
      setSaveMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (e) {
      setSaveMessage({ text: 'Failed to save settings.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1050px', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              <SettingsIcon size={32} /> User Settings
            </h1>
            <span className="badge badge-purple">{profile.isPro ? 'PRO ACCOUNT' : 'FREE TIER'}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage your user profile, onboarding parameters, connected platforms, and appearance theme.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {saveMessage && (
            <span style={{ color: saveMessage.type === 'success' ? 'var(--accent-primary)' : 'red', fontSize: '0.85rem' }}>
              {saveMessage.text}
            </span>
          )}
          <button onClick={() => setTab('onboarding')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> <span>Re-run Onboarding</span>
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            <Save size={14} /> <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      <div className="bento-grid" style={{ gap: '1.5rem' }}>
        
        {/* TOP PROMINENT CARD: Watermark & Pro Upgrade Engine */}
        <div className="card card-glow" style={{ gridColumn: 'span 12', background: 'linear-gradient(135deg, var(--bg-surface-card), var(--bg-surface-high))', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              ⚡
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>"Made with KontentOS" Watermark</strong>
                <span className={`badge ${profile.isPro ? 'badge-neon' : 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>
                  {profile.isPro ? '👑 PRO UNLOCKED' : 'FREE TIER ACTIVE'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {profile.isPro 
                  ? 'You are on Creator Pro. Watermarks are disabled across all 4K video exports.' 
                  : 'Watermark is added to Free exports. Toggle off to upgrade to Creator Pro.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              {watermark ? 'Watermark Enabled' : 'Watermark Disabled'}
            </span>
            <label className="toggle-switch" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <input type="checkbox" checked={watermark} disabled={true} />
              <span className="toggle-slider"></span>
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Manage in Brand Kit under Studio Hub)</span>
          </div>
        </div>

        {/* Identity & Social Presences */}
        <div className="card neo-raised" style={{ gridColumn: 'span 12' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Creator Identity & Core Setup</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Creator / Brand Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ali Abdaal" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Primary Social Handle</label>
              <input type="text" className="input-field" value={handle} onChange={e => setHandle(e.target.value)} placeholder="e.g. @aliabdaal" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Target Operating Niche</label>
              <input type="text" className="input-field" value={profile.proNiche || ''} disabled style={{ opacity: 0.6 }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>To change your core niche, re-run the Onboarding Wizard.</div>
            </div>
          </div>
        </div>

        {/* Global Regional Settings */}
        <div className="card neo-raised" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Global Audience Targeting</h3>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>GEO Locale & Default Currency</label>
            <select className="input-field" defaultValue={state.geo} disabled>
              <option value="IN">India (₹ INR)</option>
              <option value="US">United States ($ USD)</option>
              <option value="UK">United Kingdom (£ GBP)</option>
              <option value="AE">UAE (د.إ AED)</option>
            </select>
          </div>
        </div>

        {/* Appearance & Advanced UI */}
        <div className="card neo-raised" style={{ gridColumn: 'span 6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Appearance & UI Theme</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-surface-low)', padding: '1rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>{state.theme === 'light' ? '☀️' : '🌙'}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{state.theme === 'light' ? 'Sahara Linen (Light)' : 'Midnight Obsidian (Dark)'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Use the Topbar toggle to switch themes globally.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
