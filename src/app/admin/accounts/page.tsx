'use client';

import { useEffect, useState, useCallback } from 'react';
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
  createAdminAccount,
  createRestaurantUserAccount,
  createFarmUserAccount,
  adminSetPasswordForUser,
  type RestaurantUser,
  type FarmUser,
} from '@/lib/actions';

interface AdminUser { id: string; email: string; tier: number }
type FeedbackMsg = { type: 'success' | 'error'; text: string };
type Tab = 'admins' | 'restaurants' | 'farms';
type NewAccountRole = 'admin' | 'restaurant' | 'farm';

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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [newRole, setNewRole] = useState<NewAccountRole>('admin');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTier, setNewTier] = useState(1);
  const [extraContactName, setExtraContactName] = useState('');
  const [extraPhone, setExtraPhone] = useState('');
  const [extraAddress, setExtraAddress] = useState('');
  const [extraCity, setExtraCity] = useState('');
  const [extraState, setExtraState] = useState('');
  const [extraZip, setExtraZip] = useState('');
  const [extraWebsite, setExtraWebsite] = useState('');
  const [extraDescription, setExtraDescription] = useState('');
  const [farmListingStatus, setFarmListingStatus] = useState<'approved' | 'pending' | 'rejected'>('pending');

  const [directPwRowKey, setDirectPwRowKey] = useState<string | null>(null);
  const [directPwTargetUserId, setDirectPwTargetUserId] = useState<string | null>(null);
  const [directPwDraft, setDirectPwDraft] = useState('');
  const [directPwConfirm, setDirectPwConfirm] = useState('');
  const [directPwSaving, setDirectPwSaving] = useState(false);

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

  async function refreshLists() {
    const [a, r, f] = await Promise.all([getAdminUsers(), getRestaurantUsers(), getFarmUsers()]);
    setAdmins(a);
    setRestaurants(r);
    setFarms(f);
  }

  const resetCreateForm = useCallback(() => {
    setNewRole('admin');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewTier(1);
    setExtraContactName('');
    setExtraPhone('');
    setExtraAddress('');
    setExtraCity('');
    setExtraState('');
    setExtraZip('');
    setExtraWebsite('');
    setExtraDescription('');
    setFarmListingStatus('pending');
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    resetCreateForm();
  }, [resetCreateForm]);

  useEffect(() => {
    if (!createModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCreateModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createModalOpen, closeCreateModal]);

  async function submitNewAccount() {
    setCreateBusy(true);
    setMsg(null);
    try {
      if (newRole === 'admin') {
        if (!newName.trim()) {
          showMsg({ type: 'error', text: 'Please enter a name.' });
          return;
        }
        const r = await createAdminAccount({
          email: newEmail,
          password: newPassword,
          adminTier: newTier,
          displayName: newName.trim(),
        });
        if (r.error) showMsg({ type: 'error', text: r.error });
        else {
          showMsg({ type: 'success', text: 'Admin account created. They can sign in with this email and password.' });
          closeCreateModal();
          await refreshLists();
        }
        return;
      }

      if (newRole === 'restaurant') {
        const r = await createRestaurantUserAccount({
          email: newEmail,
          password: newPassword,
          name: newName.trim(),
          contact_name: extraContactName.trim(),
          contact_phone: extraPhone.trim(),
          address: extraAddress.trim(),
          city: extraCity.trim(),
          state: extraState.trim(),
          zip: extraZip.trim(),
          website: extraWebsite.trim() || null,
          description: extraDescription.trim() || null,
        });
        if (r.error) showMsg({ type: 'error', text: r.error });
        else {
          showMsg({ type: 'success', text: 'Restaurant account created.' });
          closeCreateModal();
          await refreshLists();
        }
        return;
      }

      const r = await createFarmUserAccount({
        email: newEmail,
        password: newPassword,
        name: newName.trim(),
        contact_name: extraContactName.trim(),
        contact_phone: extraPhone.trim(),
        city: extraCity.trim(),
        state: extraState.trim(),
        address: extraAddress.trim() || null,
        zip: extraZip.trim() || null,
        website: extraWebsite.trim() || null,
        description: extraDescription.trim() || null,
        status: farmListingStatus,
      });
      if (r.error) showMsg({ type: 'error', text: r.error });
      else {
        showMsg({ type: 'success', text: 'Farm account created.' });
        closeCreateModal();
        await refreshLists();
      }
    } finally {
      setCreateBusy(false);
    }
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
    setDirectPwRowKey(null);
    setDirectPwTargetUserId(null);
    setDirectPwDraft('');
    setDirectPwConfirm('');
    setMsg(null);
  }

  function startDirectPassword(rowKey: string, authUserId: string) {
    setDirectPwRowKey(rowKey);
    setDirectPwTargetUserId(authUserId);
    setDirectPwDraft('');
    setDirectPwConfirm('');
    setEditingEmail(null);
    setMsg(null);
  }

  async function saveDirectPassword() {
    if (!directPwTargetUserId) return;
    if (directPwDraft.length < 8) {
      showMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (directPwDraft !== directPwConfirm) {
      showMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setDirectPwSaving(true);
    const r = await adminSetPasswordForUser(directPwTargetUserId, directPwDraft);
    if (r.error) {
      showMsg({ type: 'error', text: r.error });
    } else {
      showMsg({ type: 'success', text: 'Password updated. Share the new password with the user securely.' });
      setDirectPwRowKey(null);
      setDirectPwTargetUserId(null);
      setDirectPwDraft('');
      setDirectPwConfirm('');
    }
    setDirectPwSaving(false);
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

  const nameFieldLabel =
    newRole === 'admin' ? 'Full name' : newRole === 'restaurant' ? 'Restaurant name' : 'Farm name';

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Accounts</h1>
          <p className="text-sm text-stone-500">
            Send or set passwords, update emails, and remove accounts. Use “Set password” when someone cannot access email. (Super Admin only.)
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setCreateModalOpen(true); setMsg(null); }}
          className="shrink-0 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-[#2d6a4f] text-white hover:bg-[#1b4332] shadow-sm transition-colors"
        >
          New account
        </button>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40"
            aria-label="Close dialog"
            onClick={closeCreateModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-account-title"
            className="relative w-full max-w-lg max-h-[min(90vh,720px)] flex flex-col rounded-2xl bg-white border border-stone-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-5 py-4">
              <h2 id="new-account-title" className="text-lg font-semibold text-stone-900">New account</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-sm text-stone-500 hover:text-stone-800 px-2 py-1 rounded-lg hover:bg-stone-100"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label htmlFor="new-acc-name" className="block text-xs font-medium text-stone-600 mb-1">{nameFieldLabel}</label>
                <input
                  id="new-acc-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`${inp} w-full`}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="new-acc-role" className="block text-xs font-medium text-stone-600 mb-1">Role</label>
                <select
                  id="new-acc-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as NewAccountRole)}
                  className={`${inp} w-full`}
                >
                  <option value="admin">Admin</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="farm">Farm</option>
                </select>
              </div>
              <div>
                <label htmlFor="new-acc-email" className="block text-xs font-medium text-stone-600 mb-1">Email</label>
                <input
                  id="new-acc-email"
                  type="email"
                  autoComplete="off"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`${inp} w-full`}
                />
              </div>
              <div>
                <label htmlFor="new-acc-pass" className="block text-xs font-medium text-stone-600 mb-1">Temporary password</label>
                <input
                  id="new-acc-pass"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inp} w-full`}
                />
                <p className="mt-1 text-xs text-stone-400">At least 8 characters. They can change it after signing in.</p>
              </div>
              {newRole === 'admin' && (
                <div>
                  <label htmlFor="new-acc-tier" className="block text-xs font-medium text-stone-600 mb-1">Permission level</label>
                  <select
                    id="new-acc-tier"
                    value={newTier}
                    onChange={(e) => setNewTier(Number(e.target.value))}
                    className={`${inp} w-full`}
                  >
                    <option value={1}>Tier 1 — Editor</option>
                    <option value={2}>Tier 2 — Reviewer</option>
                    <option value={3}>Tier 3 — Super Admin</option>
                  </select>
                </div>
              )}

              {newRole === 'restaurant' && (
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <p className="text-xs font-medium text-stone-700">Restaurant details</p>
                  <p className="text-xs text-stone-500">Login email is also the restaurant contact email. Fields below are required.</p>
                  <div>
                    <label htmlFor="new-acc-r-contact" className="block text-xs text-stone-600 mb-1">Contact name</label>
                    <input id="new-acc-r-contact" value={extraContactName} onChange={(e) => setExtraContactName(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-r-phone" className="block text-xs text-stone-600 mb-1">Phone</label>
                    <input id="new-acc-r-phone" value={extraPhone} onChange={(e) => setExtraPhone(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-r-addr" className="block text-xs text-stone-600 mb-1">Street address</label>
                    <input id="new-acc-r-addr" value={extraAddress} onChange={(e) => setExtraAddress(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-acc-r-city" className="block text-xs text-stone-600 mb-1">City</label>
                      <input id="new-acc-r-city" value={extraCity} onChange={(e) => setExtraCity(e.target.value)} className={`${inp} w-full`} />
                    </div>
                    <div>
                      <label htmlFor="new-acc-r-state" className="block text-xs text-stone-600 mb-1">State</label>
                      <input id="new-acc-r-state" value={extraState} onChange={(e) => setExtraState(e.target.value)} className={`${inp} w-full`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="new-acc-r-zip" className="block text-xs text-stone-600 mb-1">ZIP</label>
                    <input id="new-acc-r-zip" value={extraZip} onChange={(e) => setExtraZip(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-r-web" className="block text-xs text-stone-600 mb-1">Website (optional)</label>
                    <input id="new-acc-r-web" value={extraWebsite} onChange={(e) => setExtraWebsite(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-r-desc" className="block text-xs text-stone-600 mb-1">Description (optional)</label>
                    <textarea id="new-acc-r-desc" value={extraDescription} onChange={(e) => setExtraDescription(e.target.value)} rows={2} className={`${inp} w-full resize-y min-h-[2.5rem]`} />
                  </div>
                </div>
              )}

              {newRole === 'farm' && (
                <div className="pt-2 border-t border-stone-100 space-y-3">
                  <p className="text-xs font-medium text-stone-700">Farm details</p>
                  <p className="text-xs text-stone-500">Contact name, phone, city, and state are required. Address and ZIP are optional.</p>
                  <div>
                    <label htmlFor="new-acc-f-contact" className="block text-xs text-stone-600 mb-1">Contact name</label>
                    <input id="new-acc-f-contact" value={extraContactName} onChange={(e) => setExtraContactName(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-phone" className="block text-xs text-stone-600 mb-1">Phone</label>
                    <input id="new-acc-f-phone" value={extraPhone} onChange={(e) => setExtraPhone(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-status" className="block text-xs text-stone-600 mb-1">Listing status</label>
                    <select
                      id="new-acc-f-status"
                      value={farmListingStatus}
                      onChange={(e) => setFarmListingStatus(e.target.value as 'approved' | 'pending' | 'rejected')}
                      className={`${inp} w-full`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-acc-f-city" className="block text-xs text-stone-600 mb-1">City</label>
                      <input id="new-acc-f-city" value={extraCity} onChange={(e) => setExtraCity(e.target.value)} className={`${inp} w-full`} />
                    </div>
                    <div>
                      <label htmlFor="new-acc-f-state" className="block text-xs text-stone-600 mb-1">State</label>
                      <input id="new-acc-f-state" value={extraState} onChange={(e) => setExtraState(e.target.value)} className={`${inp} w-full`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-addr" className="block text-xs text-stone-600 mb-1">Street address (optional)</label>
                    <input id="new-acc-f-addr" value={extraAddress} onChange={(e) => setExtraAddress(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-zip" className="block text-xs text-stone-600 mb-1">ZIP (optional)</label>
                    <input id="new-acc-f-zip" value={extraZip} onChange={(e) => setExtraZip(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-web" className="block text-xs text-stone-600 mb-1">Website (optional)</label>
                    <input id="new-acc-f-web" value={extraWebsite} onChange={(e) => setExtraWebsite(e.target.value)} className={`${inp} w-full`} />
                  </div>
                  <div>
                    <label htmlFor="new-acc-f-desc" className="block text-xs text-stone-600 mb-1">Description (optional)</label>
                    <textarea id="new-acc-f-desc" value={extraDescription} onChange={(e) => setExtraDescription(e.target.value)} rows={2} className={`${inp} w-full resize-y min-h-[2.5rem]`} />
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 flex justify-end gap-2 border-t border-stone-100 px-5 py-4 bg-stone-50/80 rounded-b-2xl">
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-sm px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createBusy}
                onClick={() => void submitNewAccount()}
                className="text-sm px-4 py-2 rounded-lg bg-[#2d6a4f] text-white hover:bg-[#1b4332] disabled:opacity-50"
              >
                {createBusy ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => {
              setTab(t);
              setConfirmDelete(null);
              setEditingEmail(null);
              setDirectPwRowKey(null);
              setDirectPwTargetUserId(null);
              setDirectPwDraft('');
              setDirectPwConfirm('');
            }}
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
                  const isDirectPw = directPwRowKey === editKey;
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
                            <button
                              type="button"
                              onClick={() => startDirectPassword(editKey, admin.id)}
                              className="text-xs px-3 py-1.5 border border-amber-200 rounded-lg text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 transition-colors whitespace-nowrap"
                            >
                              Set password
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
                      {isDirectPw && (
                        <div className="mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                          <p className="text-xs text-stone-600">
                            Sets a new password immediately (no email). Share it with the user securely.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwDraft}
                              onChange={(e) => setDirectPwDraft(e.target.value)}
                              placeholder="New password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwConfirm}
                              onChange={(e) => setDirectPwConfirm(e.target.value)}
                              placeholder="Confirm password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => void saveDirectPassword()}
                              disabled={directPwSaving}
                              className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                            >
                              {directPwSaving ? 'Saving…' : 'Save password'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDirectPwRowKey(null);
                                setDirectPwTargetUserId(null);
                                setDirectPwDraft('');
                                setDirectPwConfirm('');
                              }}
                              className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
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
                    const isDirectPw = directPwRowKey === editKey;
                    return (
                      <li key={r.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{r.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{r.email} · {r.contactName} · {r.city}, {r.state}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            {r.profileId && (
                              <>
                                <button
                                  onClick={() => handlePasswordReset(r.id, () => sendPasswordResetForRestaurant(r.id))}
                                  disabled={sendingReset === r.id}
                                  className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                  {sendingReset === r.id ? 'Sending…' : 'Send Password Reset'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startDirectPassword(editKey, r.profileId)}
                                  className="text-xs px-3 py-1.5 border border-amber-200 rounded-lg text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 transition-colors whitespace-nowrap"
                                >
                                  Set password
                                </button>
                              </>
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
                        {isDirectPw && r.profileId && (
                        <div className="mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                          <p className="text-xs text-stone-600">
                            Sets a new password immediately (no email). Share it with the user securely.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwDraft}
                              onChange={(e) => setDirectPwDraft(e.target.value)}
                              placeholder="New password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwConfirm}
                              onChange={(e) => setDirectPwConfirm(e.target.value)}
                              placeholder="Confirm password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => void saveDirectPassword()}
                              disabled={directPwSaving}
                              className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                            >
                              {directPwSaving ? 'Saving…' : 'Save password'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDirectPwRowKey(null);
                                setDirectPwTargetUserId(null);
                                setDirectPwDraft('');
                                setDirectPwConfirm('');
                              }}
                              className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        )}
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
                    const isDirectPw = directPwRowKey === editKey;
                    return (
                      <li key={f.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{f.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{f.email} · {f.contactName} · {f.city}, {f.state}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                            {f.profileId && (
                              <>
                                <button
                                  onClick={() => handlePasswordReset(f.id, () => sendPasswordResetForFarm(f.id))}
                                  disabled={sendingReset === f.id}
                                  className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                  {sendingReset === f.id ? 'Sending…' : 'Send Password Reset'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startDirectPassword(editKey, f.profileId)}
                                  className="text-xs px-3 py-1.5 border border-amber-200 rounded-lg text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 transition-colors whitespace-nowrap"
                                >
                                  Set password
                                </button>
                              </>
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
                        {isDirectPw && f.profileId && (
                        <div className="mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                          <p className="text-xs text-stone-600">
                            Sets a new password immediately (no email). Share it with the user securely.
                          </p>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwDraft}
                              onChange={(e) => setDirectPwDraft(e.target.value)}
                              placeholder="New password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={directPwConfirm}
                              onChange={(e) => setDirectPwConfirm(e.target.value)}
                              placeholder="Confirm password"
                              className={`${inp} flex-1 min-w-[10rem]`}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => void saveDirectPassword()}
                              disabled={directPwSaving}
                              className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] disabled:opacity-50"
                            >
                              {directPwSaving ? 'Saving…' : 'Save password'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDirectPwRowKey(null);
                                setDirectPwTargetUserId(null);
                                setDirectPwDraft('');
                                setDirectPwConfirm('');
                              }}
                              className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                        )}
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
