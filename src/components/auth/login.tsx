"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase';

type AuthMode = 'signin' | 'signup' | 'magic';

export function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithMagicLink,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const configured = isSupabaseConfigured();

  const handleAuthResult = (error: Error | null, successText: string) => {
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: successText, type: 'success' });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'magic') {
      const { error } = await signInWithMagicLink(email);
      handleAuthResult(error, 'Magic link sent. Check your email to continue.');
    } else if (mode === 'signup') {
      const { error } = await signUpWithEmail(email, password);
      handleAuthResult(error, 'Account created successfully.');
    } else {
      const { error } = await signInWithEmail(email, password);
      handleAuthResult(error, 'Signed in successfully.');
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    if (!configured) {
      setMessage({ text: 'Supabase environment variables are missing. Google sign-in cannot start.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setMessage({ text: `${error.message}. Check the Google provider and redirect URLs in Supabase.`, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">K</div>
          <div>
            <h1>KontentOS</h1>
            <p>The AI Creator Operating System</p>
          </div>
        </div>

        {!configured && (
          <div className="auth-config-warning">
            Missing Supabase config. Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then restart Next.js.
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={!configured || loading}
          className="auth-google-button"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or use email</span></div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          {[
            { id: 'signin', label: 'Sign in', icon: LogIn },
            { id: 'signup', label: 'Sign up', icon: UserPlus },
            { id: 'magic', label: 'Magic link', icon: Mail },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={mode === item.id ? 'active' : ''}
                onClick={() => {
                  setMode(item.id as AuthMode);
                  setMessage(null);
                }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              required
              placeholder="admin@kontentos.ai or your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {mode !== 'magic' && (
            <label>
              Password
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="admin123 or minimum 6 chars"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(prev => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          )}

          <button type="submit" disabled={loading} className="auth-submit">
            <KeyRound size={16} />
            {loading ? 'Signing in...' : mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
          </button>
        </form>

        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </section>
    </div>
  );
}
