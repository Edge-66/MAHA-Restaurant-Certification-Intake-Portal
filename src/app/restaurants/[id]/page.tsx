import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DishCard from '@/components/DishCard';
import { Fraunces, Great_Vibes } from 'next/font/google';

export const revalidate = 60;

const mahaWordmark = Fraunces({ subsets: ['latin'], weight: ['600', '700'] });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' });

export default async function RestaurantVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select(`*, submissions(id, status, reviewed_at), dishes(*)`)
    .eq('id', id)
    .single();

  if (!restaurant) notFound();

  const approvedSubmission = (restaurant.submissions || []).find(
    (s: { status: string }) => s.status === 'approved'
  );
  const approvedDishes = (restaurant.dishes || []).filter(
    (d: { status: string }) => d.status === 'approved'
  );
  const isCertified =
    restaurant.participation_level === 'certified' || approvedDishes.length >= 7;

  const standards = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21a48.25 48.25 0 0 1-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      title: 'No Seed Oils or Additives',
      body: 'Certified dishes contain no seed oils, synthetic dyes, or artificial additives in the main element.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ),
      title: 'No Added Hormones',
      body: 'Animal products in certified dishes come from animals raised without added hormones or routine antibiotics.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      ),
      title: 'Verified Sourcing',
      body: 'Every certified dish is reviewed by MAHA. Suppliers are named, certifications are checked, and claims are verified.',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="bg-[#1b4332] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">

          {/* MAHA wordmark */}
          <div className="flex items-center gap-2 mb-8">
            <span className={`${mahaWordmark.className} text-white text-lg font-semibold tracking-tight`}>
              MAHA
            </span>
            <span className={`${greatVibes.className} text-green-300 text-2xl leading-none`}>
              From the Farm
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              {/* Certification label */}
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold text-green-200 mb-4">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                {isCertified ? 'MAHA Certified Restaurant' : 'From the Farm Participant'}
              </div>

              <h1 className={`${mahaWordmark.className} text-4xl sm:text-5xl font-bold text-white leading-tight`}>
                {restaurant.name}
              </h1>
              <p className="text-green-300 mt-2 text-lg">
                {restaurant.city}, {restaurant.state}
              </p>
            </div>

            {/* Stats pill */}
            <div className="flex gap-3 sm:flex-col sm:items-end">
              <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-3xl font-bold text-white">{approvedDishes.length}</div>
                <div className="text-xs text-green-300 mt-0.5">Certified {approvedDishes.length === 1 ? 'dish' : 'dishes'}</div>
              </div>
              {approvedSubmission && (
                <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                  <div className="text-sm font-semibold text-white">
                    {new Date(approvedSubmission.reviewed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-green-300 mt-0.5">Verified</div>
                </div>
              )}
            </div>
          </div>

          {restaurant.description && (
            <p className="text-green-100/80 mt-6 text-sm max-w-2xl leading-relaxed">
              {restaurant.description}
            </p>
          )}

          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-green-300 hover:text-white text-sm transition-colors"
            >
              Visit restaurant website
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* ── What MAHA Certified means ──────────────────────────────────────── */}
        <section>
          <div className="text-center mb-8">
            <h2 className={`${mahaWordmark.className} text-2xl font-bold text-stone-900`}>
              What MAHA Certified Means
            </h2>
            <p className="text-stone-500 mt-2 text-sm max-w-xl mx-auto">
              Every dish on this list has been reviewed and verified by MAHA against a strict set of sourcing standards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {standards.map((s) => (
              <div key={s.title} className="bg-white border border-stone-200 rounded-xl p-6">
                <div className="text-[#2d6a4f] mb-3">{s.icon}</div>
                <h3 className="font-semibold text-stone-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Certified Dishes ──────────────────────────────────────────────── */}
        {approvedDishes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`${mahaWordmark.className} text-2xl font-bold text-stone-900`}>
                  Certified Dishes
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Each dish below meets MAHA standards for its main element.
                </p>
              </div>
              <span className="bg-[#2d6a4f] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {approvedDishes.length} verified
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedDishes.map((dish: Parameters<typeof DishCard>[0]['dish']) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </section>
        )}

        {/* ── Health Practices ──────────────────────────────────────────────── */}
        {restaurant.health_practices && restaurant.health_practices.length > 0 && (
          <section>
            <h2 className={`${mahaWordmark.className} text-2xl font-bold text-stone-900 mb-4`}>
              Better Health Practices
            </h2>
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <div className="flex flex-wrap gap-2">
                {restaurant.health_practices.map((p: string) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 bg-[#2d6a4f]/8 text-[#2d6a4f] text-sm font-medium px-3 py-1.5 rounded-full border border-[#2d6a4f]/20"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section className="bg-[#1b4332] rounded-2xl p-8 text-center">
          <span className={`${greatVibes.className} text-green-300 text-3xl`}>
            From the Farm
          </span>
          <h3 className={`${mahaWordmark.className} text-xl font-bold text-white mt-1 mb-3`}>
            Find more restaurants like this one
          </h3>
          <p className="text-green-200/80 text-sm mb-6 max-w-md mx-auto">
            MAHA is building a verified network of restaurants committed to clean sourcing and honest ingredients.
          </p>
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 bg-white text-[#1b4332] font-semibold px-6 py-3 rounded-xl text-sm hover:bg-green-50 transition-colors"
          >
            Explore the directory
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </section>

        {/* ── Transparency footer ───────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <p className="text-xs text-stone-400 leading-relaxed max-w-xl mx-auto">
            Certified dishes meet MAHA standards for the main element only and may be subject to
            ongoing review. Certification is based on restaurant attestation, supplier transparency,
            and selective verification by MAHA.
          </p>
          <Link href="/restaurants" className="inline-block mt-4 text-xs text-[#2d6a4f] hover:underline">
            ← Back to directory
          </Link>
        </div>

      </div>
    </div>
  );
}
