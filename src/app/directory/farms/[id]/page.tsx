import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

function safeParseArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function splitCommas(val: string | null): string[] {
  if (!val) return [];
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

export default async function FarmProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: farm, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !farm) {
    notFound();
  }

  // Only show approved farms publicly
  if (farm.status !== 'approved') {
    notFound();
  }

  const photos = safeParseArray(farm.photo_urls);
  const livestock = splitCommas(farm.livestock_types);
  const produce = splitCommas(farm.produce_types);
  const practices = splitCommas(farm.regenerative_practices);
  const certs = splitCommas(farm.certifications);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/directory"
        className="text-sm text-[#2d6a4f] hover:underline mb-8 inline-block"
      >
        ← Back to Directory
      </Link>

      {/* Hero */}
      {farm.hero_image_url ? (
        <div className="rounded-2xl overflow-hidden mb-8 h-72 md:h-96">
          <img
            src={farm.hero_image_url}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden mb-8 h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          <span className="text-6xl text-green-200 font-bold">{farm.name.charAt(0)}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-1">{farm.name}</h1>
          <p className="text-stone-500">{farm.city}, {farm.state}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200 self-start">
          MAHA Verified Farm
        </span>
      </div>

      {/* Description */}
      {farm.description && (
        <div className="mb-8">
          <p className="text-stone-600 leading-relaxed text-lg">{farm.description}</p>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* What They Raise/Grow */}
        {(livestock.length > 0 || produce.length > 0) && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">What They Raise & Grow</h2>
            {livestock.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Livestock</h3>
                <div className="flex flex-wrap gap-2">
                  {livestock.map((item) => (
                    <span key={item} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {produce.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Produce</h3>
                <div className="flex flex-wrap gap-2">
                  {produce.map((item) => (
                    <span key={item} className="px-3 py-1.5 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regenerative Practices */}
        {practices.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Regenerative Practices</h2>
            <ul className="space-y-3">
              {practices.map((practice) => (
                <li key={practice} className="flex items-start gap-3 text-sm">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-stone-700">{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Certifications</h2>
            <div className="flex flex-wrap gap-2">
              {certs.map((cert) => (
                <span key={cert} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-sm font-medium">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact & Location */}
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Location & Contact</h2>
          <div className="space-y-3 text-sm">
            {farm.address && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-stone-700">{farm.address}, {farm.city}, {farm.state} {farm.zip}</span>
              </div>
            )}
            {farm.contact_phone && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-stone-700">{farm.contact_phone}</span>
              </div>
            )}
            {farm.website && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a href={farm.website} target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">
                  {farm.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-stone-900 mb-4">Photos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden h-56">
                <img src={url} alt={`${farm.name} photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transparency Statement */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
        <p className="text-sm text-stone-500 italic">
          Farm information is provided through the MAHA onboarding process and may be subject to ongoing verification.
          Practices and certifications listed are based on farm attestation and supplier transparency.
        </p>
      </div>
    </div>
  );
}
