import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_FARM_HERO_IMAGE } from '@/lib/farmDefaults';
import { US_STATES } from '@/lib/types';
import { logAdminAction } from '@/lib/adminAudit';

function csvToJsonArray(raw: FormDataEntryValue | null): string | null {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const values = text
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length ? JSON.stringify(values) : null;
}

async function createFarm(formData: FormData) {
  'use server';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_tier')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin' || (profile.admin_tier ?? 1) < 3) {
    redirect('/admin/farmers');
  }

  const name = String(formData.get('name') ?? '').trim();
  const contact_name = String(formData.get('contact_name') ?? '').trim();
  const contact_email = String(formData.get('contact_email') ?? '').trim();
  const contact_phone = String(formData.get('contact_phone') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const status = String(formData.get('status') ?? 'approved').trim().toLowerCase();
  if (!name || !contact_name || !contact_email || !contact_phone || !city || !state) {
    redirect('/admin/farmers/new?error=required');
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .insert({
      name,
      contact_name,
      contact_email,
      contact_phone,
      website: String(formData.get('website') ?? '').trim() || null,
      address: String(formData.get('address') ?? '').trim() || null,
      city,
      state,
      zip: String(formData.get('zip') ?? '').trim() || null,
      description: String(formData.get('description') ?? '').trim() || null,
      livestock_types: csvToJsonArray(formData.get('livestock_types')),
      produce_types: csvToJsonArray(formData.get('produce_types')),
      regenerative_practices: csvToJsonArray(formData.get('regenerative_practices')),
      certifications: String(formData.get('certifications') ?? '').trim() || null,
      hero_image_url: DEFAULT_FARM_HERO_IMAGE,
      status: status === 'pending' || status === 'rejected' ? status : 'approved',
      approved_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      reviewed_by: user.email ?? null,
    })
    .select('id')
    .single();

  if (error || !farm) {
    redirect('/admin/farmers/new?error=save');
  }

  await logAdminAction({
    action: 'farm_created_manual',
    target_type: 'farm',
    target_id: farm.id,
    metadata: { status },
  });

  redirect(`/admin/farms/${farm.id}`);
}

export default async function NewFarmAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, admin_tier')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin' || (profile.admin_tier ?? 1) < 3) {
    redirect('/admin/farmers');
  }

  const params = await searchParams;
  const hasError = params.error === 'required' || params.error === 'save';

  return (
    <div className="max-w-3xl">
      <Link href="/admin/farmers" className="text-sm text-[#2d6a4f] hover:underline font-medium">
        ← Farms
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 mt-4 mb-6">Create new farm</h1>

      {hasError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error === 'required'
            ? 'Please fill all required fields.'
            : 'Could not save farm. Please try again.'}
        </div>
      )}

      <form action={createFarm} className="space-y-5 rounded-xl border border-stone-200 bg-white p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Farm name *</label>
            <input name="name" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Status *</label>
            <select name="status" defaultValue="approved" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact name *</label>
            <input name="contact_name" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact email *</label>
            <input name="contact_email" type="email" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contact phone *</label>
            <input name="contact_phone" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
            <input name="website" placeholder="https://" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Street address</label>
          <input name="address" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">City *</label>
            <input name="city" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">State *</label>
            <select name="state" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" required>
              {US_STATES.map((abbr) => (
                <option key={abbr} value={abbr}>
                  {abbr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">ZIP</label>
            <input name="zip" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Livestock types</label>
            <input
              name="livestock_types"
              placeholder="Beef, Poultry, Dairy"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-stone-500 mt-1">Comma-separated.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Produce types</label>
            <input
              name="produce_types"
              placeholder="Vegetables, Fruit"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-stone-500 mt-1">Comma-separated.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Regenerative practices</label>
            <input
              name="regenerative_practices"
              placeholder="Rotational grazing, No-till"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-stone-500 mt-1">Comma-separated.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Certifications</label>
            <input
              name="certifications"
              placeholder="American Grassfed Association (AGA)"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1b4332]"
          >
            Create farm
          </button>
          <Link href="/admin/farmers" className="text-sm text-stone-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
