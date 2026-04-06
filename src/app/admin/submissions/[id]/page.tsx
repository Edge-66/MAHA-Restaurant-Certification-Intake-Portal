'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DishCard from '@/components/DishCard';
import type { SubmissionWithDetails } from '@/lib/types';
import { geocodeAddress } from '@/lib/geocode';

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
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [participationLevel, setParticipationLevel] = useState<'participant' | 'certified'>('participant');

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
    setSaving(false);
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

          <button
            onClick={handleUpdateStatus}
            disabled={saving}
            className="bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
