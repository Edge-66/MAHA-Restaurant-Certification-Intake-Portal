import AdminSidebar from '@/components/AdminSidebar';
import AdminSessionTracker from '@/components/AdminSessionTracker';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_tier')
    .eq('id', user.id)
    .single();

  // Non-admin roles get sent to their own dashboards
  if (profile?.role === 'farm') redirect('/dashboard/farm');
  if (profile?.role === 'restaurant') redirect('/dashboard/restaurant');
  if (!profile || profile.role !== 'admin') redirect('/login');

  const adminTier: number = profile.admin_tier ?? 1;

  return (
    <div className="flex flex-col md:flex-row min-h-screen -mt-16 pt-16">
      <AdminSessionTracker />
      <AdminSidebar adminTier={adminTier} />
      <div className="flex-1 bg-stone-50">
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
