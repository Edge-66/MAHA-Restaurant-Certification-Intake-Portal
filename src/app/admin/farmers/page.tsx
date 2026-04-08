import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import FarmGeocodeBackfill from '@/components/admin/FarmGeocodeBackfill';

/** Allow long geocode runs (Nominatim throttling) on serverless hosts. */
export const maxDuration = 120;

export default async function AdminFarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filterStatus = params.status || 'all';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('admin_tier')
        .eq('id', user.id)
        .single()
    : { data: null };
  const adminTier = profile?.admin_tier ?? 1;

  let query = supabase
    .from('farms')
    .select('*')
    .order('created_at', { ascending: false });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data: farms } = await query;
  const allFarms = farms || [];

  const { data: latNullRows } = await supabase.from('farms').select('id').is('latitude', null);
  const { data: lngNullRows } = await supabase.from('farms').select('id').is('longitude', null);
  const farmsMissingCoordsCount = new Set([
    ...(latNullRows ?? []).map((r) => r.id),
    ...(lngNullRows ?? []).map((r) => r.id),
  ]).size;

  const statuses = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Farms</h1>
        {adminTier >= 3 && (
          <Link
            href="/admin/farmers/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] transition-colors"
          >
            + New farm
          </Link>
        )}
      </div>
      <p className="text-sm text-stone-500 mb-8 max-w-2xl">
        Manage farm profiles, map coordinates, and reviews. For the full historical list with the
        same filters, see{' '}
        <Link href="/admin/submissions?tab=farms" className="text-[#2d6a4f] font-medium hover:underline">
          All applications → Farms
        </Link>
        .
      </p>

      <div className="mb-8">
        <FarmGeocodeBackfill farmsMissingCoordsCount={farmsMissingCoordsCount} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={s.key === 'all' ? '/admin/farmers' : `/admin/farmers?status=${s.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s.key
                ? 'bg-[#2d6a4f] text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {allFarms.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">No farms found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-6 py-3 font-medium text-stone-600">Farm Name</th>
                <th className="text-left px-6 py-3 font-medium text-stone-600">Location</th>
                <th className="text-left px-6 py-3 font-medium text-stone-600">Submitted</th>
                <th className="text-left px-6 py-3 font-medium text-stone-600">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {allFarms.map((farm) => (
                <tr key={farm.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">
                    <Link
                      href={
                        farm.status === 'pending'
                          ? `/admin/farms/${farm.id}/review`
                          : `/admin/farms/${farm.id}`
                      }
                      className="hover:underline"
                    >
                      {farm.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {farm.city}, {farm.state}
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {new Date(farm.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={farm.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={
                        farm.status === 'pending'
                          ? `/admin/farms/${farm.id}/review`
                          : `/admin/farms/${farm.id}`
                      }
                      className="text-[#2d6a4f] hover:underline font-medium"
                    >
                      {farm.status === 'pending' ? 'Review →' : 'Manage →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
