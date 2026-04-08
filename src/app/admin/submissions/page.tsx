import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === 'farms' ? 'farms' : 'restaurants';
  const filterStatus = params.status || 'all';
  const supabase = await createClient();

  // ── Restaurant submissions ────────────────────────────────────────────────
  let subQuery = supabase
    .from('submissions')
    .select('*, restaurants(*), dishes(id)')
    .order('submitted_at', { ascending: false });
  if (filterStatus !== 'all') subQuery = subQuery.eq('status', filterStatus);
  const { data: submissions } = await subQuery;
  const allSubmissions = submissions || [];

  // ── Farm applications ─────────────────────────────────────────────────────
  let farmQuery = supabase
    .from('farms')
    .select('*')
    .order('created_at', { ascending: false });
  if (filterStatus !== 'all') farmQuery = farmQuery.eq('status', filterStatus);
  const { data: farms } = await farmQuery;
  const allFarms = farms || [];

  const restaurantStatuses = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'needs_clarification', label: 'Needs Clarification' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const farmStatuses = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const statusOptions = activeTab === 'farms' ? farmStatuses : restaurantStatuses;

  function tabHref(tab: string) {
    return `/admin/submissions?tab=${tab}`;
  }
  function statusHref(s: string) {
    const base = `/admin/submissions?tab=${activeTab}`;
    return s === 'all' ? base : `${base}&status=${s}`;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">All applications</h1>
        <p className="text-sm text-stone-500">
          Full archive with status filters. For items that need action now, use the{' '}
          <Link href="/admin/review-queue" className="text-[#2d6a4f] font-medium hover:underline">
            Review queue
          </Link>
          .
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl w-fit mb-6">
        {[
          { key: 'restaurants', label: 'Restaurants' },
          { key: 'farms', label: 'Farms' },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((s) => (
          <Link
            key={s.key}
            href={statusHref(s.key)}
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

      {/* ── Restaurants tab ─────────────────────────────────────────────────── */}
      {activeTab === 'restaurants' && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {allSubmissions.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">No submissions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Restaurant</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600 hidden sm:table-cell">Submitted</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600 hidden sm:table-cell">Dishes</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {allSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {submission.restaurants?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-stone-500 hidden sm:table-cell">
                        {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-stone-500 hidden sm:table-cell">
                        {(submission.dishes || []).length}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/submissions/${submission.id}`}
                          className="text-[#2d6a4f] hover:underline font-medium whitespace-nowrap"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Farms tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'farms' && (
        <>
          <div className="mb-6 rounded-xl border border-[#2d6a4f]/20 bg-[#2d6a4f]/5 px-4 py-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-stone-900">Farmer admin & map coordinates</p>
                <p className="text-stone-600 mt-0.5 max-w-xl">
                  Farmer admin has the directory geocoder, filters, and links to manage each farm profile and review queue.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href="/admin/farmers"
                  className="inline-flex items-center justify-center rounded-lg bg-[#2d6a4f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332] transition-colors"
                >
                  Open farmer admin
                </Link>
                <Link
                  href="/admin/farms/pending"
                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Pending queue
                </Link>
              </div>
            </div>
          </div>
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          {allFarms.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-sm">No farm applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Farm Name</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600 hidden md:table-cell">Location</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600 hidden md:table-cell">Applied</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600 hidden sm:table-cell">Certification</th>
                    <th className="text-left px-6 py-3 font-medium text-stone-600">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {allFarms.map((farm) => (
                    <tr key={farm.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-stone-900">{farm.name}</td>
                      <td className="px-6 py-4 text-stone-500 hidden md:table-cell">{farm.city}, {farm.state}</td>
                      <td className="px-6 py-4 text-stone-500 hidden md:table-cell">
                        {new Date(farm.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {farm.cert_type ? (
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                            farm.cert_type === 'usda'
                              ? 'bg-green-100 text-green-800'
                              : farm.cert_type === 'none'
                              ? 'bg-stone-100 text-stone-500'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {farm.cert_type === 'usda' ? 'USDA Organic'
                              : farm.cert_type === 'aga' ? 'AGA'
                              : farm.cert_type === 'raa' ? 'Regen. Organic'
                              : farm.cert_type === 'other' ? (farm.cert_other || 'Other')
                              : 'None'}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
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
                          className="text-[#2d6a4f] hover:underline font-medium whitespace-nowrap"
                        >
                          {farm.status === 'pending' ? 'Review →' : 'Manage →'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
