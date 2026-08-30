"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type AuthError, type Session, type User } from '@supabase/supabase-js';
import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

export type UserRole = 'owner' | 'editor' | 'viewer';

export type UserProfile = {
  id: string;
  full_name: string | null;
  handle: string | null;
  role: UserRole;
  theme: 'light' | 'dark' | null;
  is_pro: boolean | null;
  watermark_enabled: boolean | null;
  onboarding_completed: boolean;
};

type AuthResult = {
  error: AuthError | Error | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  authError: string | null;
  canEditContent: boolean;
  canManageDeals: boolean;
  canViewAnalytics: boolean;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
};

const deriveHandle = (email?: string) => {
  return (email?.split('@')[0] || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '_');
};

const demoUser = {
  id: 'demo-user',
  aud: 'authenticated',
  app_metadata: {},
  created_at: new Date(0).toISOString(),
  email: 'creator@example.com',
  user_metadata: { full_name: 'Demo Creator', name: 'Demo Creator' },
} as User;

const demoProfile: UserProfile = {
  id: 'demo-user',
  full_name: 'Demo Creator',
  handle: 'demo_creator',
  role: 'owner',
  theme: 'light',
  is_pro: true,
  watermark_enabled: true,
  onboarding_completed: true,
};

const demoSession = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: demoUser,
} as Session;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const ensureProfile = async (currentUser: User) => {
    setIsProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, handle, role, theme, is_pro, watermark_enabled, onboarding_completed')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      setAuthError(error.message);
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    if (data) {
      setProfile(data as UserProfile);
      setIsProfileLoading(false);
      return;
    }

    const fallbackProfile = {
      id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || deriveHandle(currentUser.email),
      handle: deriveHandle(currentUser.email),
      role: 'owner' as UserRole,
      theme: 'light',
      watermark_enabled: true,
      onboarding_completed: false,
    };

    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(fallbackProfile)
      .select('id, full_name, handle, role, theme, is_pro, watermark_enabled, onboarding_completed')
      .single();

    if (insertError) {
      setAuthError(insertError.message);
      setProfile(null);
    } else {
      setProfile(insertedProfile as UserProfile);
    }

    setIsProfileLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile(user);
    }
  };

  useEffect(() => {
    console.log('AUTH USEFFECT MOUNTED', {isSupabaseConfigured: isSupabaseConfigured(), isDemoMode: isDemoMode()});
    if (!isSupabaseConfigured() || isDemoMode()) {
      setUser(demoUser);
      setSession(demoSession);
      setProfile(demoProfile);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(async ({ data: { session: activeSession }, error }) => {
      if (!isMounted) return;
      if (error) setAuthError(error.message);
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      if (activeSession?.user) {
        await ensureProfile(activeSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthError(null);

      if (nextSession?.user) {
        void ensureProfile(nextSession.user);
      } else {
        setProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase environment variables are missing.') };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    });
    if (error) setAuthError(error.message);
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase environment variables are missing.') };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getRedirectUrl() },
    });
    if (error) setAuthError(error.message);
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase environment variables are missing.') };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase environment variables are missing.') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: { handle: deriveHandle(email) },
      },
    });
    if (error) setAuthError(error.message);
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured() || isDemoMode()) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null };
    }

    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase environment variables are missing.') };
    }

    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
    return { error };
  };

  const permissions = useMemo(() => {
    const role = profile?.role || 'viewer';
    return {
      canEditContent: role === 'owner' || role === 'editor',
      canManageDeals: role === 'owner' || role === 'editor',
      canViewAnalytics: role === 'owner' || role === 'editor' || role === 'viewer',
    };
  }, [profile?.role]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isProfileLoading,
      authError,
      ...permissions,
      signInWithGoogle,
      signInWithMagicLink,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
