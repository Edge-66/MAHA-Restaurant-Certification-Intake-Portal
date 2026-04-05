'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitApplication(formData: FormData) {
  const supabase = await createClient();

  // Extract restaurant data
  const restaurantData = {
    name: formData.get('restaurant_name') as string,
    contact_name: formData.get('contact_name') as string,
    contact_email: formData.get('contact_email') as string,
    contact_phone: formData.get('contact_phone') as string,
    website: (formData.get('website') as string) || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip: formData.get('zip') as string,
    participation_level: formData.get('participation_level') as string,
    description: (formData.get('description') as string) || null,
  };

  // Insert restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .insert(restaurantData)
    .select()
    .single();

  if (restaurantError || !restaurant) {
    throw new Error(`Failed to create restaurant: ${restaurantError?.message}`);
  }

  // Insert submission
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({ restaurant_id: restaurant.id })
    .select()
    .single();

  if (submissionError || !submission) {
    throw new Error(`Failed to create submission: ${submissionError?.message}`);
  }

  // Parse dishes from form data
  const dishesJson = formData.get('dishes') as string;
  const dishes = JSON.parse(dishesJson);

  for (const dish of dishes) {
    const { error: dishError } = await supabase.from('dishes').insert({
      submission_id: submission.id,
      restaurant_id: restaurant.id,
      name: dish.name,
      category: dish.category,
      description: dish.description || null,
      main_element: dish.main_element,
      supplier_name: dish.supplier_name,
      supplier_city: dish.supplier_city || null,
      supplier_state: dish.supplier_state || null,
      supplier_website: dish.supplier_website || null,
      supplier_certifications: dish.supplier_certifications || null,
      meets_non_negotiables: dish.meets_non_negotiables,
      notes: dish.notes || null,
    });

    if (dishError) {
      throw new Error(`Failed to create dish: ${dishError.message}`);
    }
  }

  redirect('/apply/success');
}

export async function loginAdmin(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/admin');
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: string,
  adminNotes?: string
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  };

  if (adminNotes !== undefined) {
    updateData.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from('submissions')
    .update(updateData)
    .eq('id', submissionId);

  if (error) {
    throw new Error(`Failed to update submission: ${error.message}`);
  }
}

export async function updateDishStatus(dishId: string, status: string) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status };
  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('dishes')
    .update(updateData)
    .eq('id', dishId);

  if (error) {
    throw new Error(`Failed to update dish: ${error.message}`);
  }
}
