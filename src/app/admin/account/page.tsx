'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const TIER_LABELS: Record<number, string> = {
  1: 'Editor',
  2: 'Reviewer',
  3: 'Super Admin',
};

const TIER_PERMISSIONS: Record<number, string[]> = {
  1: [
    'View all restaurant submissions and farm applications',
    'Edit restaurant and farm contact info, images, and descriptions',
  ],
  2: [
    'Everything in Tier 1 (Editor)',
    'Approve or reject restaurant submissions and farm applications',
    'Edit admin notes and change participation levels',
    'Actions are attributed in the audit trail',
  ],
  3: [
    'Everything in Tier 2 (Reviewer)',
    'Manage admin accounts and permission tiers',
    'Remove admin, farm, and restaurant accounts',
    'Delete dishes and reset passwords for any user',
  ],
};

interface ActivityItem {
  type: 'submission' | 'farm';
  label: string;
  status: string;
  date: string;
}

export default function AdminAccountPage() {
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [adminTier, setAdminTier] = useState(1);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? '');
      setCreatedAt(user.created_at ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_tier')
        .eq('id', user.id)
        .single();

      setAdminTier(profile?.admin_tier ?? 1);

      const [{ data: subs }, { data: farms }] = await Promise.all([
        supabase
          .from('submissions')
          .select('id, status, reviewed_at, restaurants(name)')
          .eq('reviewed_by', user.email)
          .order('reviewed_at', { ascending: false })
          .limit(20),
        supabase
          .from('farms')
          .select('id, name, status, updated_at')
          .eq('reviewed_by', user.email)
          .order('updated_at', { ascending: false })
          .limit(20),
      ]);

      const items: ActivityItem[] = [];
      (subs ?? []).forEach((s: { status: string; reviewed_at: string | null; restaurants: { name?: string } | { name?: string }[] | null }) => {
        if (!s.reviewed_at) return;
        const restaurantName = Array.isArray(s.restaurants)
          ? s.restaurants[0]?.name
          : (s.restaurants as { name?: string } | null)?.name;
        items.push({
          type: 'submission',
          label: `Reviewed submission — ${restaurantName ?? 'Unknown Restaurant'}`,
          status: s.status,
          date: s.reviewed_at,
        });
      });
      (farms ?? []).forEach((f: { name: string; status: string; updated_at: string }) => {
        items.push({ type: 'farm', label: `Updated farm — ${f.name}`, status: f.status, date: f.updated_at });
      });
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(items.slice(0, 25));
      setActivityLoading(false);
    }

    load();
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword.length < 8) { setPwMessage({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    if (newPassword !== confirmPassword) { setPwMessage({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPwSaving(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage({ type: 'error', text: error.message });
    } else {
      setPwMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
  }

  const inputClass = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  const tierColor = adminTier === 3
    ? 'bg-purple-100 text-purple-800'
    : adminTier === 2
    ? 'bg-blue-100 text-blue-800'
    : 'bg-stone-100 text-stone-700';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">My Account</h1>

      {/* Profile */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Email</span>
            <span className="text-stone-900 font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Role</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2d6a4f]/10 text-[#2d6a4f]">
              Admin
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Permission Tier</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierColor}`}>
              Tier {adminTier} — {TIER_LABELS[adminTier]}
            </span>
          </div>
          {createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Account created</span>
              <span className="text-stone-900">
                {new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-1">Your Permissions</h2>
        <p className="text-sm text-stone-500 mb-4">Tier {adminTier} — {TIER_LABELS[adminTier]}</p>
        <ul className="space-y-2">
          {TIER_PERMISSIONS[adminTier]?.map((perm) => (
            <li key={perm} className="flex items-start gap-2.5 text-sm text-stone-700">
              <svg className="w-4 h-4 text-[#2d6a4f] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {perm}
            </li>
          ))}
        </ul>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Change Password</h2>
        {pwMessage && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            pwMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {pwMessage.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">New Password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Confirm New Password</label>
            <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Re-enter new password" />
          </div>
          <button type="submit" disabled={pwSaving} className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50">
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Activity Log */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Recent Activity</h2>
        {activityLoading ? (
          <div className="text-sm text-stone-400">Loading…</div>
        ) : activity.length === 0 ? (
          <div className="text-sm text-stone-400">No activity recorded yet.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {activity.map((item, i) => (
              <li key={i} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-800">{item.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                  item.status === 'approved' ? 'bg-green-100 text-green-800'
                  : item.status === 'rejected' ? 'bg-red-100 text-red-700'
                  : item.status === 'needs_clarification' ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-100 text-stone-600'
                }`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
