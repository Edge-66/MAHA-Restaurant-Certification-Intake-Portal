import { redirect } from 'next/navigation';

/** Farm list + geocoding lives at Farmer admin; this URL stays valid as a redirect. */
export default async function AdminFarmsIndexRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const p = await searchParams;
  const status = p.status;
  redirect(status ? `/admin/farmers?status=${encodeURIComponent(status)}` : '/admin/farmers');
}
