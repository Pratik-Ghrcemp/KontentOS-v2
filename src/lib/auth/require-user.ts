import { isDemoMode, isSupabaseConfigured, createAuthedSupabaseClient } from '@/lib/supabase';

export const DEMO_USER_ID = 'demo-user';
export const UNAUTHORIZED_BODY = { error: 'Unauthorized' } as const;

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  return authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;
}

export async function getAuthedContext(request: Request): Promise<{ userId: string; token: string | null } | null> {
  const token = getAuthToken(request);

  if (isDemoMode() || !isSupabaseConfigured()) {
    return { userId: DEMO_USER_ID, token: null };
  }

  if (!token) return null;

  try {
    const client = createAuthedSupabaseClient(token);
    const { data, error } = await client.auth.getUser(token);
    if (!error && data?.user) {
      return { userId: data.user.id, token };
    }
  } catch (e) {
    // token verification failed
  }

  return null;
}

export async function getAuthedUserId(request: Request): Promise<string | null> {
  const ctx = await getAuthedContext(request);
  return ctx ? ctx.userId : null;
}
