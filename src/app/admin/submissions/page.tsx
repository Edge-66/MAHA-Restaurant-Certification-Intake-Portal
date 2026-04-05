import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filterStatus = params.status || 'all';
  const supabase = await createClient();

  let query = supabase
    .from('submissions')
    .select('*, restaurants(*), dishes(id)')
    .order('submitted_at', { ascending: false });

  if (filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data: submissions } = await query;
  const allSubmissions = submissions || [];

  const statuses = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'needs_clarification', label: 'Needs Clarification' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-8">Submissions</h1>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map((s) => (
          <Link
            key={s.key}
            href={s.key === 'all' ? '/admin/submissions' : `/admin/submissions?status=${s.key}`}
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

      {/* Submissions Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {allSubmissions.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No submissions found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-6 py-3 font-medium text-stone-600">Restaurant</th>
                <th className="text-left px-6 py-3 font-medium text-stone-600">Submitted</th>
                <th className="text-left px-6 py-3 font-medium text-stone-600">Dishes</th>
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
                  <td className="px-6 py-4 text-stone-500">
                    {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {(submission.dishes || []).length}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="text-[#2d6a4f] hover:underline font-medium"
                    >
                      Review →
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
