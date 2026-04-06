import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client for admin-only operations (e.g. creating users on application submit).
 * Requires SUPABASE_SERVICE_ROLE_KEY in the server environment — never expose to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
