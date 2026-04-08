import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_tier')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin' || (profile.admin_tier ?? 1) < 3) {
    redirect('/admin');
  }

  const params = await searchParams;
  const from = (params.from ?? '').trim();
  const to = (params.to ?? '').trim();

  let query = supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
  if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`);

  const { data: logs } = await query;
  const rows = logs ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Admin logs</h1>
      <p className="text-sm text-stone-500 mb-6">
        Audit trail for admin actions. Logs are retained for the last 30 days.
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1">From date</label>
          <input type="date" name="from" defaultValue={from} className="border border-stone-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">To date</label>
          <input type="date" name="to" defaultValue={to} className="border border-stone-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b4332]">
          Search
        </button>
        <Link href="/admin/logs" className="text-sm text-stone-600 hover:underline">
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">When</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Admin</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Action</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Target</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">IP</th>
              <th className="text-left px-4 py-2.5 font-medium text-stone-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No logs found for this date range.
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <div>{log.admin_email ?? 'Unknown'}</div>
                    <div className="text-xs text-stone-400">Tier {log.admin_tier}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-900 font-medium whitespace-nowrap">{log.action}</td>
                  <td className="px-4 py-3 text-stone-700">
                    <div>{log.target_type ?? '—'}</div>
                    <div className="text-xs text-stone-400 break-all">{log.target_id ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-stone-700 whitespace-nowrap">{log.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-600 max-w-[420px] break-words">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
