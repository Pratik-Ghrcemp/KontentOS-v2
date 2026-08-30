import { isDemoMode, isSupabaseConfigured, supabase } from '@/lib/supabase';

export const DEMO_USER_ID = 'demo-user';
export const UNAUTHORIZED_BODY = { error: 'Unauthorized' } as const;

export async function getAuthedUserId(request: Request): Promise<string | null> {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return DEMO_USER_ID;
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user.id;
}
