"use client";

import React from 'react';
import { LoginScreen } from '@/components/auth/login';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { Audience } from '@/components/tabs/audience';
import { Calendar } from '@/components/tabs/calendar';
import { CreatorBrain } from '@/components/tabs/creator-brain';
import { Dashboard } from '@/components/tabs/dashboard';
import { GrowthHub } from '@/components/tabs/growth-hub';
import { IdeaStudio } from '@/components/tabs/idea-studio';
import { MediaKit } from '@/components/tabs/media-kit';
import { Monetization } from '@/components/tabs/monetization';
import { Onboarding } from '@/components/tabs/onboarding';
import { RawStudio } from '@/components/tabs/raw-studio';
import { Settings } from '@/components/tabs/settings';
import { useAuth } from '@/context/auth-context';
import { useAppState } from '@/context/state-context';

export default function KontentOSApp() {
  const { state, setTab } = useAppState();
  const { session, isLoading, isProfileLoading, profile, authError, canEditContent, canManageDeals, canViewAnalytics } = useAuth();
  const tab = state.currentTab;
  const onboardingCompleted = Boolean(profile?.onboarding_completed || state.creatorProfile.onboarding_completed);

  React.useEffect(() => {
    if (profile && !onboardingCompleted && tab !== 'onboarding') {
      setTab('onboarding');
    }
  }, [profile, onboardingCompleted, tab, setTab]);

  const renderActiveView = () => {
    switch (tab) {
      case 'dashboard':
        return canViewAnalytics ? <Dashboard /> : <MediaKit />;
      case 'onboarding':
        return <Onboarding />;
      case 'brain':
        return canEditContent ? <CreatorBrain /> : <MediaKit />;
      case 'idea_studio':
        return canEditContent ? <IdeaStudio /> : <MediaKit />;
      case 'studio':
        return canEditContent ? <RawStudio /> : <MediaKit />;
      case 'growth':
        return canViewAnalytics ? <GrowthHub /> : <MediaKit />;
      case 'calendar':
        return canEditContent ? <Calendar /> : <MediaKit />;
      case 'monetization':
        return canManageDeals ? <Monetization /> : <MediaKit />;
      case 'audience':
        return canViewAnalytics ? <Audience /> : <MediaKit />;
      case 'media_kit':
        return <MediaKit />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <span style={{ fontSize: '1rem', fontWeight: 800 }}>Loading KontentOS...</span>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  if (authError && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background" style={{ padding: '1rem' }}>
        <div className="card neo-raised" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.5rem' }}>Workspace setup needs attention</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            KontentOS signed you in, but your Supabase schema is not ready yet.
          </p>
          <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', textAlign: 'left' }}>
            {authError}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '1rem' }}>
            Run the Supabase migrations, then refresh the app.
          </p>
        </div>
      </div>
    );
  }

  if (isProfileLoading || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <span style={{ fontSize: '1rem', fontWeight: 800 }}>Preparing your creator workspace...</span>
      </div>
    );
  }

  const isCollapsed = state.isSidebarCollapsed;

  return (
    <div style={{ display: 'flex', width: '100%', height: tab === 'studio' ? '100vh' : undefined, minHeight: tab === 'studio' ? undefined : '100vh', overflow: tab === 'studio' ? 'hidden' : undefined, ['--sidebar-width' as any]: isCollapsed ? '68px' : '240px' }}>
      <Sidebar type="desktop" />
      <div className={`main-viewport ${tab === 'studio' ? 'studio-mode' : ''}`} style={{ height: tab === 'studio' ? '100vh' : undefined, minHeight: tab === 'studio' ? 0 : undefined, overflow: tab === 'studio' ? 'hidden' : undefined }}>
        {tab !== 'studio' && (
          <header id="topbar-container">
            <TopBar />
          </header>
        )}
        <main id="active-view-container" style={{ padding: tab === 'studio' ? 0 : undefined, height: tab === 'studio' ? '100vh' : undefined, maxWidth: tab === 'studio' ? 'none' : undefined, margin: tab === 'studio' ? 0 : undefined, width: '100%', overflow: tab === 'studio' ? 'hidden' : undefined, display: tab === 'studio' ? 'flex' : undefined, flexDirection: tab === 'studio' ? 'column' : undefined }}>
          {renderActiveView()}
        </main>
      </div>
      <Sidebar type="mobile" />
    </div>
  );
}
