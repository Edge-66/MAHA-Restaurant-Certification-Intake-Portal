'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateRestaurantContact, updateFarmContact } from '@/lib/actions';

interface ContactFields {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
}

export default function DashboardAccountPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'restaurant' | 'farm' | null>(null);
  const [entityId, setEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(true);

  const [contact, setContact] = useState<ContactFields>({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, restaurant_id, farm_id')
        .eq('id', user.id)
        .single();

      if (!profile) { setLoading(false); return; }

      setRole(profile.role as 'restaurant' | 'farm');

      if (profile.role === 'restaurant' && profile.restaurant_id) {
        setEntityId(profile.restaurant_id);
        const { data } = await supabase
          .from('restaurants')
          .select('name, contact_name, contact_email, contact_phone, website')
          .eq('id', profile.restaurant_id)
          .single();
        if (data) {
          setEntityName(data.name);
          setContact({
            contact_name: data.contact_name ?? '',
            contact_email: data.contact_email ?? '',
            contact_phone: data.contact_phone ?? '',
            website: data.website ?? '',
          });
        }
      } else if (profile.role === 'farm' && profile.farm_id) {
        setEntityId(profile.farm_id);
        const { data } = await supabase
          .from('farms')
          .select('name, contact_name, contact_email, contact_phone, website')
          .eq('id', profile.farm_id)
          .single();
        if (data) {
          setEntityName(data.name);
          setContact({
            contact_name: data.contact_name ?? '',
            contact_email: data.contact_email ?? '',
            contact_phone: data.contact_phone ?? '',
            website: data.website ?? '',
          });
        }
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleContactSave(e: React.FormEvent) {
    e.preventDefault();
    setContactMessage(null);
    setContactSaving(true);

    const fields = {
      contact_name: contact.contact_name,
      contact_email: contact.contact_email,
      contact_phone: contact.contact_phone,
      website: contact.website || null,
    };

    const result = role === 'restaurant'
      ? await updateRestaurantContact(entityId, fields)
      : await updateFarmContact(entityId, fields);

    if (result.error) {
      setContactMessage({ type: 'error', text: result.error });
    } else {
      setContactMessage({ type: 'success', text: 'Contact information updated.' });
    }
    setContactSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

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

  const inputClass =
    'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d6a4f]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-8">Account Settings</h1>

      {/* Profile summary */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Email</span>
            <span className="text-stone-900 font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-500">Role</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2d6a4f]/10 text-[#2d6a4f] capitalize">
              {role}
            </span>
          </div>
          {entityName && (
            <div className="flex items-center justify-between">
              <span className="text-stone-500">{role === 'restaurant' ? 'Restaurant' : 'Farm'}</span>
              <span className="text-stone-900 font-medium">{entityName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      {role && entityId && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-1">Contact Information</h2>
          <p className="text-sm text-stone-500 mb-5">
            Updates what MAHA has on file. Contact MAHA directly for address or name changes.
          </p>
          {contactMessage && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              contactMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {contactMessage.text}
            </div>
          )}
          <form onSubmit={handleContactSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={contact.contact_name}
                  onChange={(e) => setContact({ ...contact, contact_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contact.contact_email}
                  onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={contact.contact_phone}
                  onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
                <input
                  type="url"
                  value={contact.website}
                  onChange={(e) => setContact({ ...contact, website: e.target.value })}
                  placeholder="https://"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={contactSaving}
              className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50"
            >
              {contactSaving ? 'Saving…' : 'Save Contact Info'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
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
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Re-enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50"
          >
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
