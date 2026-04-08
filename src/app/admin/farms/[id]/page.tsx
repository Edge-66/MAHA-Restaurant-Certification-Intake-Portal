'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import FarmReviewActions from '@/components/FarmReviewActions';
import type { Farm } from '@/lib/types';
import { sendPasswordResetForFarm, deleteFarm } from '@/lib/actions';
import { parseFarmTagField, serializeFarmTagsFromText } from '@/lib/farmTags';

function parsePhotoUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminFarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTier, setAdminTier] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dangerConfirm, setDangerConfirm] = useState<'reset' | 'delete' | null>(null);
  const [dangerWorking, setDangerWorking] = useState(false);
  const [dangerMessage, setDangerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editFields, setEditFields] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    description: '',
    livestock_types: '',
    produce_types: '',
    regenerative_practices: '',
    certifications: '',
    farm_practices_other: '',
  });

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setAdminEmail(data.user.email ?? '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_tier')
        .eq('id', data.user.id)
        .single();
      setAdminTier(profile?.admin_tier ?? 1);
    });
  }, []);

  const fetchFarm = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('farms')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setFarm(data as Farm);
      setEditFields({
        contact_name: data.contact_name || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        description: data.description || '',
        livestock_types: parseFarmTagField(data.livestock_types).join(', '),
        produce_types: parseFarmTagField(data.produce_types).join(', '),
        regenerative_practices: parseFarmTagField(data.regenerative_practices).join(', '),
        certifications: parseFarmTagField(data.certifications).join(', '),
        farm_practices_other: (data as Farm).farm_practices_other?.trim() ?? '',
      });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchFarm();
  }, [fetchFarm]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = getSupabase();
    const {
      livestock_types,
      produce_types,
      regenerative_practices,
      certifications,
      farm_practices_other,
      ...profileRest
    } = editFields;
    await supabase
      .from('farms')
      .update({
        ...profileRest,
        livestock_types: serializeFarmTagsFromText(livestock_types),
        produce_types: serializeFarmTagsFromText(produce_types),
        regenerative_practices: serializeFarmTagsFromText(regenerative_practices),
        certifications: serializeFarmTagsFromText(certifications),
        farm_practices_other: farm_practices_other.trim() || null,
        updated_at: new Date().toISOString(),
        reviewed_by: adminEmail || null,
      })
      .eq('id', id);
    await fetchFarm();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const supabase = getSupabase();
    const ext = file.name.split('.').pop();
    const path = `farms/${id}/hero-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
      await supabase.from('farms').update({
        hero_image_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      await fetchFarm();
    }
    setUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const supabase = getSupabase();
    const currentPhotos: string[] = parsePhotoUrls(farm?.photo_urls);
    const newUrls = [...currentPhotos];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `farms/${id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(path, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }

    await supabase.from('farms').update({
      photo_urls: JSON.stringify(newUrls),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await fetchFarm();
    setUploading(false);
  };

  const removeGalleryPhoto = async (urlToRemove: string) => {
    const supabase = getSupabase();
    const currentPhotos: string[] = parsePhotoUrls(farm?.photo_urls);
    const updated = currentPhotos.filter((u) => u !== urlToRemove);

    await supabase.from('farms').update({
      photo_urls: JSON.stringify(updated),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    await fetchFarm();
  };

  async function handleFarmPasswordReset() {
    setDangerWorking(true);
    setDangerMessage(null);
    const result = await sendPasswordResetForFarm(id);
    if (result.error) {
      setDangerMessage({ type: 'error', text: result.error });
    } else {
      setDangerMessage({ type: 'success', text: 'Password reset email sent to the farm owner.' });
    }
    setDangerWorking(false);
    setDangerConfirm(null);
  }

  async function handleDeleteFarm() {
    setDangerWorking(true);
    setDangerMessage(null);
    const result = await deleteFarm(id);
    if (result.error) {
      setDangerMessage({ type: 'error', text: result.error });
      setDangerWorking(false);
      setDangerConfirm(null);
    } else {
      router.push('/admin/farmers');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d6a4f]"></div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="text-center py-20 text-stone-500">
        Farm not found.
        <button onClick={() => router.push('/admin/farmers')} className="block mx-auto mt-4 text-[#2d6a4f] hover:underline">
          ← Back to farmer admin
        </button>
      </div>
    );
  }

  const galleryPhotos = parsePhotoUrls(farm.photo_urls);

  return (
    <div className="max-w-4xl">
      {saved && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium">
          Changes saved successfully.
        </div>
      )}
      <button
        onClick={() => router.push('/admin/farmers')}
        className="text-sm text-[#2d6a4f] hover:underline mb-6 inline-block"
      >
        ← Back to farmer admin
      </button>

      {farm.status === 'pending' && (
        <div className="mb-6 rounded-xl border border-[#2d6a4f]/30 bg-[#2d6a4f]/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-700">
            <strong className="text-stone-900">Review workspace:</strong> Approve / reject / pending with certification
            checks and queue navigation.
          </p>
          <Link
            href={`/admin/farms/${id}/review`}
            className="shrink-0 text-sm font-semibold text-white bg-[#2d6a4f] hover:bg-[#1b4332] px-4 py-2 rounded-lg transition-colors"
          >
            Open farm review →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{farm.name}</h1>
          <p className="text-stone-500 text-sm">{farm.city}, {farm.state}</p>
        </div>
        <StatusBadge status={farm.status} />
      </div>

      {/* Contact Info — editable */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact Name</label>
            <input type="text" value={editFields.contact_name}
              onChange={(e) => setEditFields({ ...editFields, contact_name: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input type="email" value={editFields.contact_email}
              onChange={(e) => setEditFields({ ...editFields, contact_email: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
            <input type="text" value={editFields.contact_phone}
              onChange={(e) => setEditFields({ ...editFields, contact_phone: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
            <input type="url" value={editFields.website}
              onChange={(e) => setEditFields({ ...editFields, website: e.target.value })}
              placeholder="https://"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Street Address</label>
            <input type="text" value={editFields.address}
              onChange={(e) => setEditFields({ ...editFields, address: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
            <input type="text" value={editFields.city}
              onChange={(e) => setEditFields({ ...editFields, city: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
              <input type="text" value={editFields.state} maxLength={2}
                onChange={(e) => setEditFields({ ...editFields, state: e.target.value.toUpperCase() })}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">ZIP</label>
              <input type="text" value={editFields.zip}
                onChange={(e) => setEditFields({ ...editFields, zip: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Editable Farm Details */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Farm Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
            <textarea
              value={editFields.description}
              onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
              rows={3}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Livestock Types</label>
              <input
                type="text"
                value={editFields.livestock_types}
                onChange={(e) => setEditFields({ ...editFields, livestock_types: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                placeholder="Comma-separated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Produce Types</label>
              <input
                type="text"
                value={editFields.produce_types}
                onChange={(e) => setEditFields({ ...editFields, produce_types: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                placeholder="Comma-separated"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Regenerative Practices</label>
            <textarea
              value={editFields.regenerative_practices}
              onChange={(e) => setEditFields({ ...editFields, regenerative_practices: e.target.value })}
              rows={2}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
              placeholder="Comma-separated"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Certifications</label>
            <input
              type="text"
              value={editFields.certifications}
              onChange={(e) => setEditFields({ ...editFields, certifications: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
              placeholder="Comma-separated"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Other practices (free text)</label>
            <textarea
              value={editFields.farm_practices_other}
              onChange={(e) => setEditFields({ ...editFields, farm_practices_other: e.target.value })}
              rows={2}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
              placeholder="From applicant “Other” field — verify before promoting"
            />
          </div>
        </div>
      </div>

      {/* Hero Image Management */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Hero Image</h2>
        <p className="text-xs text-stone-500 mb-4">This is the main banner image shown on the farm&apos;s profile page.</p>
        {farm.hero_image_url ? (
          <div className="mb-4">
            <img src={farm.hero_image_url} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
          </div>
        ) : (
          <div className="mb-4 h-32 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-sm">
            No hero image set
          </div>
        )}
        <label className="inline-block bg-white border border-stone-300 rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors">
          {uploading ? 'Uploading...' : 'Upload Hero Image'}
          <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Gallery Management */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Photo Gallery</h2>
        <p className="text-xs text-stone-500 mb-4">These photos appear on the farm&apos;s public profile page.</p>
        {galleryPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {galleryPhotos.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-32 object-cover rounded-lg" />
                <button
                  onClick={() => removeGalleryPhoto(url)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 h-24 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-sm">
            No gallery photos
          </div>
        )}
        <label className="inline-block bg-white border border-stone-300 rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors">
          {uploading ? 'Uploading...' : 'Add Photos'}
          <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Status & review actions */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-2">Listing status</h2>
        <p className="text-sm text-stone-500 mb-4">
          Use <strong>Approve</strong>, <strong>Reject</strong>, or <strong>Pending</strong> for decisions. For pending
          applications, the{' '}
          <Link href={`/admin/farms/${id}/review`} className="text-[#2d6a4f] font-medium hover:underline">
            review workspace
          </Link>{' '}
          shows certifications and queue navigation.
        </p>
        <FarmReviewActions
          farmId={id}
          certType={farm.cert_type}
          adminTier={adminTier}
          onCompleted={() => fetchFarm()}
        />
        <div className="mt-6 pt-6 border-t border-stone-100">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-white border border-stone-300 text-stone-800 px-6 py-2.5 rounded-lg font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile & farm details only'}
          </button>
          <p className="text-xs text-stone-400 mt-2">
            Saves contact info, description, and types below without changing listing status.
          </p>
        </div>
        {farm.reviewed_by && farm.updated_at && (
          <p className="text-xs text-stone-400 mt-4">
            Last listing update by <span className="font-medium text-stone-500">{farm.reviewed_by}</span> on{' '}
            {new Date(farm.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
      {/* Danger Zone — Tier 3 only */}
      {adminTier >= 3 && (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-stone-500 mb-5">These actions are permanent and cannot be undone.</p>

          {dangerMessage && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              dangerMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {dangerMessage.text}
            </div>
          )}

          <div className="space-y-3">
            {/* Reset Password */}
            <div className="flex items-center justify-between gap-4 py-3 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-900">Send Password Reset</p>
                <p className="text-xs text-stone-500 mt-0.5">Sends a password reset email to the farm owner&apos;s account.</p>
              </div>
              {dangerConfirm === 'reset' ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-stone-500">Send reset?</span>
                  <button
                    onClick={handleFarmPasswordReset}
                    disabled={dangerWorking}
                    className="text-xs px-3 py-1.5 bg-[#2d6a4f] text-white rounded-lg hover:bg-[#1b4332] transition-colors disabled:opacity-50"
                  >
                    {dangerWorking ? 'Sending…' : 'Send'}
                  </button>
                  <button onClick={() => setDangerConfirm(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setDangerConfirm('reset')}
                  className="flex-shrink-0 text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Send Reset Email
                </button>
              )}
            </div>

            {/* Delete Farm */}
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-red-700">Delete Farm</p>
                <p className="text-xs text-stone-500 mt-0.5">Permanently removes this farm and its linked account. This cannot be undone.</p>
              </div>
              {dangerConfirm === 'delete' ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-stone-500">Are you sure?</span>
                  <button
                    onClick={handleDeleteFarm}
                    disabled={dangerWorking}
                    className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {dangerWorking ? 'Deleting…' : 'Delete'}
                  </button>
                  <button onClick={() => setDangerConfirm(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setDangerConfirm('delete')}
                  className="flex-shrink-0 text-xs px-3 py-1.5 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete Farm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
