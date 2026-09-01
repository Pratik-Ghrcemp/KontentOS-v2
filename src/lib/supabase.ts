import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

export const isDemoMode = () => {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
};

export const supabase = createClient(
  supabaseUrl || 'https://missing-config.supabase.co',
  supabaseAnonKey || 'missing-anon-key'
);

/**
 * Creates an authenticated Supabase client using the request's Bearer JWT.
 * This guarantees RLS policies (auth.uid() = user_id) succeed on the server.
 */
export function createAuthedSupabaseClient(token?: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://missing-config.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key';

  return createClient(url, key, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
