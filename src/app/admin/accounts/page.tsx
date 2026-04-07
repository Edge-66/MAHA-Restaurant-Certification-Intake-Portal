'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getAdminUsers,
  getRestaurantUsers,
  getFarmUsers,
  sendPasswordReset,
  sendPasswordResetForRestaurant,
  sendPasswordResetForFarm,
  updateUserEmail,
  deleteRestaurantAccount,
  deleteFarm,
  type RestaurantUser,
  type FarmUser,
} from '@/lib/actions';

interface AdminUser { id: string; email: string; tier: number }
type FeedbackMsg = { type: 'success' | 'error'; text: string };
type Tab = 'admins' | 'restaurants' | 'farms';

const TIER_LABELS: Record<number, string> = { 1: 'Editor', 2: 'Reviewer', 3: 'Super Admin' };
const TIER_COLORS: Record<number, string> = {
  1: 'bg-stone-100 text-stone-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
};

export default function AccountsPage() {
  const [myId, setMyId] = useState('');
  const [myTier, setMyTier] = useState(1);
  const [masterEmail] = useState(process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL ?? '');
  const [tab, setTab] = useState<Tab>('admins');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantUser[]>([]);
  const [farms, setFarms] = useState<FarmUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const [sendingReset, setSendingReset] = useState<string | null>(null);

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
    Promise.all([getAdminUsers(), getRestaurantUsers(), getFarmUsers()]).then(
      ([a, r, f]) => { setAdmins(a); setRestaurants(r); setFarms(f); setLoading(false); }
    );
  }, []);

  function isMaster(email: string) {
    return !!masterEmail && email.toLowerCase() === masterEmail.toLowerCase();
  }

  function showMsg(m: FeedbackMsg) {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  async function handlePasswordReset(key: string, action: () => Promise<{ error?: string }>) {
    setSendingReset(key);
    setMsg(null);
    const result = await action();
    showMsg(result.error
      ? { type: 'error', text: result.error }
      : { type: 'success', text: 'Password reset email sent.' }
    );
    setSendingReset(null);
  }

  // ── Email change ───────────────────────────────────────────────────────────
  function startEmailEdit(key: string, currentEmail: string) {
    setEditingEmail(key);
    setEmailDraft(currentEmail);
    setMsg(null);
  }

  async function saveEmailChange(
    userId: string,
    userType: 'admin' | 'restaurant' | 'farm',
    entityId: string,
    editKey: string
  ) {
    if (!emailDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft)) {
      showMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setEmailSaving(true);
    const result = await updateUserEmail(userId, emailDraft.trim());
    if (result.error) {
      showMsg({ type: 'error', text: result.error });
    } else {
      const trimmed = emailDraft.trim();
      if (userType === 'admin') setAdmins((prev) => prev.map((a) => a.id === userId ? { ...a, email: trimmed } : a));
      else if (userType === 'restaurant') setRestaurants((prev) => prev.map((r) => r.id === entityId ? { ...r, email: trimmed } : r));
      else setFarms((prev) => prev.map((f) => f.id === entityId ? { ...f, email: trimmed } : f));
      showMsg({ type: 'success', text: 'Email updated.' });
      setEditingEmail(null);
    }
    setEmailSaving(false);
    void editKey;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(key: string, action: () => Promise<{ error?: string }>, onSuccess: () => void) {
    setDeleting(key);
    setMsg(null);
    const result = await action();
    if (result.error) {
      showMsg({ type: 'error', text: result.error });
    } else {
      onSuccess();
      showMsg({ type: 'success', text: 'Account removed.' });
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

  const inp = 'border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  const DeleteBtn = ({ id }: { id: string }) =>
    confirmDelete === id ? (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-stone-500">Remove?</span>
        <button
          onClick={() => {
            if (tab === 'restaurants') {
              handleDelete(id, () => deleteRestaurantAccount(id), () => setRestaurants((p) => p.filter((r) => r.id !== id)));
            } else {
              handleDelete(id, () => deleteFarm(id), () => setFarms((p) => p.filter((f) => f.id !== id)));
            }
          }}
          disabled={deleting === id}
          className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {deleting === id ? '…' : 'Yes'}
        </button>
        <button onClick={() => setConfirmDelete(null)} className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
          Cancel
        </button>
      </div>
    ) : (
      <button
        onClick={() => setConfirmDelete(id)}
        className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
      >
        Remove
      </button>
    );

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Accounts</h1>
        <p className="text-sm text-stone-500">Reset passwords, update emails, and remove accounts for all users.</p>
      </div>

      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${
          msg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit max-w-full overflow-x-auto">
        {(['admins', 'restaurants', 'farms'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setConfirmDelete(null); setEditingEmail(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t}
            <span className="ml-1.5 text-xs font-normal text-stone-400">
              ({t === 'admins' ? admins.length : t === 'restaurants' ? restaurants.length : farms.length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* ── Admins ─────────────────────────────────────────────────────── */}
          {tab === 'admins' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-900">Admin Accounts</h2>
                <p className="text-xs text-stone-400 mt-0.5">To change permission tiers, use the <a href="/admin/permissions" className="text-[#2d6a4f] hover:underline">Permissions</a> page.</p>
              </div>
              <ul className="divide-y divide-stone-100">
                {admins.map((admin) => {
                  const locked = isMaster(admin.email);
                  const isSelf = admin.id === myId;
                  const editKey = admin.id;
                  const isEditing = editingEmail === editKey;
                  return (
                    <li key={admin.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-stone-900 truncate">{admin.email}</p>
                            {isSelf && <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">You</span>}
                            {locked && <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Master</span>}
                          </div>
                          <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TIER_COLORS[admin.tier]}`}>
                            Tier {admin.tier} — {TIER_LABELS[admin.tier]}
                          </span>
                        </div>
                        {!locked && (
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            <button
                              onClick={() => handlePasswordReset(admin.id, () => sendPasswordReset(admin.id))}
                              disabled={sendingReset === admin.id}
                              className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {sendingReset === admin.id ? 'Sending…' : 'Send Password Reset'}
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => startEmailEdit(editKey, admin.email)}
                                className="text-xs px-3 py-1.5 border border-[#2d6a4f]/30 rounded-lg text-[#2d6a4f] hover:bg-[#2d6a4f]/5 transition-colors whitespace-nowrap"
                              >
                                Change Email
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inp + ' flex-1 min-w-48'} placeholder="New email address" autoFocus />
                          <button onClick={() => saveEmailChange(admin.id, 'admin', admin.id, editKey)} disabled={emailSaving} className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50">
                            {emailSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ── Restaurants ─────────────────────────────────────────────────── */}
          {tab === 'restaurants' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-900">Restaurant Accounts</h2>
              </div>
              {restaurants.length === 0 ? (
                <div className="px-6 py-8 text-center text-stone-400 text-sm">No restaurant accounts found.</div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {restaurants.map((r) => {
                    const editKey = `r-${r.id}`;
                    const isEditing = editingEmail === editKey;
                    return (
                      <li key={r.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{r.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{r.email} · {r.contactName} · {r.city}, {r.state}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            {r.profileId && (
                              <button
                                onClick={() => handlePasswordReset(r.id, () => sendPasswordResetForRestaurant(r.id))}
                                disabled={sendingReset === r.id}
                                className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {sendingReset === r.id ? 'Sending…' : 'Send Password Reset'}
                              </button>
                            )}
                            <button
                              onClick={() => startEmailEdit(editKey, r.email)}
                              className="text-xs px-3 py-1.5 border border-[#2d6a4f]/30 rounded-lg text-[#2d6a4f] hover:bg-[#2d6a4f]/5 transition-colors whitespace-nowrap"
                            >
                              Change Email
                            </button>
                            <DeleteBtn id={r.id} />
                          </div>
                        </div>
                        {isEditing && r.profileId && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inp + ' flex-1 min-w-48'} placeholder="New email address" autoFocus />
                            <button onClick={() => saveEmailChange(r.profileId!, 'restaurant', r.id, editKey)} disabled={emailSaving} className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50">
                              {emailSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ── Farms ───────────────────────────────────────────────────────── */}
          {tab === 'farms' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-900">Farm Accounts</h2>
              </div>
              {farms.length === 0 ? (
                <div className="px-6 py-8 text-center text-stone-400 text-sm">No farm accounts found.</div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {farms.map((f) => {
                    const editKey = `f-${f.id}`;
                    const isEditing = editingEmail === editKey;
                    return (
                      <li key={f.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{f.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{f.email} · {f.contactName} · {f.city}, {f.state}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            {f.profileId && (
                              <button
                                onClick={() => handlePasswordReset(f.id, () => sendPasswordResetForFarm(f.id))}
                                disabled={sendingReset === f.id}
                                className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {sendingReset === f.id ? 'Sending…' : 'Send Password Reset'}
                              </button>
                            )}
                            <button
                              onClick={() => startEmailEdit(editKey, f.email)}
                              className="text-xs px-3 py-1.5 border border-[#2d6a4f]/30 rounded-lg text-[#2d6a4f] hover:bg-[#2d6a4f]/5 transition-colors whitespace-nowrap"
                            >
                              Change Email
                            </button>
                            <DeleteBtn id={f.id} />
                          </div>
                        </div>
                        {isEditing && f.profileId && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <input type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className={inp + ' flex-1 min-w-48'} placeholder="New email address" autoFocus />
                            <button onClick={() => saveEmailChange(f.profileId!, 'farm', f.id, editKey)} disabled={emailSaving} className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50">
                              {emailSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
