"use client";

import React from 'react';
import { useAppState } from '@/context/state-context';

export function TopBar() {
  const { state, setTheme, setTab } = useAppState();
  const profile = state.creatorProfile;
  const isDark = state.theme === 'dark';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%' }}>
      {/* Left: Breadcrumb / Active Screen Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div 
          style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} 
          onClick={() => setTab('dashboard')}
        >
          <span style={{ color: 'var(--accent-primary)' }}>⚡</span>
          <span>KontentOS</span>
          <span className="badge badge-neon" style={{ fontSize: '0.62rem' }}>STUDIO WHITE V3</span>
        </div>
      </div>

      {/* Right: Search, Theme Switcher, Quick Create, User Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Theme Toggle Button */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', borderRadius: '999px' }} 
          title="Switch Studio White / Midnight Dark"
        >
          <span>{isDark ? '☀️ Studio White' : '🌙 Midnight Dark'}</span>
        </button>

        {/* Quick Create CTA Button */}
        <button 
          onClick={() => setTab('studio')}
          className="btn btn-primary" 
          style={{ padding: '0.45rem 1.15rem', fontSize: '0.85rem' }}
        >
          <span>⚡ Studio Hub</span>
        </button>

        {/* User Profile Pill */}
        <div 
          onClick={() => setTab('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '999px', background: 'var(--bg-surface-card)', boxShadow: 'var(--shadow-neo-raised-sm)' }} 
          title="Open User Settings"
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(profile.name || 'C').charAt(0)}
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', paddingRight: '4px' }}>
            {(profile.name || 'Creator').split(' ')[0]}
          </span>
        </div>
      </div>
    </div>
  );
}
