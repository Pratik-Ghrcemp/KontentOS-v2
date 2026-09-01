"use client";

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useAppState } from '@/context/state-context';

export function Sidebar({ type }: { type: 'desktop' | 'mobile' }) {
  const { state, setTab, toggleSidebar } = useAppState();
  const { canEditContent, canManageDeals, canViewAnalytics, profile: authProfile } = useAuth();
  const profile = state.creatorProfile;
  const currentTab = state.currentTab;
  const isCollapsed = state.isSidebarCollapsed;

  const menuItems = [
    { id: 'dashboard', label: 'Intelligence Dashboard', icon: 'dashboard', short: 'Dashboard', allowed: canViewAnalytics },
    { id: 'studio', label: 'Studio Hub', icon: 'movie_edit', short: 'Studio', allowed: canEditContent },
    { id: 'growth', label: 'Growth Intelligence', icon: 'trending_up', short: 'Growth', allowed: canViewAnalytics },
    { id: 'calendar', label: 'Content Calendar', icon: 'calendar_month', short: 'Calendar', allowed: canEditContent },
    { id: 'monetization', label: 'Monetization Hub', icon: 'payments', short: 'Monetize', allowed: canManageDeals },
    { id: 'audience', label: 'Audience CRM', icon: 'group', short: 'Audience', allowed: canViewAnalytics },
    { id: 'media_kit', label: 'Media Kit', icon: 'badge', short: 'Media Kit', allowed: canViewAnalytics },
    { id: 'brain', label: 'Creator Brain', icon: 'psychology', short: 'Brain', allowed: canEditContent },
    { id: 'settings', label: 'User Settings', icon: 'settings', short: 'Settings', allowed: true },
  ].filter(item => item.allowed);

  if (type === 'desktop') {
    return (
      <aside className={`desktop-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Header Brand Area */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', flexDirection: isCollapsed ? 'column' : 'row', gap: isCollapsed ? '0.5rem' : 0, marginBottom: '1.5rem', padding: '0.5rem 0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--bg-surface-card)', boxShadow: 'var(--shadow-neo-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                K
              </div>
              {!isCollapsed && (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>KontentOS</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>Studio White Edition</div>
                </div>
              )}
            </div>

            <button
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '8px',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {menuItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab={item.id}
                  data-testid={`sidebar-tab-${item.id}`}
                  onClick={() => setTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'} nav-menu-btn`}
                  style={{
                    width: '100%',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? '800' : '600',
                    ...(isActive ? { boxShadow: '0 4px 14px var(--accent-primary-glow)' } : { boxShadow: 'none', background: 'transparent' })
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.15rem', flexShrink: 0 }}>{item.icon}</span>
                  {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div
          onClick={() => setTab('settings')}
          style={{
            cursor: 'pointer',
            padding: '0.75rem',
            borderRadius: '14px',
            background: 'var(--bg-surface-card)',
            boxShadow: 'var(--shadow-neo-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: isCollapsed ? 0 : '0.65rem'
          }}
          title={isCollapsed ? `${profile.name || authProfile?.full_name || 'Creator'} (${authProfile?.role || 'owner'})` : "Click to open User Settings"}
        >
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {(profile.name || authProfile?.full_name || 'C').charAt(0)}
          </div>
          {!isCollapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.name || authProfile?.full_name || 'Creator Name'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {authProfile?.role || 'owner'} - {profile.isPro ? 'Pro Creator' : 'Free Tier'}
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>tune</span>
            </>
          )}
        </div>
      </aside>
    );
  }

  const mobileItems = menuItems.slice(0, 5);
  return (
    <nav className="mobile-bottom-nav">
      {mobileItems.map(item => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span>{item.short}</span>
          </button>
        );
      })}
    </nav>
  );
}
