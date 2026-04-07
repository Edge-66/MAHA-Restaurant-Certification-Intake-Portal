'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Farm } from '@/lib/types';
import { distanceMiles } from '@/lib/geocode';
import Reveal from '@/components/Reveal';

// Dynamic import to avoid SSR issues with Leaflet
const DirectoryMap = dynamic(() => import('@/components/DirectoryMap'), { ssr: false });

interface RestaurantRow {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  website: string | null;
  contact_phone: string;
  description: string | null;
  participation_level: string;
  latitude: number | null;
  longitude: number | null;
  submissions: { id: string; status: string; reviewed_at: string | null }[];
  dishes: { id: string; name: string; category: string; main_element: string; supplier_name: string; supplier_city: string | null; supplier_state: string | null; status: string }[];
}

interface Props {
  restaurants: RestaurantRow[];
  farms: Farm[];
}

export default function DirectoryClient({ restaurants, farms }: Props) {
  const [activeTab, setActiveTab] = useState<'map' | 'restaurants' | 'farms'>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantRow | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [searching, setSearching] = useState(false);

  const handleZipSearch = useCallback(async () => {
    if (!zipCode || zipCode.length !== 5) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${zipCode}&countrycodes=us&limit=1`,
        { headers: { 'User-Agent': 'MAHA-FromTheFarm/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch {
      // Silently fail
    }
    setSearching(false);
  }, [zipCode]);

  const clearSearch = () => {
    setZipCode('');
    setSearchCenter(null);
  };

  // All map pins
  const allPins = useMemo(() => {
    const pins: { id: string; name: string; type: 'restaurant' | 'farm'; city: string; state: string; latitude: number; longitude: number; description?: string | null; href?: string }[] = [];

    restaurants.forEach((r) => {
      if (r.latitude && r.longitude) {
        pins.push({
          id: r.id,
          name: r.name,
          type: 'restaurant',
          city: r.city,
          state: r.state,
          latitude: r.latitude,
          longitude: r.longitude,
          description: r.description,
        });
      }
    });

    farms.forEach((f) => {
      if (f.latitude && f.longitude) {
        pins.push({
          id: f.id,
          name: f.name,
          type: 'farm',
          city: f.city,
          state: f.state,
          latitude: f.latitude,
          longitude: f.longitude,
          description: f.description,
          href: `/directory/farms/${f.id}`,
        });
      }
    });

    return pins;
  }, [restaurants, farms]);

  // Filtered pins by distance
  const filteredPins = useMemo(() => {
    if (!searchCenter) return allPins;
    return allPins.filter((pin) => {
      const d = distanceMiles(searchCenter[0], searchCenter[1], pin.latitude, pin.longitude);
      return d <= searchRadius;
    });
  }, [allPins, searchCenter, searchRadius]);

  // Filtered list items
  const filteredRestaurants = useMemo(() => {
    if (!searchCenter) return restaurants;
    return restaurants.filter((r) => {
      if (!r.latitude || !r.longitude) return false;
      return distanceMiles(searchCenter[0], searchCenter[1], r.latitude, r.longitude) <= searchRadius;
    });
  }, [restaurants, searchCenter, searchRadius]);

  const filteredFarms = useMemo(() => {
    if (!searchCenter) return farms;
    return farms.filter((f) => {
      if (!f.latitude || !f.longitude) return false;
      return distanceMiles(searchCenter[0], searchCenter[1], f.latitude, f.longitude) <= searchRadius;
    });
  }, [farms, searchCenter, searchRadius]);

  const tabs = [
    { key: 'map' as const, label: 'Map View' },
    { key: 'restaurants' as const, label: 'Restaurants', count: filteredRestaurants.length },
    { key: 'farms' as const, label: 'Farms', count: filteredFarms.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Reveal className="mb-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Directory</h1>
        <p className="text-stone-600">
          Explore restaurants and farms participating in the MAHA From the Farm program.
        </p>
      </Reveal>

      {/* Zip Code Search */}
      <Reveal delay={80} className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 sm:max-w-xs">
            <label className="block text-sm font-medium text-stone-700 mb-1">Find near you</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyDown={(e) => e.key === 'Enter' && handleZipSearch()}
                placeholder="Enter ZIP code"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
              />
              <button
                onClick={handleZipSearch}
                disabled={searching || zipCode.length !== 5}
                className="bg-[#2d6a4f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1b4332] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-stone-600">Within</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
            >
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
              <option value={100}>100 miles</option>
              <option value={250}>250 miles</option>
            </select>
          </div>
          {searchCenter && (
            <button onClick={clearSearch} className="text-sm text-stone-500 hover:text-stone-700 underline">
              Clear search
            </button>
          )}
        </div>
        {searchCenter && (
          <p className="text-xs text-stone-500 mt-2">
            Showing {filteredPins.length} result{filteredPins.length !== 1 ? 's' : ''} within {searchRadius} miles of {zipCode}
          </p>
        )}
      </Reveal>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-stone-200 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px flex-shrink-0 ${
              activeTab === tab.key
                ? 'border-[#2d6a4f] text-[#2d6a4f]'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-[#2d6a4f]/10 text-[#2d6a4f]'
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Map Tab */}
      {activeTab === 'map' && (
        <DirectoryMap
          pins={filteredPins}
          center={searchCenter || undefined}
          zoom={searchCenter ? 10 : 4}
        />
      )}

      {/* Restaurants Tab */}
      {activeTab === 'restaurants' && (
        <>
          {filteredRestaurants.length === 0 ? (
            <EmptyState type="restaurants" hasSearch={!!searchCenter} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => {
                const approvedDishes = restaurant.dishes.filter((d) => d.status === 'approved');
                const distance = searchCenter && restaurant.latitude && restaurant.longitude
                  ? distanceMiles(searchCenter[0], searchCenter[1], restaurant.latitude, restaurant.longitude)
                  : null;
                return (
                  <button
                    key={restaurant.id}
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className="bg-white border border-stone-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-[#2d6a4f]/30 text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-lg font-semibold text-stone-900 group-hover:text-[#2d6a4f] transition-colors">
                        {restaurant.name}
                      </h2>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                        restaurant.participation_level === 'certified'
                          ? 'bg-[#2d6a4f] text-white'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {restaurant.participation_level === 'certified' ? 'Certified' : 'Participant'}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mb-3">
                      {restaurant.city}, {restaurant.state}
                      {distance !== null && (
                        <span className="text-stone-400"> · {Math.round(distance)} mi</span>
                      )}
                    </p>
                    {restaurant.description && (
                      <p className="text-sm text-stone-600 mb-3 line-clamp-2">{restaurant.description}</p>
                    )}
                    <div className="text-sm text-[#2d6a4f] font-medium">
                      {approvedDishes.length} certified dish{approvedDishes.length !== 1 ? 'es' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Farms Tab */}
      {activeTab === 'farms' && (
        <>
          {/* Farm CTA banner */}
          <div className="bg-[#1b4332] rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 text-green-200 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                For Farms & Producers
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                Get your farm in front of verified buyers
              </h3>
              <p className="text-sm text-green-200 leading-relaxed max-w-xl">
                Restaurants using this directory are actively looking for local, verified suppliers.
                Register your farm to showcase your practices, certifications, and products — and get discovered.
              </p>
            </div>
            <Link
              href="/apply"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-[#1b4332] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              Register Your Farm
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {filteredFarms.length === 0 ? (
            <EmptyState type="farms" hasSearch={!!searchCenter} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFarms.map((farm) => {
                const distance = searchCenter && farm.latitude && farm.longitude
                  ? distanceMiles(searchCenter[0], searchCenter[1], farm.latitude, farm.longitude)
                  : null;
                return (
                  <Link
                    key={farm.id}
                    href={`/directory/farms/${farm.id}`}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-[#2d6a4f]/30 group"
                  >
                    {farm.hero_image_url ? (
                      <div className="h-48 bg-stone-100 overflow-hidden">
                        <img
                          src={farm.hero_image_url}
                          alt={farm.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                        <span className="text-4xl text-green-300 font-bold">{farm.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-stone-900 group-hover:text-[#2d6a4f] transition-colors mb-1">
                        {farm.name}
                      </h2>
                      <p className="text-sm text-stone-500 mb-3">
                        {farm.city}, {farm.state}
                        {distance !== null && (
                          <span className="text-stone-400"> · {Math.round(distance)} mi</span>
                        )}
                      </p>
                      {farm.description && (
                        <p className="text-sm text-stone-600 mb-3 line-clamp-2">{farm.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {farm.livestock_types && farm.livestock_types.split(',').slice(0, 3).map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {t.trim()}
                          </span>
                        ))}
                        {farm.produce_types && farm.produce_types.split(',').slice(0, 3).map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Restaurant Modal */}
      {selectedRestaurant && (
        <RestaurantModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ type, hasSearch }: { type: 'restaurants' | 'farms'; hasSearch: boolean }) {
  return (
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold text-stone-700 mb-2">
        {hasSearch
          ? `No ${type === 'restaurants' ? 'Restaurants' : 'Farms'} Found Nearby`
          : `No ${type === 'restaurants' ? 'Restaurants' : 'Farms'} Yet`}
      </h2>
      <p className="text-stone-500 mb-6">
        {hasSearch
          ? 'Try expanding your search radius or clearing your search.'
          : type === 'restaurants'
            ? 'Be the first restaurant to earn MAHA From the Farm certification.'
            : 'Farms will appear here once approved through our onboarding process.'}
      </p>
      {!hasSearch && (
        <Link
          href="/apply"
          className="inline-block bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#1b4332] transition-colors"
        >
          Apply Now
        </Link>
      )}
    </div>
  );
}

function RestaurantModal({
  restaurant,
  onClose,
}: {
  restaurant: RestaurantRow;
  onClose: () => void;
}) {
  const approvedDishes = restaurant.dishes.filter((d) => d.status === 'approved');
  const approvalDate = restaurant.submissions.find((s) => s.status === 'approved')?.reviewed_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">{restaurant.name}</h2>
              <p className="text-stone-500 text-sm mt-1">{restaurant.city}, {restaurant.state}</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              restaurant.participation_level === 'certified'
                ? 'bg-[#2d6a4f] text-white'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {restaurant.participation_level === 'certified' ? 'MAHA Certified Restaurant' : 'From the Farm Participant'}
            </span>
            {approvalDate && (
              <span className="text-xs text-stone-400">
                Since {new Date(approvalDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {restaurant.description && (
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">{restaurant.description}</p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-stone-700">{restaurant.address}, {restaurant.city}, {restaurant.state}</span>
            </div>
            {restaurant.contact_phone && (
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-stone-700">{restaurant.contact_phone}</span>
              </div>
            )}
            {restaurant.website && (
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">
                  {restaurant.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {approvedDishes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3 uppercase tracking-wider">Certified Dishes</h3>
              <div className="space-y-2">
                {approvedDishes.map((dish) => (
                  <div key={dish.id} className="bg-stone-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-900 text-sm">{dish.name}</span>
                      <span className="text-xs text-stone-500 bg-stone-200/50 px-2 py-0.5 rounded-full">{dish.category}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      {dish.main_element} — sourced from {dish.supplier_name}
                      {(dish.supplier_city || dish.supplier_state) && (
                        <>, {[dish.supplier_city, dish.supplier_state].filter(Boolean).join(', ')}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 italic">
              Certified dishes meet MAHA standards for the main element only and may be subject to ongoing review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
