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

  // Per-row state: which user has the email editor open
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Per-row state: password reset in progress
  const [sendingReset, setSendingReset] = useState<string | null>(null);

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
    if (result.error) {
      showMsg({ type: 'error', text: result.error });
    } else {
      showMsg({ type: 'success', text: 'Password reset email sent.' });
    }
    setSendingReset(null);
  }

  // ── Email change ───────────────────────────────────────────────────────────
  function startEmailEdit(userId: string, currentEmail: string) {
    setEditingEmail(userId);
    setEmailDraft(currentEmail);
    setMsg(null);
  }

  async function saveEmailChange(userId: string, userType: 'admin' | 'restaurant' | 'farm', entityId: string) {
    if (!emailDraft.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft)) {
      showMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setEmailSaving(true);
    const result = await updateUserEmail(userId, emailDraft.trim());
    if (result.error) {
      showMsg({ type: 'error', text: result.error });
    } else {
      // Update local state
      if (userType === 'admin') {
        setAdmins((prev) => prev.map((a) => a.id === userId ? { ...a, email: emailDraft.trim() } : a));
      } else if (userType === 'restaurant') {
        setRestaurants((prev) => prev.map((r) => r.id === entityId ? { ...r, email: emailDraft.trim() } : r));
      } else {
        setFarms((prev) => prev.map((f) => f.id === entityId ? { ...f, email: emailDraft.trim() } : f));
      }
      showMsg({ type: 'success', text: 'Email updated.' });
      setEditingEmail(null);
    }
    setEmailSaving(false);
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

  const ResetBtn = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {disabled ? 'Sending…' : label}
    </button>
  );

  const EditEmailBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1.5 border border-[#2d6a4f]/30 rounded-lg text-[#2d6a4f] hover:bg-[#2d6a4f]/5 transition-colors whitespace-nowrap"
    >
      Change Email
    </button>
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Accounts</h1>
        <p className="text-sm text-stone-500">Manage user credentials — reset passwords and update email addresses.</p>
      </div>

      {/* Feedback */}
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
      <div className="flex gap-1 mb-6 bg-stone-100 rounded-xl p-1 w-fit">
        {(['admins', 'restaurants', 'farms'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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
          {/* ── Admins Tab ──────────────────────────────────────────────────── */}
          {tab === 'admins' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-900">Admin Accounts</h2>
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
                            <ResetBtn
                              label="Send Password Reset"
                              disabled={sendingReset === admin.id}
                              onClick={() => handlePasswordReset(admin.id, () => sendPasswordReset(admin.id))}
                            />
                            {!isSelf && <EditEmailBtn onClick={() => startEmailEdit(editKey, admin.email)} />}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <input
                            type="email"
                            value={emailDraft}
                            onChange={(e) => setEmailDraft(e.target.value)}
                            className={inp + ' flex-1 min-w-48'}
                            placeholder="New email address"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEmailChange(admin.id, 'admin', admin.id)}
                            disabled={emailSaving}
                            className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                          >
                            {emailSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                            Cancel
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ── Restaurants Tab ─────────────────────────────────────────────── */}
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
                            {r.profileId ? (
                              <ResetBtn
                                label="Send Password Reset"
                                disabled={sendingReset === r.id}
                                onClick={() => handlePasswordReset(r.id, () => sendPasswordResetForRestaurant(r.id))}
                              />
                            ) : null}
                            <EditEmailBtn onClick={() => startEmailEdit(editKey, r.email)} />
                          </div>
                        </div>
                        {isEditing && r.profileId && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <input
                              type="email"
                              value={emailDraft}
                              onChange={(e) => setEmailDraft(e.target.value)}
                              className={inp + ' flex-1 min-w-48'}
                              placeholder="New email address"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEmailChange(r.profileId!, 'restaurant', r.id)}
                              disabled={emailSaving}
                              className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                            >
                              {emailSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                              Cancel
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ── Farms Tab ───────────────────────────────────────────────────── */}
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
                            {f.profileId ? (
                              <ResetBtn
                                label="Send Password Reset"
                                disabled={sendingReset === f.id}
                                onClick={() => handlePasswordReset(f.id, () => sendPasswordResetForFarm(f.id))}
                              />
                            ) : null}
                            <EditEmailBtn onClick={() => startEmailEdit(editKey, f.email)} />
                          </div>
                        </div>
                        {isEditing && f.profileId && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <input
                              type="email"
                              value={emailDraft}
                              onChange={(e) => setEmailDraft(e.target.value)}
                              className={inp + ' flex-1 min-w-48'}
                              placeholder="New email address"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEmailChange(f.profileId!, 'farm', f.id)}
                              disabled={emailSaving}
                              className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                            >
                              {emailSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingEmail(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                              Cancel
                            </button>
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
