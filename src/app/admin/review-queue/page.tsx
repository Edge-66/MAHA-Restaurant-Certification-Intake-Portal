import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function AdminReviewQueuePage() {
  const supabase = await createClient();

  const [{ data: submissions }, { data: farms }, { count: pendingDishCount }] = await Promise.all([
    supabase
      .from('submissions')
      .select('*, restaurants(*), dishes(id)')
      .in('status', ['pending', 'needs_clarification'])
      .order('submitted_at', { ascending: true }),
    supabase
      .from('farms')
      .select('id, name, city, state, created_at, cert_type, cert_other, contact_email')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('dishes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const pendingSubs = submissions ?? [];
  const pendingFarms = farms ?? [];

  // Group pending submissions by restaurant — one row per restaurant
  type RestaurantGroup = {
    restaurantId: string;
    name: string;
    earliestId: string;
    earliestDate: string;
    totalDishes: number;
    submissionCount: number;
    status: string;
  };

  const groupMap = new Map<string, RestaurantGroup>();
  for (const sub of pendingSubs) {
    const rid = sub.restaurant_id as string;
    if (!groupMap.has(rid)) {
      groupMap.set(rid, {
        restaurantId: rid,
        name: sub.restaurants?.name ?? 'Unknown restaurant',
        earliestId: sub.id,
        earliestDate: sub.submitted_at,
        totalDishes: 0,
        submissionCount: 0,
        status: sub.status,
      });
    }
    const g = groupMap.get(rid)!;
    g.totalDishes += (sub.dishes || []).length;
    g.submissionCount += 1;
    // Surface needs_clarification if any batch has it
    if (sub.status === 'needs_clarification') g.status = 'needs_clarification';
  }
  const grouped = Array.from(groupMap.values());

  const total = grouped.length + pendingFarms.length;
  const firstFarmId = pendingFarms[0]?.id;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Review queue</h1>
        <p className="text-sm text-stone-500 max-w-2xl">
          Your open reviews, in one list. Click a restaurant to review their dishes. Click a farm to review their
          application. For the full list and filters, go to{' '}
          <Link href="/admin/submissions" className="text-[#2d6a4f] font-medium hover:underline">
            All applications
          </Link>
          .
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-stone-500 mb-1">Needs attention</div>
          <div className="text-3xl font-bold text-stone-900 tabular-nums">{total}</div>
          <div className="text-xs text-stone-500 mt-1">Pending review or clarification</div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-5">
          <div className="text-sm font-medium text-amber-900/80 mb-1">Restaurant submissions</div>
          <div className="text-2xl font-bold text-amber-950 tabular-nums">{grouped.length}</div>
          <div className="text-xs text-amber-700/70 mt-1">Restaurants awaiting review</div>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/80 p-5">
          <div className="text-sm font-medium text-orange-900/80 mb-1">Pending dishes</div>
          <div className="text-2xl font-bold text-orange-950 tabular-nums">{pendingDishCount ?? 0}</div>
          <div className="text-xs text-orange-700/70 mt-1">Individual dishes to review</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-5">
          <div className="text-sm font-medium text-emerald-900/80 mb-1">Farm applications</div>
          <div className="text-2xl font-bold text-emerald-950 tabular-nums">{pendingFarms.length}</div>
        </div>
      </div>

      {firstFarmId && pendingFarms.length > 0 && (
        <div className="mb-8">
          <Link
            href={`/admin/farms/${firstFarmId}/review`}
            className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1b4332] transition-colors"
          >
            Start farm queue
            <span className="opacity-90 font-normal">(oldest first · {pendingFarms.length} pending)</span>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
        {/* Restaurants */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Restaurant submissions</h2>
            <Link
              href="/admin/submissions?tab=restaurants&status=pending"
              className="text-sm text-[#2d6a4f] font-medium hover:underline"
            >
              Browse all restaurants →
            </Link>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {grouped.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm">No restaurant submissions waiting.</div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {grouped.map((g) => (
                  <li key={g.restaurantId}>
                    <Link
                      href={`/admin/submissions/${g.earliestId}`}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900 text-sm truncate">{g.name}</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          Submitted{' '}
                          {new Date(g.earliestDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {g.totalDishes > 0 && (
                            <span> · {g.totalDishes} dish{g.totalDishes === 1 ? '' : 'es'}</span>
                          )}
                          {g.submissionCount > 1 && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              {g.submissionCount} batches
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={g.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Farms */}
        <section className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-stone-900">Farm applications</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {pendingFarms.length > 0 && (
                <Link
                  href="/admin/farms/pending"
                  className="text-sm text-[#2d6a4f] font-medium hover:underline"
                >
                  Table view →
                </Link>
              )}
              <Link
                href="/admin/submissions?tab=farms&status=pending"
                className="text-sm text-stone-500 hover:text-stone-800 hover:underline"
              >
                All farms
              </Link>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            {pendingFarms.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-sm">No farm applications waiting.</div>
            ) : (
              <ul className="divide-y divide-stone-100">
                {pendingFarms.map((farm) => (
                  <li key={farm.id}>
                    <Link
                      href={`/admin/farms/${farm.id}/review`}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900 text-sm truncate">{farm.name}</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {farm.city}, {farm.state} ·{' '}
                          {new Date(farm.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <StatusBadge status="pending" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
