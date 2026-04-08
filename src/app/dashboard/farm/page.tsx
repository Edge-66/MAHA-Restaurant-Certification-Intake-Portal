import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { parseFarmTagField } from '@/lib/farmTags';

export default async function FarmDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, farm_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'farm' || !profile.farm_id) {
    redirect('/login');
  }

  const { data: farm } = await supabase
    .from('farms')
    .select('*')
    .eq('id', profile.farm_id)
    .single();

  if (!farm) redirect('/login');

  const livestockTags = parseFarmTagField(farm.livestock_types);
  const produceTags = parseFarmTagField(farm.produce_types);
  const regenerativeTags = parseFarmTagField(farm.regenerative_practices);
  const certTags = parseFarmTagField(farm.certifications);
  const practicesOther = (farm.farm_practices_other ?? '').trim();

  const statusLabel =
    farm.status === 'approved'
      ? 'Approved'
      : farm.status === 'rejected'
        ? 'Not listed'
        : 'Pending review';

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-sm text-stone-500 mb-1">Farm Dashboard</p>
          <h1 className="text-2xl font-bold text-stone-900">{farm.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {farm.city}, {farm.state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {farm.status === 'approved' && (
            <Link
              href="/directory"
              className="text-sm text-[#2d6a4f] hover:underline font-medium"
            >
              View Directory →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-lg font-semibold text-stone-900 mb-0.5">{statusLabel}</div>
          <div className="text-xs text-stone-500">Listing status</div>
        </div>
        {farm.approved_at && (
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="text-lg font-semibold text-stone-900 mb-0.5">
              {new Date(farm.approved_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="text-xs text-stone-500">Approved on</div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Farm profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-stone-500">Contact:</span>{' '}
              <span className="text-stone-900">{farm.contact_name}</span>
            </div>
            <div>
              <span className="text-stone-500">Email:</span>{' '}
              <span className="text-stone-900">{farm.contact_email}</span>
            </div>
            <div>
              <span className="text-stone-500">Phone:</span>{' '}
              <span className="text-stone-900">{farm.contact_phone}</span>
            </div>
            {farm.website && (
              <div>
                <span className="text-stone-500">Website:</span>{' '}
                <a
                  href={farm.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2d6a4f] hover:underline"
                >
                  {farm.website}
                </a>
              </div>
            )}
            {(farm.address || farm.zip) && (
              <div className="sm:col-span-2">
                <span className="text-stone-500">Address:</span>{' '}
                <span className="text-stone-900">
                  {[farm.address, farm.city, farm.state, farm.zip].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {livestockTags.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-stone-500 text-sm block mb-2">Livestock</span>
                <div className="flex flex-wrap gap-2">
                  {livestockTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {produceTags.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-stone-500 text-sm block mb-2">Produce</span>
                <div className="flex flex-wrap gap-2">
                  {produceTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-amber-50 text-amber-950 text-xs font-medium border border-amber-200/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {regenerativeTags.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-stone-500 text-sm block mb-2">Regenerative & better health (from application)</span>
                <div className="flex flex-wrap gap-2">
                  {regenerativeTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {certTags.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-stone-500 text-sm block mb-2">Certifications</span>
                <div className="flex flex-wrap gap-2">
                  {certTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-medium border border-stone-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {practicesOther && (
              <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2">
                <span className="text-stone-600 text-sm block mb-1">Other (submitted text)</span>
                <p className="text-stone-800 text-sm whitespace-pre-wrap">{practicesOther}</p>
              </div>
            )}
            {farm.description && (
              <div className="sm:col-span-2">
                <span className="text-stone-500">Description:</span>{' '}
                <span className="text-stone-900">{farm.description}</span>
              </div>
            )}
          </div>
          {farm.health_practices && farm.health_practices.length > 0 && (
            <div className="sm:col-span-2 mt-1">
              <span className="text-stone-500 text-sm block mb-2">Better Health Practices</span>
              <div className="flex flex-wrap gap-2">
                {farm.health_practices.map((p: string) => (
                  <span key={p} className="inline-flex items-center gap-1.5 bg-[#2d6a4f]/8 text-[#2d6a4f] text-xs font-medium px-3 py-1.5 rounded-full border border-[#2d6a4f]/20">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-stone-400 mt-4 sm:col-span-2">
            Restaurants list your farm as a supplier on dish submissions. To change your profile, contact MAHA.
          </p>
        </div>

        {farm.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
            Your farm profile is awaiting MAHA review before it can appear in the public directory.
          </div>
        )}
      </div>
    </div>
  );
}
