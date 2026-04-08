import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Farm } from '@/lib/types';

function logDirectory(where: string, message: string, isError = false) {
  if (process.env.NODE_ENV !== 'development') return;
  if (isError) console.error(`[directory-farms] ${where}:`, message);
  else console.log(`[directory-farms] ${where}:`, message);
}

/**
 * Public directory must list approved farms even when RLS policies are missing or
 * misconfigured for the anon key. Uses the service role only on the server and only
 * with an explicit status filter — never expose non-approved rows to the client.
 */
export async function fetchApprovedFarmsForDirectory(): Promise<Farm[]> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('farms')
        .select('*')
        .order('name');
      if (error) {
        logDirectory('service_role error', error.message, true);
      } else {
        const rows = ((data ?? []) as Farm[]).filter(
          (f) => (f.status ?? '').trim().toLowerCase() === 'approved'
        );
        logDirectory('service_role OK', `${rows.length} approved farms loaded`);
        return rows;
      }
    } catch (e) {
      logDirectory('service_role exception', e instanceof Error ? e.message : String(e), true);
    }
  } else {
    logDirectory(
      'env',
      'SUPABASE_SERVICE_ROLE_KEY missing — using anon key only (RLS must allow SELECT on approved farms).',
      true
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .order('name');
  if (error) logDirectory('anon error', error.message, true);
  const rows = ((data ?? []) as Farm[]).filter(
    (f) => (f.status ?? '').trim().toLowerCase() === 'approved'
  );
  logDirectory('anon result', `${rows.length} approved farms loaded`);
  return rows;
}

/** Load one farm by id for a public profile page; caller must enforce approved-only. */
export async function fetchFarmByIdForPublicProfile(id: string): Promise<Farm | null> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.from('farms').select('*').eq('id', id).maybeSingle();
      if (error) logDirectory('service_role single error', error.message, true);
      else return data as Farm | null;
    } catch (e) {
      logDirectory('service_role single exception', e instanceof Error ? e.message : String(e), true);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('farms').select('*').eq('id', id).maybeSingle();
  if (error) logDirectory('anon single error', error.message, true);
  return data as Farm | null;
}
