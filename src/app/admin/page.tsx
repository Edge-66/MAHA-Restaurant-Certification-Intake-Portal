import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, restaurants(*)')
    .order('submitted_at', { ascending: false });

  const { data: farms } = await supabase
    .from('farms')
    .select('*')
    .order('created_at', { ascending: false });

  const allSubmissions = submissions || [];
  const allFarms = farms || [];

  const subTotal = allSubmissions.length;
  const subPending = allSubmissions.filter((s) => s.status === 'pending').length;
  const subNeedsReview = allSubmissions.filter(
    (s) => s.status === 'pending' || s.status === 'needs_clarification'
  ).length;
  const subApproved = allSubmissions.filter((s) => s.status === 'approved').length;
  const subRejected = allSubmissions.filter((s) => s.status === 'rejected').length;

  const farmTotal = allFarms.length;
  const farmPending = allFarms.filter((f) => f.status === 'pending').length;
  const farmApproved = allFarms.filter((f) => f.status === 'approved').length;
  const reviewQueueTotal = subNeedsReview + farmPending;

  const recentSubmissions = allSubmissions.slice(0, 5);
  const recentFarms = allFarms.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-4">Dashboard</h1>

      <Link
        href="/admin/review-queue"
        className="mb-8 block rounded-xl border border-[#2d6a4f]/25 bg-[#2d6a4f]/5 px-5 py-4 transition-colors hover:bg-[#2d6a4f]/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#1b4332]">Review queue</div>
            <p className="text-sm text-stone-600 mt-0.5">
              {reviewQueueTotal === 0
                ? 'Nothing waiting — you’re all caught up.'
                : `${reviewQueueTotal} item${reviewQueueTotal === 1 ? '' : 's'} ${reviewQueueTotal === 1 ? 'needs' : 'need'} a decision.`}
            </p>
          </div>
          <span className="text-sm font-semibold text-[#2d6a4f] shrink-0">
            Open queue →
          </span>
        </div>
      </Link>

      {/* Restaurant Stats */}
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Restaurant Submissions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: subTotal, color: 'bg-stone-100 text-stone-800' },
          { label: 'Pending', value: subPending, color: 'bg-yellow-50 text-yellow-800' },
          { label: 'Approved', value: subApproved, color: 'bg-green-50 text-green-800' },
          { label: 'Rejected', value: subRejected, color: 'bg-red-50 text-red-800' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-5 border border-stone-200`}>
            <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-sm opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Farm Stats */}
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Farms</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Total', value: farmTotal, color: 'bg-stone-100 text-stone-800' },
          { label: 'Pending', value: farmPending, color: 'bg-yellow-50 text-yellow-800' },
          { label: 'Approved', value: farmApproved, color: 'bg-green-50 text-green-800' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-5 border border-stone-200`}>
            <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-sm opacity-75">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-white border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900">Recent Submissions</h2>
            <Link href="/admin/submissions?tab=restaurants" className="text-sm text-[#2d6a4f] hover:underline font-medium">
              View all →
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="p-6 text-center text-stone-500 text-sm">No submissions yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/admin/submissions/${submission.id}`}
                  className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-stone-900 text-sm">
                      {submission.restaurants?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-stone-500">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>
                  <StatusBadge status={submission.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Farms */}
        <div className="bg-white border border-stone-200 rounded-xl">
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-900">Recent Farms</h2>
            <div className="flex items-center gap-4">
              <Link href="/admin/review-queue" className="text-sm text-[#2d6a4f] hover:underline font-medium">
                Review queue
              </Link>
              <Link href="/admin/submissions?tab=farms" className="text-sm text-[#2d6a4f] hover:underline font-medium">
                View all →
              </Link>
            </div>
          </div>
          {recentFarms.length === 0 ? (
            <div className="p-6 text-center text-stone-500 text-sm">No farm applications yet.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentFarms.map((farm) => (
                <Link
                  key={farm.id}
                  href={
                    farm.status === 'pending'
                      ? `/admin/farms/${farm.id}/review`
                      : `/admin/farms/${farm.id}`
                  }
                  className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-stone-900 text-sm">{farm.name}</div>
                    <div className="text-xs text-stone-500">{farm.city}, {farm.state}</div>
                  </div>
                  <StatusBadge status={farm.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
