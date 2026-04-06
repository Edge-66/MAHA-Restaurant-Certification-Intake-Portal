'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

type DishPayload = {
  name: string;
  category: string;
  description: string | null;
  main_element: string;
  supplier_name: string;
  supplier_city: string | null;
  supplier_state: string | null;
  supplier_website: string | null;
  supplier_certifications: string | null;
  meets_non_negotiables: boolean;
  notes: string | null;
};

function isDishPayload(x: unknown): x is DishPayload {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.category === 'string' &&
    typeof o.main_element === 'string' &&
    typeof o.supplier_name === 'string' &&
    typeof o.meets_non_negotiables === 'boolean'
  );
}

/**
 * Creates a Supabase Auth user, saves the application, links profiles, and signs the user in.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
 */
export async function submitApplication(
  formData: FormData
): Promise<{ error: string } | void> {
  let userId: string | null = null;
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        'Account signup is not configured (missing SUPABASE_SERVICE_ROLE_KEY). Add it to the server environment.',
    };
  }

  const applicantType = formData.get('applicant_type') as string;
  const password = (formData.get('account_password') as string) || '';
  const emailRaw = (formData.get('contact_email') as string) || '';
  const email = emailRaw.trim().toLowerCase();

  if (applicantType !== 'restaurant' && applicantType !== 'farm') {
    return { error: 'Invalid application type.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  if (!email) {
    return { error: 'Contact email is required.' };
  }

  const { data: authData, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError || !authData.user) {
    const msg = createUserError?.message ?? 'Could not create account.';
    if (/already|registered|exists/i.test(msg)) {
      return {
        error:
          'An account already exists for this email. Sign in with /login or use a different email.',
      };
    }
    return { error: msg };
  }

  userId = authData.user.id;

  try {
    if (applicantType === 'farm') {
      const farmData = {
        name: formData.get('name') as string,
        contact_name: formData.get('contact_name') as string,
        contact_email: emailRaw.trim(),
        contact_phone: formData.get('contact_phone') as string,
        website: (formData.get('website') as string) || null,
        address: (formData.get('address') as string) || null,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: (formData.get('zip') as string) || null,
        description: (formData.get('description') as string) || null,
        livestock_types: (formData.get('livestock_types') as string) || null,
        produce_types: (formData.get('produce_types') as string) || null,
        regenerative_practices: (formData.get('regenerative_practices') as string) || null,
        certifications: (formData.get('certifications') as string) || null,
      };

      const { data: farm, error: fError } = await admin
        .from('farms')
        .insert(farmData)
        .select('id')
        .single();

      if (fError || !farm) {
        throw new Error(fError?.message ?? 'Failed to save farm application.');
      }

      const { error: pError } = await admin.from('profiles').insert({
        id: userId,
        role: 'farm',
        farm_id: farm.id,
        restaurant_id: null,
      });

      if (pError) {
        throw new Error(pError.message);
      }
    } else {
      let dishes: unknown[];
      try {
        dishes = JSON.parse((formData.get('dishes_json') as string) || '[]');
      } catch {
        throw new Error('Invalid dish data.');
      }
      if (!Array.isArray(dishes) || dishes.length === 0) {
        throw new Error('Add at least one dish.');
      }
      if (!dishes.every(isDishPayload)) {
        throw new Error('Each dish must include name, category, main element, supplier, and attestations.');
      }

      const restaurantData = {
        name: formData.get('name') as string,
        contact_name: formData.get('contact_name') as string,
        contact_email: emailRaw.trim(),
        contact_phone: formData.get('contact_phone') as string,
        website: (formData.get('website') as string) || null,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zip: formData.get('zip') as string,
        participation_level: 'participant' as const,
        description: (formData.get('description') as string) || null,
      };

      const { data: restaurant, error: rError } = await admin
        .from('restaurants')
        .insert(restaurantData)
        .select('id')
        .single();

      if (rError || !restaurant) {
        throw new Error(rError?.message ?? 'Failed to save restaurant.');
      }

      const { data: submission, error: sError } = await admin
        .from('submissions')
        .insert({ restaurant_id: restaurant.id })
        .select('id')
        .single();

      if (sError || !submission) {
        throw new Error(sError?.message ?? 'Failed to create submission.');
      }

      for (const dish of dishes) {
        const { error: dError } = await admin.from('dishes').insert({
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
        if (dError) {
          throw new Error(dError.message);
        }
      }

      const { error: pError } = await admin.from('profiles').insert({
        id: userId,
        role: 'restaurant',
        restaurant_id: restaurant.id,
        farm_id: null,
      });

      if (pError) {
        throw new Error(pError.message);
      }
    }
  } catch (err) {
    await admin.auth.admin.deleteUser(userId);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return { error: message };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect(`/login?applied=1&email=${encodeURIComponent(email)}`);
  }

  if (applicantType === 'farm') {
    redirect('/dashboard/farm');
  }
  redirect('/dashboard/restaurant');
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

export async function getAdminUsers(): Promise<{ id: string; email: string; tier: number }[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('admin_tier')
    .eq('id', user.id)
    .single();

  if ((callerProfile?.admin_tier ?? 1) < 3) return [];

  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, admin_tier')
    .eq('role', 'admin');

  if (!adminProfiles?.length) return [];

  const admin = createAdminClient();
  const results = await Promise.all(
    adminProfiles.map(async (p) => {
      const { data } = await admin.auth.admin.getUserById(p.id);
      return { id: p.id, email: data.user?.email ?? '', tier: p.admin_tier ?? 1 };
    })
  );

  return results.filter((u) => u.email);
}

export async function updateAdminTier(
  targetId: string,
  newTier: number
): Promise<{ error?: string }> {
  if (newTier < 1 || newTier > 3) return { error: 'Invalid tier.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('admin_tier')
    .eq('id', user.id)
    .single();

  if ((callerProfile?.admin_tier ?? 1) < 3) return { error: 'Insufficient permissions.' };

  const { error } = await supabase
    .from('profiles')
    .update({ admin_tier: newTier })
    .eq('id', targetId)
    .eq('role', 'admin');

  if (error) return { error: error.message };
  return {};
}

type ContactFields = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string | null;
};

export async function updateRestaurantContact(
  restaurantId: string,
  fields: ContactFields
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Verify caller owns this restaurant
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single();

  if (profile?.restaurant_id !== restaurantId) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('restaurants')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', restaurantId);

  if (error) return { error: error.message };
  return {};
}

export async function updateFarmContact(
  farmId: string,
  fields: ContactFields
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('farm_id')
    .eq('id', user.id)
    .single();

  if (profile?.farm_id !== farmId) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('farms')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', farmId);

  if (error) return { error: error.message };
  return {};
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

  // Get the restaurant_id before updating
  const { data: dish, error: dishFetchError } = await supabase
    .from('dishes')
    .select('restaurant_id')
    .eq('id', dishId)
    .single();

  if (dishFetchError || !dish) {
    throw new Error('Dish not found');
  }

  const { error } = await supabase
    .from('dishes')
    .update(updateData)
    .eq('id', dishId);

  if (error) {
    throw new Error(`Failed to update dish: ${error.message}`);
  }

  // Recount approved dishes for this restaurant and sync participation_level
  const { count } = await supabase
    .from('dishes')
    .select('id', { count: 'exact', head: true })
    .eq('restaurant_id', dish.restaurant_id)
    .eq('status', 'approved');

  const approvedCount = count ?? 0;
  const newLevel = approvedCount >= 7 ? 'certified' : 'participant';

  await supabase
    .from('restaurants')
    .update({ participation_level: newLevel })
    .eq('id', dish.restaurant_id);
}
