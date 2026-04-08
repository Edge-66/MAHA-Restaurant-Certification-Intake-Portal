'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type AdminAuditInput = {
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

function bestEffortIp(h: Headers): string | null {
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return h.get('x-real-ip') || null;
}

export async function logAdminAction(input: AdminAuditInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, admin_tier')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') return;

    const h = await headers();
    const ipAddress = bestEffortIp(h);
    const userAgent = h.get('user-agent');

    const admin = createAdminClient();
    await admin.from('admin_logs').insert({
      admin_user_id: user.id,
      admin_email: user.email ?? null,
      admin_tier: profile.admin_tier ?? 1,
      action: input.action,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: input.metadata ?? null,
    });

    // Enforce rolling retention (best effort) without cron.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from('admin_logs').delete().lt('created_at', cutoff);
  } catch {
    // Never block admin workflow if logging fails.
  }
}
