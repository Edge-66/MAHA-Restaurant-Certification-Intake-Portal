import { createClient } from '@/lib/supabase/server';
import DirectoryClient from './DirectoryClient';

export const revalidate = 60;

export default async function DirectoryPage() {
  const supabase = await createClient();

  // Fetch approved restaurants with their approved dishes
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      *,
      submissions!inner(id, status, reviewed_at),
      dishes(id, name, category, main_element, supplier_name, supplier_city, supplier_state, status)
    `)
    .eq('submissions.status', 'approved');

  // Fetch approved farms
  const { data: farms } = await supabase
    .from('farms')
    .select('*')
    .eq('status', 'approved')
    .order('name');

  return (
    <DirectoryClient
      restaurants={restaurants || []}
      farms={farms || []}
    />
  );
}
