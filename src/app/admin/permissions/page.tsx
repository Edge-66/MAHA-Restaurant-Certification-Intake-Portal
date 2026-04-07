'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getAdminUsers,
  updateAdminTier,
  deleteAdminAccount,
  getRestaurantUsers,
  getFarmUsers,
  deleteRestaurantAccount,
  deleteFarm,
  type RestaurantUser,
  type FarmUser,
} from '@/lib/actions';

const TIER_LABELS: Record<number, string> = {
  1: 'Editor',
  2: 'Reviewer',
  3: 'Super Admin',
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

  // Admins
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [tierUpdating, setTierUpdating] = useState<string | null>(null);
  const [adminDeleting, setAdminDeleting] = useState<string | null>(null);
  const [adminConfirmDelete, setAdminConfirmDelete] = useState<string | null>(null);
  const [adminMsg, setAdminMsg] = useState<FeedbackMsg | null>(null);

  // Restaurants
  const [restaurants, setRestaurants] = useState<RestaurantUser[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantDeleting, setRestaurantDeleting] = useState<string | null>(null);
  const [restaurantConfirmDelete, setRestaurantConfirmDelete] = useState<string | null>(null);
  const [restaurantMsg, setRestaurantMsg] = useState<FeedbackMsg | null>(null);

  // Farms
  const [farms, setFarms] = useState<FarmUser[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmDeleting, setFarmDeleting] = useState<string | null>(null);
  const [farmConfirmDelete, setFarmConfirmDelete] = useState<string | null>(null);
  const [farmMsg, setFarmMsg] = useState<FeedbackMsg | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMyId(data.user.id);
      const { data: profile } = await supabase
        .from('profiles').select('admin_tier').eq('id', data.user.id).single();
      setMyTier(profile?.admin_tier ?? 1);
    });

    getAdminUsers().then((list) => { setAdmins(list); setAdminsLoading(false); });
    getRestaurantUsers().then((list) => { setRestaurants(list); setRestaurantsLoading(false); });
    getFarmUsers().then((list) => { setFarms(list); setFarmsLoading(false); });
  }, []);

  function isMaster(email: string) {
    return !!masterEmail && email.toLowerCase() === masterEmail.toLowerCase();
  }

  // ── Admin tier change ──────────────────────────────────────────────────────
  async function handleTierChange(targetId: string, newTier: number) {
    setTierUpdating(targetId);
    setAdminMsg(null);
    const result = await updateAdminTier(targetId, newTier);
    if (result.error) {
      setAdminMsg({ type: 'error', text: result.error });
    } else {
      setAdmins((prev) => prev.map((a) => a.id === targetId ? { ...a, tier: newTier } : a));
      setAdminMsg({ type: 'success', text: 'Permission tier updated.' });
    }
    setTierUpdating(null);
  }

  // ── Admin delete ───────────────────────────────────────────────────────────
  async function handleAdminDelete(targetId: string) {
    setAdminDeleting(targetId);
    setAdminMsg(null);
    const result = await deleteAdminAccount(targetId);
    if (result.error) {
      setAdminMsg({ type: 'error', text: result.error });
    } else {
      setAdmins((prev) => prev.filter((a) => a.id !== targetId));
      setAdminMsg({ type: 'success', text: 'Admin account removed.' });
    }
    setAdminDeleting(null);
    setAdminConfirmDelete(null);
  }

  // ── Restaurant delete ──────────────────────────────────────────────────────
  async function handleRestaurantDelete(restaurantId: string) {
    setRestaurantDeleting(restaurantId);
    setRestaurantMsg(null);
    const result = await deleteRestaurantAccount(restaurantId);
    if (result.error) {
      setRestaurantMsg({ type: 'error', text: result.error });
      setRestaurantDeleting(null);
    } else {
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
      setRestaurantMsg({ type: 'success', text: 'Restaurant account removed.' });
      setRestaurantDeleting(null);
    }
    setRestaurantConfirmDelete(null);
  }

  // ── Farm delete ────────────────────────────────────────────────────────────
  async function handleFarmDelete(farmId: string) {
    setFarmDeleting(farmId);
    setFarmMsg(null);
    const result = await deleteFarm(farmId);
    if (result.error) {
      setFarmMsg({ type: 'error', text: result.error });
      setFarmDeleting(null);
    } else {
      setFarms((prev) => prev.filter((f) => f.id !== farmId));
      setFarmMsg({ type: 'success', text: 'Farm account removed.' });
      setFarmDeleting(null);
    }
    setFarmConfirmDelete(null);
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

  const msgBox = (msg: FeedbackMsg | null) => msg ? (
    <div className={`mb-5 px-4 py-3 rounded-lg text-sm ${
      msg.type === 'success'
        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-1">Permissions</h1>
        <p className="text-sm text-stone-500">Manage access levels and remove accounts. The master admin account is protected.</p>
      </div>

      {/* ── Admin Accounts ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-1">Admin Accounts</h2>
        <p className="text-sm text-stone-500 mb-5">Change permission tiers or remove admin accounts.</p>
        {msgBox(adminMsg)}
        {adminsLoading ? (
          <div className="text-sm text-stone-400">Loading…</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {admins.map((admin) => {
              const locked = isMaster(admin.email) || admin.id === myId;
              const isSelf = admin.id === myId;
              return (
                <li key={admin.id} className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-stone-900 truncate">{admin.email}</p>
                        {isSelf && <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">You</span>}
                        {isMaster(admin.email) && (
                          <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Master Account</span>
                        )}
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
                      {!locked && (
                        adminConfirmDelete === admin.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-stone-500">Remove?</span>
                            <button
                              onClick={() => handleAdminDelete(admin.id)}
                              disabled={adminDeleting === admin.id}
                              className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              {adminDeleting === admin.id ? '…' : 'Yes'}
                            </button>
                            <button onClick={() => setAdminConfirmDelete(null)} className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAdminConfirmDelete(admin.id)}
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

      {/* ── Restaurant Accounts ────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-1">Restaurant Accounts</h2>
        <p className="text-sm text-stone-500 mb-5">Remove restaurant accounts and all associated submissions and dishes.</p>
        {msgBox(restaurantMsg)}
        {restaurantsLoading ? (
          <div className="text-sm text-stone-400">Loading…</div>
        ) : restaurants.length === 0 ? (
          <div className="text-sm text-stone-400">No restaurant accounts found.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {restaurants.map((r) => (
              <li key={r.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{r.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{r.email} · {r.city}, {r.state}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {restaurantConfirmDelete === r.id ? (
                    <>
                      <span className="text-xs text-stone-500">Remove?</span>
                      <button
                        onClick={() => handleRestaurantDelete(r.id)}
                        disabled={restaurantDeleting === r.id}
                        className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {restaurantDeleting === r.id ? '…' : 'Yes'}
                      </button>
                      <button onClick={() => setRestaurantConfirmDelete(null)} className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setRestaurantConfirmDelete(r.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Farm Accounts ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-1">Farm Accounts</h2>
        <p className="text-sm text-stone-500 mb-5">Remove farm accounts and all associated data.</p>
        {msgBox(farmMsg)}
        {farmsLoading ? (
          <div className="text-sm text-stone-400">Loading…</div>
        ) : farms.length === 0 ? (
          <div className="text-sm text-stone-400">No farm accounts found.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {farms.map((f) => (
              <li key={f.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{f.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{f.email} · {f.city}, {f.state}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {farmConfirmDelete === f.id ? (
                    <>
                      <span className="text-xs text-stone-500">Remove?</span>
                      <button
                        onClick={() => handleFarmDelete(f.id)}
                        disabled={farmDeleting === f.id}
                        className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {farmDeleting === f.id ? '…' : 'Yes'}
                      </button>
                      <button onClick={() => setFarmConfirmDelete(null)} className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setFarmConfirmDelete(f.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
