import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function AdminFarmsPendingPage() {
  const supabase = await createClient();
  const { data: farms } = await supabase
    .from('farms')
    .select('id, name, city, state, created_at, cert_type, cert_other, contact_email')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const pending = farms ?? [];
  const firstId = pending[0]?.id;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Pending farm applications</h1>
        <p className="text-sm text-stone-500 max-w-2xl">
          Review certification details and practices in the focused workspace, then move through the queue with
          Previous / Next. Full profile editing (photos, hero, contact fixes) stays on the farm profile page.
        </p>
      </div>

      {firstId && (
        <div className="mb-8">
          <Link
            href={`/admin/farms/${firstId}/review`}
            className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1b4332] transition-colors"
          >
            Start reviewing
            <span className="opacity-90">({pending.length} pending)</span>
          </Link>
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {pending.length === 0 ? (
          <div className="p-10 text-center text-stone-500 text-sm">No pending farm applications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-6 py-3 font-medium text-stone-600">Farm</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600 hidden md:table-cell">Location</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600 hidden sm:table-cell">Applied</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pending.map((farm, i) => (
                  <tr key={farm.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{farm.name}</div>
                      <div className="text-xs text-stone-500 md:hidden mt-0.5">
                        {farm.city}, {farm.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 hidden md:table-cell">
                      {farm.city}, {farm.state}
                    </td>
                    <td className="px-6 py-4 text-stone-500 hidden sm:table-cell">
                      {new Date(farm.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status="pending" />
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/farms/${farm.id}/review`}
                        className="text-[#2d6a4f] hover:underline font-medium"
                      >
                        Review {i + 1} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Tip: The <Link href="/admin/review-queue" className="text-[#2d6a4f] hover:underline">Review queue</Link> shows pending farms alongside restaurant submissions; <Link href="/admin/submissions?tab=farms" className="text-[#2d6a4f] hover:underline">All applications → Farms</Link> lists every farm with filters.
      </p>
    </div>
  );
}
