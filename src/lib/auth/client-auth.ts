import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Returns standard headers including the active Supabase JWT Bearer token if available.
 */
export async function getClientAuthHeaders(extraHeaders?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {})
  };

  if (typeof window !== 'undefined' && isSupabaseConfigured()) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // fallback to unauthenticated or demo mode
    }
  }

  return headers;
}
