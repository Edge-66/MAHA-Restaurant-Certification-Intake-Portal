import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

export default async function RestaurantsPage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      *,
      submissions!inner(id, status),
      dishes(id, status)
    `)
    .eq('submissions.status', 'approved');

  const approvedRestaurants = restaurants || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Certified Restaurants</h1>
        <p className="text-stone-600">
          These restaurants have been verified for their farm-to-table sourcing practices.
        </p>
      </div>

      {approvedRestaurants.length === 0 ? (
        <div className="text-center py-20">
                    <h2 className="text-xl font-semibold text-stone-700 mb-2">No Certified Restaurants Yet</h2>
          <p className="text-stone-500 mb-6">
            Be the first restaurant to earn MAHA From the Farm certification.
          </p>
          <Link
            href="/apply"
            className="inline-block bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1b4332] transition-colors"
          >
            Apply Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {approvedRestaurants.map((restaurant) => {
            const approvedDishes = (restaurant.dishes || []).filter(
              (d: { status: string }) => d.status === 'approved'
            );
            return (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="bg-white border border-stone-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-[#2d6a4f]/30 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-stone-900 group-hover:text-[#2d6a4f] transition-colors">
                    {restaurant.name}
                  </h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    restaurant.participation_level === 'certified'
                      ? 'bg-[#2d6a4f] text-white'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {restaurant.participation_level === 'certified'
                      ? 'MAHA Certified'
                      : 'Participant'}
                  </span>
                </div>
                <p className="text-sm text-stone-500 mb-4">
                  {restaurant.city}, {restaurant.state}
                </p>
                {restaurant.description && (
                  <p className="text-sm text-stone-600 mb-4 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-[#2d6a4f] font-medium">
                  <span>{approvedDishes.length} certified dish{approvedDishes.length !== 1 ? 'es' : ''}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
