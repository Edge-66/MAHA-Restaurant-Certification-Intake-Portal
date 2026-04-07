import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';

export default async function RestaurantDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'restaurant' || !profile.restaurant_id) {
    redirect('/login');
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select(`
      *,
      submissions (
        id, status, submitted_at, reviewed_at, admin_notes,
        dishes (id, name, category, main_element, supplier_name, supplier_city, supplier_state, status)
      )
    `)
    .eq('id', profile.restaurant_id)
    .single();

  if (!restaurant) redirect('/login');

  const submissions = restaurant.submissions ?? [];
  const allDishes = submissions.flatMap((s: { dishes?: unknown[] }) => s.dishes ?? []) as {
    id: string; name: string; category: string; main_element: string;
    supplier_name: string; supplier_city: string | null; supplier_state: string | null; status: string;
  }[];
  const approvedDishes = allDishes.filter((d) => d.status === 'approved');
  const pendingSubmissions = submissions.filter((s: { status: string }) => s.status === 'pending' || s.status === 'needs_clarification');
  const isApproved = submissions.some((s: { status: string }) => s.status === 'approved');

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-sm text-stone-500 mb-1">Restaurant Dashboard</p>
          <h1 className="text-2xl font-bold text-stone-900">{restaurant.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">{restaurant.city}, {restaurant.state}</p>
        </div>
        <div className="flex items-center gap-3">
          {isApproved && (
            <Link
              href="/directory"
              className="text-sm text-[#2d6a4f] hover:underline font-medium"
            >
              View Public Listing →
            </Link>
          )}
          <Link
            href="/apply"
            className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors"
          >
            Submit New Dishes
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Submissions', value: submissions.length },
          { label: 'Pending Review', value: pendingSubmissions.length },
          { label: 'Approved Dishes', value: approvedDishes.length },
          { label: 'Total Dishes', value: allDishes.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-2xl font-bold text-stone-900 mb-0.5">{value}</div>
            <div className="text-xs text-stone-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Certification progress bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              {restaurant.participation_level === 'certified' ? 'MAHA Certified Restaurant' : 'Certification Progress'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {restaurant.participation_level === 'certified'
                ? 'Your restaurant has achieved full MAHA Certified status.'
                : `${approvedDishes.length} of 7 dishes certified — ${Math.max(0, 7 - approvedDishes.length)} more needed for MAHA Certified status`}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
            restaurant.participation_level === 'certified'
              ? 'bg-[#2d6a4f] text-white'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {restaurant.participation_level === 'certified' ? 'MAHA Certified' : 'Participant'}
          </span>
        </div>
        <div className="w-full bg-stone-100 rounded-full h-2">
          <div
            className="bg-[#2d6a4f] h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.round((approvedDishes.length / 7) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-stone-400">{approvedDishes.length} approved</span>
          <span className="text-xs text-stone-400">7 = MAHA Certified</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Approved Dishes */}
        {approvedDishes.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">Certified Dishes</h2>
              <span className="text-xs text-[#2d6a4f] font-medium bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
                {approvedDishes.length} approved
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {approvedDishes.map((dish) => (
                <div key={dish.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-900 text-sm">{dish.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {dish.main_element} — {dish.supplier_name}
                      {(dish.supplier_city || dish.supplier_state) && (
                        <>, {[dish.supplier_city, dish.supplier_state].filter(Boolean).join(', ')}</>
                      )}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 flex-shrink-0">
                    {dish.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submissions */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900">Submissions</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="px-6 py-10 text-center text-stone-500 text-sm">
              <p className="mb-4">No submissions yet.</p>
              <Link
                href="/apply"
                className="inline-block bg-[#2d6a4f] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors"
              >
                Submit Your First Dishes
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {submissions.map((submission: {
                id: string; status: string; submitted_at: string;
                reviewed_at: string | null; admin_notes: string | null;
                dishes?: { id: string; status: string }[];
              }) => {
                const dishCount = submission.dishes?.length ?? 0;
                const approvedCount = submission.dishes?.filter((d) => d.status === 'approved').length ?? 0;
                return (
                  <div key={submission.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          Submitted{' '}
                          {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {dishCount} dish{dishCount !== 1 ? 'es' : ''} · {approvedCount} approved
                        </p>
                      </div>
                      <StatusBadge status={submission.status} />
                    </div>
                    {submission.status === 'needs_clarification' && submission.admin_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 mt-2">
                        <span className="font-semibold">Note from MAHA:</span> {submission.admin_notes}
                      </div>
                    )}
                    {submission.reviewed_at && submission.status !== 'pending' && (
                      <p className="text-xs text-stone-400 mt-2">
                        Reviewed {new Date(submission.reviewed_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Restaurant info */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Your Info on File</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-stone-500">Contact:</span>{' '}
              <span className="text-stone-900">{restaurant.contact_name}</span>
            </div>
            <div>
              <span className="text-stone-500">Email:</span>{' '}
              <span className="text-stone-900">{restaurant.contact_email}</span>
            </div>
            <div>
              <span className="text-stone-500">Phone:</span>{' '}
              <span className="text-stone-900">{restaurant.contact_phone}</span>
            </div>
            <div>
              <span className="text-stone-500">Address:</span>{' '}
              <span className="text-stone-900">
                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
              </span>
            </div>
            <div>
              <span className="text-stone-500">Participation level:</span>{' '}
              <span className="text-stone-900 capitalize">{restaurant.participation_level}</span>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-4">
            To update your info, contact MAHA directly.
          </p>
        </div>
      </div>
    </div>
  );
}
