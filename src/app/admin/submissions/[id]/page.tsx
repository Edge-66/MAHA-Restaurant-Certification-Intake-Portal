'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DishCard from '@/components/DishCard';
import type { SubmissionWithDetails } from '@/lib/types';
import { deleteDish, reviewSubmissionAdmin, sendPasswordResetForRestaurant, updateDishStatus } from '@/lib/actions';

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
  const [deletingDish, setDeletingDish] = useState<string | null>(null);
  const [confirmDeleteDish, setConfirmDeleteDish] = useState<string | null>(null);
  const [pwResetting, setPwResetting] = useState(false);
  const [pwResetMsg, setPwResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [otherSubmissions, setOtherSubmissions] = useState<
    { id: string; status: string; submitted_at: string; dishes: { id: string }[] }[]
  >([]);

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

      const restaurantId = (data as { restaurant_id?: string }).restaurant_id;
      if (restaurantId) {
        const { data: others } = await supabase
          .from('submissions')
          .select('id, status, submitted_at, dishes(id)')
          .eq('restaurant_id', restaurantId)
          .neq('id', id)
          .order('submitted_at', { ascending: false });
        setOtherSubmissions((others ?? []) as { id: string; status: string; submitted_at: string; dishes: { id: string }[] }[]);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    const res = await reviewSubmissionAdmin(
      id,
      selectedStatus as 'pending' | 'approved' | 'rejected' | 'needs_clarification',
      adminNotes,
      participationLevel
    );
    if (res.error) {
      alert(res.error);
      setSaving(false);
      return;
    }

    await fetchSubmission();

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDishAction = async (dishId: string, status: 'approved' | 'rejected') => {
    await updateDishStatus(dishId, status);
    await fetchSubmission();
  };

  async function handleDeleteDish(dishId: string) {
    setDeletingDish(dishId);
    const result = await deleteDish(dishId);
    if (result.error) {
      alert(result.error);
    } else {
      await fetchSubmission();
    }
    setDeletingDish(null);
    setConfirmDeleteDish(null);
  }

  async function handlePwReset() {
    if (!submission) return;
    setPwResetting(true);
    setPwResetMsg(null);
    const result = await sendPasswordResetForRestaurant(submission.restaurants.id);
    if (result.error) {
      setPwResetMsg({ type: 'error', text: result.error });
    } else {
      setPwResetMsg({ type: 'success', text: 'Password reset email sent to the restaurant owner.' });
    }
    setPwResetting(false);
  }

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
        <button onClick={() => router.push('/admin/restaurants')} className="block mx-auto mt-4 text-[#2d6a4f] hover:underline">
          ← Back to restaurant admin
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
        onClick={() => router.push('/admin/restaurants')}
        className="text-sm text-[#2d6a4f] hover:underline mb-6 inline-block"
      >
        ← Back to restaurant admin
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

      {/* Other submissions from this restaurant */}
      {otherSubmissions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs font-semibold text-amber-900 mb-2 uppercase tracking-wide">
            Other submissions from this restaurant
          </p>
          <div className="flex flex-wrap gap-2">
            {otherSubmissions.map((s) => (
              <a
                key={s.id}
                href={`/admin/submissions/${s.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {new Date(s.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="text-amber-600">·</span>
                {s.dishes.length} dish{s.dishes.length === 1 ? '' : 'es'}
                <span className="text-amber-600">·</span>
                <StatusBadge status={s.status} />
              </a>
            ))}
          </div>
        </div>
      )}

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
          {restaurant.health_practices && restaurant.health_practices.length > 0 && (
            <div className="sm:col-span-2">
              <span className="font-medium text-stone-600 block mb-2">Better Health Practices</span>
              <div className="flex flex-wrap gap-1.5">
                {restaurant.health_practices.map((p: string) => (
                  <span key={p} className="inline-flex items-center gap-1 bg-[#2d6a4f]/8 text-[#2d6a4f] text-xs font-medium px-2.5 py-1 rounded-full border border-[#2d6a4f]/20">
                    <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {p}
                  </span>
                ))}
              </div>
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
                <div className="flex gap-2 mt-2 ml-1 flex-wrap">
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
                  {adminTier >= 3 && (
                    confirmDeleteDish === dish.id ? (
                      <>
                        <span className="text-xs text-stone-500 self-center">Delete dish?</span>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          disabled={deletingDish === dish.id}
                          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                        >
                          {deletingDish === dish.id ? '…' : 'Yes, Delete'}
                        </button>
                        <button onClick={() => setConfirmDeleteDish(null)} className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50">Cancel</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteDish(dish.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Delete Dish
                      </button>
                    )
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
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
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

      {/* Danger Zone — Tier 3 only */}
      {adminTier >= 3 && (
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-stone-500 mb-5">Super Admin actions — permanent and cannot be undone.</p>

          {pwResetMsg && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              pwResetMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {pwResetMsg.text}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-900">Send Password Reset</p>
              <p className="text-xs text-stone-500 mt-0.5">Emails a password reset link to {restaurant.contact_email}.</p>
            </div>
            <button
              onClick={handlePwReset}
              disabled={pwResetting}
              className="flex-shrink-0 text-xs px-3 py-1.5 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {pwResetting ? 'Sending…' : 'Send Reset Email'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
