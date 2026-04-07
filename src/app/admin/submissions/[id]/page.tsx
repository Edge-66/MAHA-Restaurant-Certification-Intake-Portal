'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DishCard from '@/components/DishCard';
import type { SubmissionWithDetails } from '@/lib/types';
import { geocodeAddress } from '@/lib/geocode';
import { notifySubmissionDecision } from '@/lib/actions';

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [participationLevel, setParticipationLevel] = useState<'participant' | 'certified'>('participant');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTier, setAdminTier] = useState(1);

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

  const fetchSubmission = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('submissions')
      .select('*, restaurants(*), dishes(*), uploads(*)')
      .eq('id', id)
      .single();

    if (data) {
      setSubmission(data as unknown as SubmissionWithDetails);
      setAdminNotes(data.admin_notes || '');
      setSelectedStatus(data.status);
      const pl = (data as { restaurants?: { participation_level?: string } }).restaurants?.participation_level;
      if (pl === 'certified' || pl === 'participant') {
        setParticipationLevel(pl);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {
      status: selectedStatus,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail || null,
    };

    await supabase.from('submissions').update(updateData).eq('id', id);

    if (submission?.restaurants?.id) {
      await supabase
        .from('restaurants')
        .update({ participation_level: participationLevel })
        .eq('id', submission.restaurants.id);
    }

    // If approving submission, approve all pending dishes + geocode restaurant
    if (selectedStatus === 'approved' && submission) {
      const pendingDishes = submission.dishes.filter((d) => d.status === 'pending');
      for (const dish of pendingDishes) {
        await supabase
          .from('dishes')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', dish.id);
      }

      // Auto-geocode restaurant address for map
      const r = submission.restaurants;
      if (r && !r.latitude) {
        const geo = await geocodeAddress(r.address, r.city, r.state, r.zip);
        if (geo) {
          await supabase.from('restaurants').update({
            latitude: geo.latitude,
            longitude: geo.longitude,
          }).eq('id', r.id);
        }
      }
    }

    await fetchSubmission();

    // Email + in-app notification when status changes
    if (selectedStatus !== submission?.status) {
      notifySubmissionDecision(id, selectedStatus, adminNotes).catch(() => {});
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDishAction = async (dishId: string, status: 'approved' | 'rejected') => {
    const supabase = getSupabase();
    const updateData: Record<string, unknown> = { status };
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }
    await supabase.from('dishes').update(updateData).eq('id', dishId);
    await fetchSubmission();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d6a4f]"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20 text-stone-500">
        Submission not found.
        <button onClick={() => router.push('/admin/submissions')} className="block mx-auto mt-4 text-[#2d6a4f] hover:underline">
          ← Back to Submissions
        </button>
      </div>
    );
  }

  const restaurant = submission.restaurants;
  const dishes = submission.dishes || [];
  const uploads = submission.uploads || [];

  return (
    <div className="max-w-4xl">
      {saved && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium">
          Changes saved successfully.
        </div>
      )}
      <button
        onClick={() => router.push('/admin/submissions')}
        className="text-sm text-[#2d6a4f] hover:underline mb-6 inline-block"
      >
        ← Back to Submissions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{restaurant.name}</h1>
          <p className="text-stone-500 text-sm">
            Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {/* Restaurant Info */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Restaurant Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-stone-600">Contact:</span>{' '}
            <span className="text-stone-900">{restaurant.contact_name}</span>
          </div>
          <div>
            <span className="font-medium text-stone-600">Email:</span>{' '}
            <a href={`mailto:${restaurant.contact_email}`} className="text-[#2d6a4f] hover:underline">
              {restaurant.contact_email}
            </a>
          </div>
          <div>
            <span className="font-medium text-stone-600">Phone:</span>{' '}
            <span className="text-stone-900">{restaurant.contact_phone}</span>
          </div>
          {restaurant.website && (
            <div>
              <span className="font-medium text-stone-600">Website:</span>{' '}
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">
                {restaurant.website}
              </a>
            </div>
          )}
          <div className="sm:col-span-2">
            <span className="font-medium text-stone-600">Address:</span>{' '}
            <span className="text-stone-900">
              {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
            </span>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-medium text-stone-600 mb-1">Participation level</label>
            <select
              value={participationLevel}
              onChange={(e) => setParticipationLevel(e.target.value as 'participant' | 'certified')}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent max-w-xs"
            >
              <option value="participant">From the Farm Participant</option>
              <option value="certified">MAHA Certified Restaurant</option>
            </select>
            <p className="text-xs text-stone-500 mt-1">Saved when you click &quot;Update Submission&quot; below.</p>
          </div>
          {restaurant.description && (
            <div className="sm:col-span-2">
              <span className="font-medium text-stone-600">Description:</span>{' '}
              <span className="text-stone-900">{restaurant.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dishes */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Submitted Dishes ({dishes.length})
        </h2>
        <div className="space-y-4">
          {dishes.map((dish) => (
            <div key={dish.id}>
              <DishCard dish={dish} showStatus />
              {/* Certification flag */}
              {(() => {
                const cert = (dish as typeof dish & { main_element_cert_type?: string | null }).main_element_cert_type;
                if (cert === 'none') return (
                  <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                    No recognized certification — likely rejection
                  </div>
                );
                if (cert === 'other') {
                  const otherName = (dish as typeof dish & { main_element_cert_other?: string | null }).main_element_cert_other;
                  return (
                    <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                      Other certification: {otherName || 'unspecified'} — requires manual review
                    </div>
                  );
                }
                if (cert === 'aga') return (
                  <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    AGA Certified — additional verification required
                  </div>
                );
                if (cert === 'raa') return (
                  <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    Regenerative Alliance of America — additional verification required
                  </div>
                );
                if (cert === 'usda_organic') {
                  const supplierName = dish.supplier_name;
                  return (
                    <div className="mt-2 flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        USDA Organic Certified
                      </div>
                      <a
                        href={`https://organic.ams.usda.gov/integrity/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Search for "${supplierName}" on USDA Organic Integrity Database`}
                        className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2 flex-shrink-0"
                      >
                        Verify on USDA
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                      </a>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Cert document link */}
              {(() => {
                const certUrl = (dish as typeof dish & { cert_file_url?: string | null }).cert_file_url;
                if (!certUrl) return null;
                const isPdf = certUrl.toLowerCase().includes('.pdf');
                return (
                  <div className="mt-1.5 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
                    <a href={certUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2d6a4f] hover:underline font-medium">
                      {isPdf ? 'View certification PDF' : 'View certification document'}
                    </a>
                  </div>
                );
              })()}
              {adminTier >= 2 && (
                <div className="flex gap-2 mt-2 ml-1">
                  {dish.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleDishAction(dish.id, 'approved')}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve Dish
                      </button>
                      <button
                        onClick={() => handleDishAction(dish.id, 'rejected')}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Reject Dish
                      </button>
                    </>
                  )}
                  {dish.status === 'approved' && (
                    <button
                      onClick={() => handleDishAction(dish.id, 'rejected')}
                      className="text-xs px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors font-medium"
                    >
                      Revoke Approval
                    </button>
                  )}
                  {dish.status === 'rejected' && (
                    <button
                      onClick={() => handleDishAction(dish.id, 'approved')}
                      className="text-xs px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors font-medium"
                    >
                      Approve Instead
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Uploads */}
      {uploads.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Uploads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="border border-stone-200 rounded-lg overflow-hidden">
                {upload.file_type === 'image' ? (
                  <img
                    src={upload.file_url}
                    alt={upload.file_name || 'Upload'}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="p-4 flex items-center gap-3">
                    <div>
                      <a
                        href={upload.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#2d6a4f] hover:underline font-medium"
                      >
                        {upload.file_name || 'View File'}
                      </a>
                      <div className="text-xs text-stone-500">{upload.file_type}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Admin Actions</h2>

        <div className="space-y-4">
          {adminTier >= 2 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Internal Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                  placeholder="Add internal notes about this submission..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Submission Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="needs_clarification">Needs Clarification</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {selectedStatus === 'approved' && (
                  <p className="text-xs text-stone-500 mt-1">
                    Approving the submission will also approve all pending dishes.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving}
                  className="bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Submission'}
                </button>
                {submission.reviewed_by && submission.reviewed_at && (
                  <p className="text-xs text-stone-400">
                    Last reviewed by <span className="font-medium text-stone-500">{submission.reviewed_by}</span>
                    {' '}on {new Date(submission.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              You have <strong>Editor</strong> access. Approving or rejecting submissions requires Reviewer (Tier 2) or higher. Contact a Super Admin to adjust your permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
