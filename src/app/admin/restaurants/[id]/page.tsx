'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import type { Restaurant } from '@/lib/types';
import { US_STATES } from '@/lib/types';
import { geocodeAddress } from '@/lib/geocode';
import { sendPasswordResetForRestaurant, updateAdminRestaurantProfile } from '@/lib/actions';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminRestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [pwResetting, setPwResetting] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [description, setDescription] = useState('');
  const [participationLevel, setParticipationLevel] = useState<'participant' | 'certified'>('participant');
  const [healthPracticesText, setHealthPracticesText] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [baseSnapshot, setBaseSnapshot] = useState<string>('');

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from('restaurants').select('*').eq('id', id).single();
    if (data) {
      const r = data as Restaurant;
      setRestaurant(r);
      setName(r.name);
      setContactName(r.contact_name);
      setContactEmail(r.contact_email);
      setContactPhone(r.contact_phone);
      setWebsite(r.website ?? '');
      setAddress(r.address);
      setCity(r.city);
      setState(r.state);
      setZip(r.zip);
      setDescription(r.description ?? '');
      setParticipationLevel(r.participation_level === 'certified' ? 'certified' : 'participant');
      setHealthPracticesText((r.health_practices ?? []).join(', '));
      setLatitude(r.latitude != null ? String(r.latitude) : '');
      setLongitude(r.longitude != null ? String(r.longitude) : '');
      setBaseSnapshot(
        JSON.stringify({
          name: r.name,
          contactName: r.contact_name,
          contactEmail: r.contact_email,
          contactPhone: r.contact_phone,
          website: r.website ?? '',
          address: r.address,
          city: r.city,
          state: r.state,
          zip: r.zip,
          description: r.description ?? '',
          participationLevel: r.participation_level === 'certified' ? 'certified' : 'participant',
          healthPracticesText: (r.health_practices ?? []).join(', '),
          latitude: r.latitude != null ? String(r.latitude) : '',
          longitude: r.longitude != null ? String(r.longitude) : '',
        })
      );
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasUnsavedChanges = useMemo(() => {
    if (!baseSnapshot) return false;
    const current = JSON.stringify({
      name,
      contactName,
      contactEmail,
      contactPhone,
      website,
      address,
      city,
      state,
      zip,
      description,
      participationLevel,
      healthPracticesText,
      latitude,
      longitude,
    });
    return current !== baseSnapshot;
  }, [
    address,
    baseSnapshot,
    city,
    contactEmail,
    contactName,
    contactPhone,
    description,
    healthPracticesText,
    latitude,
    longitude,
    name,
    participationLevel,
    state,
    website,
    zip,
  ]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  function confirmDiscardAndGo(path: string) {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them and leave this page?')) return;
    router.push(path);
  }

  async function handleSave() {
    setSaving(true);
    const practices = healthPracticesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const lat = latitude.trim() === '' ? null : parseFloat(latitude);
    const lng = longitude.trim() === '' ? null : parseFloat(longitude);

    const res = await updateAdminRestaurantProfile(id, {
      name: name.trim(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      website: website.trim() || null,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      description: description.trim() || null,
      participation_level: participationLevel,
      health_practices: practices.length > 0 ? practices : null,
      latitude: lat != null && !Number.isNaN(lat) ? lat : null,
      longitude: lng != null && !Number.isNaN(lng) ? lng : null,
    });
    setSaving(false);
    if (res.error) {
      alert(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    await load();
  }

  async function handleGeocodeFromAddress() {
    setGeocoding(true);
    try {
      const geo = await geocodeAddress(address.trim(), city.trim(), state.trim(), zip.trim() || null);
      if (geo) {
        setLatitude(String(geo.latitude));
        setLongitude(String(geo.longitude));
      } else {
        alert('Could not find coordinates for this address.');
      }
    } finally {
      setGeocoding(false);
    }
  }

  async function handlePasswordReset() {
    setPwResetting(true);
    setPwMessage(null);
    const res = await sendPasswordResetForRestaurant(id);
    setPwResetting(false);
    if (res.error) setPwMessage({ type: 'error', text: res.error });
    else setPwMessage({ type: 'success', text: 'Password reset email sent.' });
  }

  if (loading) {
    return <div className="text-stone-500 text-sm">Loading…</div>;
  }

  if (!restaurant) {
    return (
      <div>
        <p className="text-stone-600 text-sm">Restaurant not found.</p>
        <button
          type="button"
          onClick={() => confirmDiscardAndGo('/admin/restaurants')}
          className="text-[#2d6a4f] text-sm font-medium mt-2 inline-block hover:underline"
        >
          ← Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => confirmDiscardAndGo('/admin/restaurants')}
          className="text-sm text-[#2d6a4f] hover:underline font-medium"
        >
          ← Restaurants
        </button>
      </div>

      <h1 className="text-2xl font-bold text-stone-900 mb-6">Edit restaurant</h1>

      <div className="space-y-6 bg-white border border-stone-200 rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Restaurant name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact phone</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Street address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            >
              {US_STATES.map((abbr) => (
                <option key={abbr} value={abbr}>
                  {abbr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">ZIP</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Participation level</label>
          <select
            value={participationLevel}
            onChange={(e) => setParticipationLevel(e.target.value as 'participant' | 'certified')}
            className="w-full sm:w-64 border border-stone-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="participant">Participant</option>
            <option value="certified">Certified</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Better health practices (comma-separated)
          </label>
          <textarea
            value={healthPracticesText}
            onChange={(e) => setHealthPracticesText(e.target.value)}
            rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. No seed oils, Organic produce"
          />
        </div>

        <div className="border-t border-stone-100 pt-6">
          <p className="text-sm font-medium text-stone-900 mb-3">Map coordinates</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => void handleGeocodeFromAddress()}
              disabled={geocoding || !city.trim() || !state.trim()}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              {geocoding ? 'Geocoding…' : 'Set from address (OpenStreetMap)'}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-700">Saved.</span>}
        </div>
      </div>

      <div className="mt-8 border border-stone-200 rounded-xl p-6 bg-stone-50">
        <h2 className="text-sm font-semibold text-stone-900 mb-2">Account</h2>
        <p className="text-xs text-stone-500 mb-3">
          Sends a password reset link to the contact email on file (must match the restaurant login).
        </p>
        <button
          type="button"
          onClick={() => void handlePasswordReset()}
          disabled={pwResetting}
          className="text-sm font-medium text-[#2d6a4f] hover:underline disabled:opacity-50"
        >
          {pwResetting ? 'Sending…' : 'Send password reset email'}
        </button>
        {pwMessage && (
          <p className={`mt-2 text-xs ${pwMessage.type === 'success' ? 'text-green-800' : 'text-red-700'}`}>
            {pwMessage.text}
          </p>
        )}
      </div>
    </div>
  );
}
