import AdminSidebar from '@/components/AdminSidebar';
import { getMyAdminTier } from '@/lib/actions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminTier = await getMyAdminTier();

  return (
    <div className="flex flex-col md:flex-row min-h-screen -mt-16 pt-16">
      <AdminSidebar adminTier={adminTier} />
      <div className="flex-1 bg-stone-50">
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
