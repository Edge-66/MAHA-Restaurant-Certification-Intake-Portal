import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminRestaurantsPage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, city, state, participation_level, contact_email, created_at')
    .order('name', { ascending: true });

  const rows = restaurants ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Restaurants</h1>
      <p className="text-sm text-stone-500 mb-8 max-w-2xl">
        Edit restaurant profiles, participation level, health practices, and map coordinates. Submission and
        dish review workflows stay under{' '}
        <Link href="/admin/submissions" className="text-[#2d6a4f] font-medium hover:underline">
          All applications
        </Link>{' '}
        → Restaurants.
      </p>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">No restaurants found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-6 py-3 font-medium text-stone-600">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600 hidden md:table-cell">Location</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600">Level</th>
                  <th className="text-left px-6 py-3 font-medium text-stone-600 hidden sm:table-cell">Contact</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{r.name}</td>
                    <td className="px-6 py-4 text-stone-500 hidden md:table-cell">
                      {r.city}, {r.state}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.participation_level === 'certified'
                            ? 'bg-[#2d6a4f] text-white'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {r.participation_level === 'certified' ? 'Certified' : 'Participant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-xs hidden sm:table-cell truncate max-w-[200px]">
                      {r.contact_email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/restaurants/${r.id}`}
                        className="text-[#2d6a4f] hover:underline font-medium whitespace-nowrap"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
