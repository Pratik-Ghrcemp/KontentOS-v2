"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    async function completeAuth() {
      if (!isSupabaseConfigured()) {
        setMessage('Supabase is not configured.');
        return;
      }

      const code = searchParams.get('code');
      const error = searchParams.get('error_description') || searchParams.get('error');

      if (error) {
        setMessage(error);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setMessage(exchangeError.message);
          return;
        }
      }

      router.replace('/');
    }

    completeAuth();
  }, [router, searchParams]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)', color: 'var(--text-main)' }}>
      <div className="card neo-raised" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>KontentOS</h1>
        <p style={{ color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)', color: 'var(--text-main)' }}>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
