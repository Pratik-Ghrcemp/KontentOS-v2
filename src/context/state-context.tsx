"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'kontentos_app_state_v1';

export interface TrendingSound {
  name: string;
  uses: string;
  energy: string;
}

export interface SampleVideo {
  id: string;
  title: string;
  vibe: string;
  views: string;
  platform: string;
  creator: string;
  hookUsed: string;
  retentionScore: string;
  keyTakeaway: string;
}

export interface GeoLocale {
  code: string;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  defaultLanguages: string[];
  trendingSounds: TrendingSound[];
  sampleVideos: SampleVideo[];
}

export const GEO_LOCALES: Record<string, GeoLocale> = {
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR (₹)',
    symbol: '₹',
    defaultLanguages: ['Hinglish (Hindi + English)', 'English (India)', 'Hindi', 'Tamil', 'Telugu'],
    trendingSounds: [
      { name: 'Bollywood Retro Phonk Beat', uses: '840K reels', energy: 'High Viral' },
      { name: 'Lofi Chai Conversations', uses: '420K reels', energy: 'Calm Aesthetic' },
      { name: 'Desi Street Hustle Brass', uses: '610K reels', energy: 'Motivator' }
    ],
    sampleVideos: [
      {
        id: 'in-1',
        title: 'POV: Bangalore Techie during Monsoon Traffic',
        vibe: 'Daily Rants & POVs',
        views: '2.8M views',
        platform: 'Instagram Reels',
        creator: '@tech_guy_rahul',
        hookUsed: 'If you think Monday blues are bad, try Outer Ring Road at 6 PM...',
        retentionScore: '94%',
        keyTakeaway: 'Fast 1.2s punchline cut + localized city relatable pain point.'
      },
      {
        id: 'in-2',
        title: 'Hostel Maggi Chronicles — Midnight Banter',
        vibe: 'Relatable Comedy & Skits',
        views: '4.1M views',
        platform: 'YouTube Shorts',
        creator: '@desi_hostel_life',
        hookUsed: 'Nobody: ... Literally nobody at 2 AM in room 402:',
        retentionScore: '96%',
        keyTakeaway: 'Immediate comedic sound cue + exaggerated expressive reactions.'
      },
      {
        id: 'in-3',
        title: '3 AI Tools that feel illegal in 2026 (For Freelancers)',
        vibe: 'Pro / Tech & AI',
        views: '1.4M views',
        platform: 'Instagram & LinkedIn',
        creator: '@priya_builds',
        hookUsed: 'Stop searching ChatGPT for client proposals...',
        retentionScore: '89%',
        keyTakeaway: 'High-contrast screen recording + bold yellow kinetic subtitles.'
      }
    ]
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD ($)',
    symbol: '$',
    defaultLanguages: ['English (US)', 'Spanish'],
    trendingSounds: [
      { name: 'Hyperpop Glitch Rush', uses: '1.2M videos', energy: 'High Viral' },
      { name: 'NYC Subway Jazz Ambience', uses: '350K videos', energy: 'Aesthetic' }
    ],
    sampleVideos: [
      {
        id: 'us-1',
        title: 'POV: You work in Big Tech in 2026',
        vibe: 'Daily Rants & POVs',
        views: '3.5M views',
        platform: 'TikTok',
        creator: '@austin_codes',
        hookUsed: 'My manager just sent a Slack ping at 4:59 PM...',
        retentionScore: '92%',
        keyTakeaway: 'Deadpan delivery + zoom-in on facial expression.'
      }
    ]
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP (£)',
    symbol: '£',
    defaultLanguages: ['English (UK)'],
    trendingSounds: [
      { name: 'London Drill Beat Minimal', uses: '480K videos', energy: 'High Viral' }
    ],
    sampleVideos: [
      {
        id: 'uk-1',
        title: 'When someone tries to talk to you on the Tube',
        vibe: 'Relatable Comedy & Skits',
        views: '1.9M views',
        platform: 'Instagram Reels',
        creator: '@oliver_uk',
        hookUsed: 'Tell me you are in London without telling me...',
        retentionScore: '91%',
        keyTakeaway: 'Dry British humor + fast jump cuts.'
      }
    ]
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED ',
    defaultLanguages: ['English (Global)', 'Arabic'],
    trendingSounds: [
      { name: 'Dubai Skyline Synthwave', uses: '290K videos', energy: 'Luxury Mood' }
    ],
    sampleVideos: [
      {
        id: 'ae-1',
        title: 'What $10 gets you in Downtown Dubai vs Marina',
        vibe: 'Aesthetic Mini-Vlogs',
        views: '2.1M views',
        platform: 'Instagram Reels',
        creator: '@dubai_diaries',
        hookUsed: 'You won’t believe what I just found in this cafe...',
        retentionScore: '95%',
        keyTakeaway: 'Crisp 4K drone b-roll + rapid price comparisons.'
      }
    ]
  }
};

function autoDetectGeo(): string {
  if (typeof window === 'undefined') return 'IN';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'IN';
    if (tz.includes('Dubai') || tz.includes('Gulf')) return 'AE';
    if (tz.includes('London') || tz.includes('Europe/London')) return 'UK';
    if (tz.includes('America') || tz.includes('US') || tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) return 'US';
  } catch (e) {
    console.warn('Could not auto-detect timezone', e);
  }
  return 'IN';
}

export interface CreatorProfile {
  name: string;
  handle: string;
  mode: 'viral' | 'pro';
  selectedVibe: string;
  proNiche: string;
  proSubNiche: string;
  language: string;
  voiceArchetype: string;
  hookFormula: string;
  connectedPlatforms: string[];
  includeWatermark: boolean;
  isPro: boolean;
  readinessScore: number;
  customCatchphrase: string;
  bannedWords: string;
  microTags?: string[];
  onboarding_completed?: boolean;
}

export interface StudioIdeaContext {
  id?: string;
  idea: string;
  topic?: string;
  hook?: string;
  targetAudience?: string;
  contentGoal?: string;
  platform?: string;
  suggestedScript?: string;
  source: 'idea_studio' | 'manual';
  createdAt: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  geo: string;
  geoSource: string;
  currentTab: string;
  isSidebarCollapsed: boolean;
  creatorProfile: CreatorProfile;
  studioIdeaContext: StudioIdeaContext | null;
}

const initialDefaultState: AppState = {
  theme: 'light',
  geo: 'IN', // Set static default, updated on client side mount
  geoSource: 'GPS & Timezone (Auto)',
  currentTab: 'dashboard',
  isSidebarCollapsed: false,
  studioIdeaContext: null,
  creatorProfile: {
    name: 'Aman Sharma',
    handle: '@amanshades',
    mode: 'viral',
    selectedVibe: 'Relatable Comedy & Skits',
    proNiche: 'Tech & Startups',
    proSubNiche: 'AI & Machine Learning',
    language: 'Hinglish (Hindi + English)',
    voiceArchetype: 'High-Energy Motivator',
    hookFormula: 'Curiosity Gap ("Nobody is talking about...")',
    connectedPlatforms: ['instagram', 'youtube', 'x', 'threads', 'facebook', 'linkedin'],
    includeWatermark: true,
    isPro: false,
    readinessScore: 98,
    customCatchphrase: 'Bhai suno!',
    bannedWords: 'Synergy, Game-changer, Deep dive'
  }
};

interface StateContextType {
  state: AppState;
  setTheme: (theme: 'light' | 'dark') => void;
  setGeo: (geoCode: string, source?: string) => void;
  setTab: (tabName: string) => void;
  sendIdeaToStudio: (idea: Omit<StudioIdeaContext, 'createdAt'>) => void;
  toggleSidebar: () => void;
  updateProfile: (partialProfile: Partial<CreatorProfile>) => Promise<void>;
  requestGpsLocation: () => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    return {
      ...initialDefaultState,
      geo: 'IN'
    };
  });

  useEffect(() => {
    const detectedGeo = autoDetectGeo();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kontentos_sidebar_collapsed');
      const isCollapsed = stored === 'true';
      setState(prev => ({ ...prev, geo: detectedGeo, isSidebarCollapsed: isCollapsed }));
    } else {
      setState(prev => ({ ...prev, geo: detectedGeo }));
    }
  }, []);

  const toggleSidebar = () => {
    setState(prev => {
      const nextCollapsed = !prev.isSidebarCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kontentos_sidebar_collapsed', String(nextCollapsed));
      }
      return { ...prev, isSidebarCollapsed: nextCollapsed };
    });
  };

  // Sync profile from Supabase when user changes
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      if (user.id === 'admin-super-user') {
        setState(prev => ({
          ...prev,
          theme: 'light',
          creatorProfile: {
            ...prev.creatorProfile,
            name: 'Pratik (Super Admin)',
            handle: '@pratik_admin',
            isPro: true,
            includeWatermark: false,
            onboarding_completed: true,
          },
          currentTab: 'dashboard',
        }));
        document.documentElement.setAttribute('data-theme', 'light');
        return;
      }

      if (isDemoMode() || !isSupabaseConfigured()) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setState(prev => ({
            ...prev,
            theme: (data.theme as 'light'|'dark') || 'light',
            creatorProfile: {
              ...prev.creatorProfile,
              name: data.full_name || prev.creatorProfile.name,
              handle: data.handle || prev.creatorProfile.handle,
              proNiche: data.niche || prev.creatorProfile.proNiche,
              isPro: data.is_pro ?? prev.creatorProfile.isPro,
              includeWatermark: data.watermark_enabled ?? prev.creatorProfile.includeWatermark,
              onboarding_completed: data.onboarding_completed ?? false,
            },
            currentTab: data.onboarding_completed ? 'dashboard' : 'onboarding',
          }));
          document.documentElement.setAttribute('data-theme', data.theme || 'light');
        }
      } catch (err) {
        console.warn('Could not load profile from Supabase:', err);
      }
    }
    loadProfile();
  }, [user]);

  const saveState = (updatedState: AppState) => {
    setState(updatedState);
  };

  const setTheme = async (themeName: 'light' | 'dark') => {
    const updated = { ...state, theme: themeName };
    document.documentElement.setAttribute('data-theme', themeName);
    saveState(updated);
    
    if (user && user.id !== 'admin-super-user' && isSupabaseConfigured() && !isDemoMode()) {
      try {
        await supabase.from('profiles').upsert({ id: user.id, theme: themeName });
      } catch (e) {
        console.warn('Error saving theme to Supabase:', e);
      }
    }
  };

  const setGeo = (geoCode: string, source = 'User Settings') => {
    if (GEO_LOCALES[geoCode]) {
      const updated = { ...state, geo: geoCode, geoSource: source };
      saveState(updated);
    }
  };

  const setTab = (tabName: string) => {
    const updated = {
      ...state,
      currentTab: tabName,
      isSidebarCollapsed: tabName === 'studio' ? true : state.isSidebarCollapsed
    };
    saveState(updated);
  };

  const sendIdeaToStudio = (idea: Omit<StudioIdeaContext, 'createdAt'>) => {
    const updated = {
      ...state,
      currentTab: 'studio',
      isSidebarCollapsed: true,
      studioIdeaContext: {
        ...idea,
        createdAt: new Date().toISOString()
      }
    };
    saveState(updated);
  };

  const calculateReadiness = (p: CreatorProfile) => {
    let score = 70;
    if (p.name && p.handle) score += 10;
    if (p.connectedPlatforms && p.connectedPlatforms.length >= 3) score += 10;
    if (p.language) score += 5;
    if (p.hookFormula) score += 5;
    return Math.min(100, score);
  };

  const updateProfile = async (partialProfile: Partial<CreatorProfile>) => {
    const updatedProfile = {
      ...state.creatorProfile,
      ...partialProfile
    };
    updatedProfile.readinessScore = calculateReadiness(updatedProfile);
    const updated = {
      ...state,
      creatorProfile: updatedProfile
    };
    saveState(updated);

    if (user && user.id !== 'admin-super-user' && isSupabaseConfigured() && !isDemoMode()) {
      try {
        // Map CreatorProfile fields to Supabase columns
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: updatedProfile.name,
          handle: updatedProfile.handle,
          niche: updatedProfile.proNiche,
          is_pro: updatedProfile.isPro,
          watermark_enabled: updatedProfile.includeWatermark,
          onboarding_completed: updatedProfile.onboarding_completed
        });

        if (error) {
          console.warn('Supabase upsert profile error:', error);
        }
      } catch (err) {
        console.warn('Supabase profile update failed:', err);
      }
    }
  };

  const requestGpsLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const detected = autoDetectGeo();
          setGeo(detected, `GPS (Lat: ${pos.coords.latitude.toFixed(2)}, Lng: ${pos.coords.longitude.toFixed(2)})`);
        },
        () => {
          const detected = autoDetectGeo();
          setGeo(detected, 'Browser Timezone (Auto)');
        },
        { timeout: 4000 }
      );
    } else {
      const detected = autoDetectGeo();
      setGeo(detected, 'Browser Timezone (Auto)');
    }
  };

  return (
    <StateContext.Provider value={{
      state,
      setTheme,
      setGeo,
      setTab,
      sendIdeaToStudio,
      toggleSidebar,
      updateProfile,
      requestGpsLocation
    }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
}
