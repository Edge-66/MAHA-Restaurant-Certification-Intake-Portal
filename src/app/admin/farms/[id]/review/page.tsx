import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import FarmReviewClient from '@/components/FarmReviewClient';
import type { Farm } from '@/lib/types';

export default async function AdminFarmReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_tier, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/login');

  const { data: farm, error } = await supabase.from('farms').select('*').eq('id', id).single();
  if (error || !farm) notFound();

  const { data: pendingRows } = await supabase
    .from('farms')
    .select('id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const pendingQueueIds = (pendingRows ?? []).map((r) => r.id as string);

  return (
    <FarmReviewClient
      farm={farm as Farm}
      pendingQueueIds={pendingQueueIds}
      adminTier={profile?.admin_tier ?? 1}
    />
  );
}
