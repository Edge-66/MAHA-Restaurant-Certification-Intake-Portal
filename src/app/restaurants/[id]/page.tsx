import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DishCard from '@/components/DishCard';

export const revalidate = 60;

export default async function RestaurantVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch restaurant with approved submission and approved dishes
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select(`
      *,
      submissions(id, status, reviewed_at),
      dishes(*)
    `)
    .eq('id', id)
    .single();

  if (!restaurant) {
    notFound();
  }

  const approvedSubmission = (restaurant.submissions || []).find(
    (s: { status: string }) => s.status === 'approved'
  );

  const approvedDishes = (restaurant.dishes || []).filter(
    (d: { status: string }) => d.status === 'approved'
  );

  // Determine if restaurant qualifies as MAHA Certified (7+ approved dishes)
  const isCertified =
    restaurant.participation_level === 'certified' || approvedDishes.length >= 7;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/restaurants"
        className="text-sm text-[#2d6a4f] hover:underline mb-8 inline-block"
      >
        ← Back to Directory
      </Link>

      {/* Restaurant Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1">{restaurant.name}</h1>
            <p className="text-stone-500">
              {restaurant.city}, {restaurant.state}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            {isCertified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#2d6a4f] text-white">
                MAHA Certified Restaurant
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                From the Farm Participant
              </span>
            )}
            {approvedSubmission && (
              <span className="text-xs text-stone-400">
                Approved{' '}
                {new Date(approvedSubmission.reviewed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {restaurant.description && (
          <p className="text-stone-600 mb-4">{restaurant.description}</p>
        )}

        {restaurant.website && (
          <a
            href={restaurant.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#2d6a4f] hover:underline"
          >
            Visit Website →
          </a>
        )}
      </div>

      {/* Certification Status */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-3">Certification Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-green-700 font-medium">Participation Level</div>
            <div className="text-green-900 capitalize">
              {isCertified ? 'MAHA Certified Restaurant' : 'From the Farm Participant'}
            </div>
          </div>
          <div>
            <div className="text-green-700 font-medium">Certified Dishes</div>
            <div className="text-green-900">{approvedDishes.length}</div>
          </div>
          <div>
            <div className="text-green-700 font-medium">Status</div>
            <div className="text-green-900 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Certified Dishes */}
      {approvedDishes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Certified Dishes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedDishes.map((dish: Parameters<typeof DishCard>[0]['dish']) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </div>
      )}

      {/* Non-Negotiables Met */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          MAHA Standards — Non-Negotiables
        </h2>
        <p className="text-sm text-stone-600 mb-4">
          All certified dishes at this restaurant meet the following requirements for their main element:
        </p>
        <ul className="space-y-3">
          {[
            'No added hormones or routine antibiotics (animal products)',
            'No chemical preservatives (raw or minimally processed meat)',
            'No seed oils, synthetic dyes, or artificial additives',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="text-stone-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transparency Statement */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
        <p className="text-sm text-stone-500 italic">
          Certified dishes meet MAHA standards for the main element only and may be subject to
          ongoing review. Certification is based on restaurant attestation, supplier transparency,
          and selective verification.
        </p>
      </div>
    </div>
  );
}
