'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAdminUsers, updateAdminTier, deleteAdminAccount } from '@/lib/actions';

const TIER_LABELS: Record<number, string> = {
  1: 'Editor',
  2: 'Reviewer',
  3: 'Super Admin',
};

const TIER_DESCRIPTIONS: Record<number, string> = {
  1: 'View submissions and farms, edit contact info and descriptions',
  2: 'Everything in Tier 1 plus approve/reject submissions and farms',
  3: 'Full access including account management and deletions',
};

interface AdminUser {
  id: string;
  email: string;
  tier: number;
}

type FeedbackMsg = { type: 'success' | 'error'; text: string };

export default function PermissionsPage() {
  const [myId, setMyId] = useState('');
  const [myTier, setMyTier] = useState(1);
  const [masterEmail] = useState(process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? '');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierUpdating, setTierUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<FeedbackMsg | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMyId(data.user.id);
      const { data: profile } = await supabase
        .from('profiles').select('admin_tier').eq('id', data.user.id).single();
      setMyTier(profile?.admin_tier ?? 1);
    });
    getAdminUsers().then((list) => { setAdmins(list); setLoading(false); });
  }, []);

  function isMaster(email: string) {
    return !!masterEmail && email.toLowerCase() === masterEmail.toLowerCase();
  }

  async function handleTierChange(targetId: string, newTier: number) {
    setTierUpdating(targetId);
    setMsg(null);
    const result = await updateAdminTier(targetId, newTier);
    if (result.error) {
      setMsg({ type: 'error', text: result.error });
    } else {
      setAdmins((prev) => prev.map((a) => a.id === targetId ? { ...a, tier: newTier } : a));
      setMsg({ type: 'success', text: 'Permission tier updated.' });
    }
    setTierUpdating(null);
  }

  async function handleDelete(targetId: string) {
    setDeleting(targetId);
    setMsg(null);
    const result = await deleteAdminAccount(targetId);
    if (result.error) {
      setMsg({ type: 'error', text: result.error });
    } else {
      setAdmins((prev) => prev.filter((a) => a.id !== targetId));
      setMsg({ type: 'success', text: 'Admin account removed.' });
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  if (myTier < 3) {
    return (
      <div className="max-w-2xl">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm">
          Super Admin (Tier 3) access required to view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Permissions</h1>
        <p className="text-sm text-stone-500">Manage access levels for admin accounts.</p>
      </div>

      {/* Tier reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {([1, 2, 3] as const).map((tier) => (
          <div key={tier} className="bg-white border border-stone-200 rounded-xl p-4">
            <div className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${
              tier === 3 ? 'bg-purple-100 text-purple-700'
              : tier === 2 ? 'bg-blue-100 text-blue-700'
              : 'bg-stone-100 text-stone-700'
            }`}>
              Tier {tier} — {TIER_LABELS[tier]}
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{TIER_DESCRIPTIONS[tier]}</p>
          </div>
        ))}
      </div>

      {/* Admin list */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-1">Admin Accounts</h2>
        <p className="text-sm text-stone-500 mb-5">
          Change permission tiers or remove admin accounts. To reset passwords or update emails, use the{' '}
          <a href="/admin/accounts" className="text-[#2d6a4f] hover:underline font-medium">Accounts</a> page.
        </p>

        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-lg text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {msg.text}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-stone-400">Loading…</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {admins.map((admin) => {
              const locked = isMaster(admin.email);
              const isSelf = admin.id === myId;
              return (
                <li key={admin.id} className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-stone-900 truncate">{admin.email}</p>
                        {isSelf && <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">You</span>}
                        {locked && <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Master</span>}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">Tier {admin.tier} — {TIER_LABELS[admin.tier]}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <select
                        value={admin.tier}
                        disabled={locked || tierUpdating === admin.id}
                        onChange={(e) => handleTierChange(admin.id, Number(e.target.value))}
                        className="border border-stone-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value={1}>Tier 1 — Editor</option>
                        <option value={2}>Tier 2 — Reviewer</option>
                        <option value={3}>Tier 3 — Super Admin</option>
                      </select>
                      {!locked && !isSelf && (
                        confirmDelete === admin.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-stone-500">Remove?</span>
                            <button
                              onClick={() => handleDelete(admin.id)}
                              disabled={deleting === admin.id}
                              className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleting === admin.id ? '…' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(admin.id)}
                            className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        )
                      )}
                      {tierUpdating === admin.id && (
                        <div className="w-4 h-4 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
