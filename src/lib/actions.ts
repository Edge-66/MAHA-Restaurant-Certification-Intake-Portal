'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import {
  sendApplicationConfirmation,
  sendSubmissionDecision,
  sendFarmDecision,
  sendPasswordResetEmail,
} from '@/lib/email';
import { geocodeAddress } from '@/lib/geocode';

function farmCertRequiresVerifierAck(certType: string | null | undefined): boolean {
  return certType === 'aga' || certType === 'raa' || certType === 'other';
}

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
  main_element_cert_type: string | null;
  main_element_cert_other: string | null;
  cert_file_url: string | null;
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
 * Creates a Supabase Auth user, saves the application, and links profiles.
 * Redirects to /login so the user signs in explicitly (no automatic session).
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
      let farmHealthPractices: string[] = [];
      try {
        const raw = formData.get('health_practices_json') as string | null;
        if (raw) farmHealthPractices = JSON.parse(raw);
      } catch { /* ignore */ }

      function parseTagJson(key: string): string[] {
        try {
          const raw = formData.get(key) as string | null;
          if (!raw) return [];
          const a = JSON.parse(raw);
          return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [];
        } catch {
          return [];
        }
      }

      const livestockSel = parseTagJson('livestock_json');
      const produceSel = parseTagJson('produce_json');
      const regenerativeSel = parseTagJson('regenerative_json');
      const practicesOtherRaw = ((formData.get('farm_practices_other') as string) || '').trim();

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
        livestock_types: livestockSel.length > 0 ? JSON.stringify(livestockSel) : null,
        produce_types: produceSel.length > 0 ? JSON.stringify(produceSel) : null,
        regenerative_practices: regenerativeSel.length > 0 ? JSON.stringify(regenerativeSel) : null,
        farm_practices_other: practicesOtherRaw || null,
        certifications: (formData.get('certifications') as string) || null,
        cert_type: (formData.get('farm_cert_type') as string) || null,
        cert_other: (formData.get('farm_cert_other') as string) || null,
        cert_file_url: (formData.get('farm_cert_file_url') as string) || null,
        health_practices: farmHealthPractices.length > 0 ? farmHealthPractices : null,
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

      let healthPractices: string[] = [];
      try {
        const raw = formData.get('health_practices_json') as string | null;
        if (raw) healthPractices = JSON.parse(raw);
      } catch { /* ignore */ }

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
        health_practices: healthPractices.length > 0 ? healthPractices : null,
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
          main_element_cert_type: dish.main_element_cert_type || null,
          main_element_cert_other: dish.main_element_cert_other || null,
          meets_non_negotiables: dish.meets_non_negotiables,
          cert_file_url: dish.cert_file_url || null,
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

  // Send confirmation email (non-blocking)
  const entityName = (formData.get('name') as string) || email;
  sendApplicationConfirmation(email, entityName, applicantType).catch(() => {});

  redirect(`/login?applied=1&email=${encodeURIComponent(email)}`);
}

/**
 * Logged-in restaurants: add one or more dishes as a new pending submission (no full re-application).
 */
export async function submitAdditionalRestaurantDishes(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'restaurant' || !profile.restaurant_id) {
    return { error: 'Unauthorized.' };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Server configuration error.' };
  }

  const restaurantId = profile.restaurant_id;

  let dishes: unknown[];
  try {
    dishes = JSON.parse((formData.get('dishes_json') as string) || '[]');
  } catch {
    return { error: 'Invalid dish data.' };
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return { error: 'Add at least one dish.' };
  }
  if (!dishes.every(isDishPayload)) {
    return { error: 'Each dish must include name, category, main element, supplier, and attestations.' };
  }

  const { data: submission, error: sError } = await admin
    .from('submissions')
    .insert({ restaurant_id: restaurantId })
    .select('id')
    .single();

  if (sError || !submission) {
    return { error: sError?.message ?? 'Failed to create submission.' };
  }

  try {
    for (const dish of dishes) {
      const { error: dError } = await admin.from('dishes').insert({
        submission_id: submission.id,
        restaurant_id: restaurantId,
        name: dish.name,
        category: dish.category,
        description: dish.description || null,
        main_element: dish.main_element,
        supplier_name: dish.supplier_name,
        supplier_city: dish.supplier_city || null,
        supplier_state: dish.supplier_state || null,
        supplier_website: dish.supplier_website || null,
        supplier_certifications: dish.supplier_certifications || null,
        main_element_cert_type: dish.main_element_cert_type || null,
        main_element_cert_other: dish.main_element_cert_other || null,
        meets_non_negotiables: dish.meets_non_negotiables,
        cert_file_url: dish.cert_file_url || null,
        notes: dish.notes || null,
      });
      if (dError) throw new Error(dError.message);
    }
  } catch (err) {
    await admin.from('submissions').delete().eq('id', submission.id);
    const message = err instanceof Error ? err.message : 'Failed to save dishes.';
    return { error: message };
  }

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('name, contact_email')
    .eq('id', restaurantId)
    .single();

  if (restaurant?.contact_email) {
    sendApplicationConfirmation(
      restaurant.contact_email,
      restaurant.name,
      'restaurant'
    ).catch(() => {});
  }

  redirect('/dashboard/restaurant');
}

export async function uploadCertFile(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'No file provided.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, WEBP, or PDF files are accepted.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File must be under 10 MB.' };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { error: 'Storage not configured.' };
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `cert-docs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from('certifications')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data } = admin.storage.from('certifications').getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function loginAdmin(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/admin/review-queue');
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

  const masterErr = await assertNotMaster(targetId);
  if (masterErr) return masterErr;

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

/**
 * Reviewer workflow: set farm listing status. Tier 2+.
 * Approving AGA / Regen Organic / Other requires certVerificationConfirmed.
 */
export async function submitFarmReviewDecision(
  farmId: string,
  decision: 'approved' | 'rejected' | 'pending',
  options?: { certVerificationConfirmed?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('admin_tier, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' || (profile?.admin_tier ?? 1) < 2) {
    return { error: 'Reviewer access (Tier 2+) required.' };
  }

  const { data: farm, error: fetchErr } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single();

  if (fetchErr || !farm) return { error: 'Farm not found.' };

  const prevStatus = farm.status as string;
  const certType = farm.cert_type as string | null | undefined;

  if (decision === 'approved' && farmCertRequiresVerifierAck(certType)) {
    if (!options?.certVerificationConfirmed) {
      return {
        error:
          'Confirm that you have verified this farm’s certification documentation before approving.',
      };
    }
  }

  const updatePayload: Record<string, unknown> = {
    status: decision,
    reviewed_by: user.email,
    updated_at: new Date().toISOString(),
  };

  if (decision === 'approved') {
    updatePayload.approved_at = new Date().toISOString();
    if (farmCertRequiresVerifierAck(certType)) {
      updatePayload.cert_verified_at = new Date().toISOString();
      updatePayload.cert_verified_by = user.email;
    } else {
      updatePayload.cert_verified_at = null;
      updatePayload.cert_verified_by = null;
    }

    if (!farm.latitude && farm.city && farm.state) {
      const geo = await geocodeAddress(
        farm.address || '',
        farm.city as string,
        farm.state as string,
        farm.zip
      );
      if (geo) {
        updatePayload.latitude = geo.latitude;
        updatePayload.longitude = geo.longitude;
      }
    }
  } else {
    updatePayload.approved_at = null;
    updatePayload.cert_verified_at = null;
    updatePayload.cert_verified_by = null;
  }

  const { error: upErr } = await supabase.from('farms').update(updatePayload).eq('id', farmId);
  if (upErr) return { error: upErr.message };

  if (prevStatus !== decision && (decision === 'approved' || decision === 'rejected')) {
    notifyFarmDecision(farmId, decision).catch(() => {});
  }

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

// ─── Notifications ────────────────────────────────────────────────────────────

async function createNotification(
  userId: string,
  title: string,
  body: string,
  link: string
) {
  try {
    const admin = createAdminClient();
    await admin.from('notifications').insert({ user_id: userId, title, body, link, read: false });
  } catch {
    // non-fatal
  }
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export async function getMyNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('notifications')
    .select('id, title, body, link, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(15);
  return (data ?? []) as AppNotification[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
}

// ─── Email + notify when admin makes a decision ───────────────────────────────

export async function notifySubmissionDecision(
  submissionId: string,
  newStatus: string,
  adminNotes?: string | null
): Promise<void> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('submissions')
    .select('restaurants(id, name, contact_email)')
    .eq('id', submissionId)
    .single();

  const restaurantsRaw = data?.restaurants;
  const restaurant = (Array.isArray(restaurantsRaw) ? restaurantsRaw[0] : restaurantsRaw) as { id: string; name: string; contact_email: string } | null;
  if (!restaurant) return;

  // Get user_id linked to this restaurant
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .single();

  // Email
  if (restaurant.contact_email) {
    await sendSubmissionDecision(restaurant.contact_email, restaurant.name, newStatus, adminNotes);
  }

  // In-app notification
  if (profile?.id) {
    const titles: Record<string, string> = {
      approved: `Your submission was approved — ${restaurant.name}`,
      rejected: `Your submission was not approved — ${restaurant.name}`,
      needs_clarification: `Action needed on your submission — ${restaurant.name}`,
    };
    const bodies: Record<string, string> = {
      approved: 'Your certified dishes are now live in the public directory.',
      rejected: 'Your submission did not meet certification requirements at this time.',
      needs_clarification: adminNotes ?? 'MAHA needs additional information about your submission.',
    };
    const title = titles[newStatus] ?? `Submission update — ${restaurant.name}`;
    const body = bodies[newStatus] ?? '';
    await createNotification(profile.id, title, body, '/dashboard/restaurant');
  }
}

// ─── Tier-3 helpers ───────────────────────────────────────────────────────────

async function assertTier3(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };
  const { data: profile } = await supabase
    .from('profiles').select('admin_tier').eq('id', user.id).single();
  if ((profile?.admin_tier ?? 1) < 3) return { error: 'Insufficient permissions.' };
  return null;
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset(targetUserId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const admin = createAdminClient();
  const { data: userData, error: getUserErr } = await admin.auth.admin.getUserById(targetUserId);
  if (getUserErr || !userData.user?.email) return { error: 'User not found.' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: userData.user.email,
    options: { redirectTo: `${siteUrl}/reset-password` },
  });

  if (linkErr || !linkData.properties?.action_link) {
    return { error: linkErr?.message ?? 'Could not generate reset link.' };
  }

  await sendPasswordResetEmail(userData.user.email, linkData.properties.action_link);
  return {};
}

export async function sendPasswordResetForFarm(farmId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('farm_id', farmId).single();
  if (!profile?.id) return { error: 'No user account linked to this farm.' };

  return sendPasswordReset(profile.id);
}

export async function sendPasswordResetForRestaurant(restaurantId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('restaurant_id', restaurantId).single();
  if (!profile?.id) return { error: 'No user account linked to this restaurant.' };

  return sendPasswordReset(profile.id);
}

// ─── Master account protection ───────────────────────────────────────────────

async function assertNotMaster(targetUserId: string): Promise<{ error?: string } | null> {
  const masterEmail = process.env.MASTER_ADMIN_EMAIL;
  if (!masterEmail) return null;
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(targetUserId);
  if (data.user?.email?.toLowerCase() === masterEmail.toLowerCase()) {
    return { error: 'The master admin account cannot be modified.' };
  }
  return null;
}

// ─── Delete admin account ─────────────────────────────────────────────────────

export async function deleteAdminAccount(targetId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === targetId) return { error: 'You cannot delete your own account.' };

  const masterErr = await assertNotMaster(targetId);
  if (masterErr) return masterErr;

  // Verify target is an admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', targetId).single();
  if (profile?.role !== 'admin') return { error: 'Target account is not an admin.' };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetId);
  if (error) return { error: error.message };
  return {};
}

// ─── Delete farm ──────────────────────────────────────────────────────────────

export async function deleteFarm(farmId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('farm_id', farmId).single();

  // Delete farm record (RLS allows admin; uploads/notifications cascade via FK or we clean up)
  const { error: farmErr } = await supabase.from('farms').delete().eq('id', farmId);
  if (farmErr) return { error: farmErr.message };

  // Delete auth user (cascades profile via FK)
  if (profile?.id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(profile.id);
  }

  return {};
}

// ─── Delete restaurant account ────────────────────────────────────────────────

export async function deleteRestaurantAccount(restaurantId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('restaurant_id', restaurantId).single();

  // Delete dishes, then submissions, then restaurant
  await supabase.from('dishes').delete().eq('restaurant_id', restaurantId);
  await supabase.from('submissions').delete().eq('restaurant_id', restaurantId);
  const { error: rErr } = await supabase.from('restaurants').delete().eq('id', restaurantId);
  if (rErr) return { error: rErr.message };

  if (profile?.id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(profile.id);
  }

  return {};
}

// ─── Delete dish ──────────────────────────────────────────────────────────────

export async function deleteDish(dishId: string): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const supabase = await createClient();
  const { data: dish } = await supabase
    .from('dishes').select('restaurant_id').eq('id', dishId).single();

  const { error } = await supabase.from('dishes').delete().eq('id', dishId);
  if (error) return { error: error.message };

  // Re-sync participation_level
  if (dish?.restaurant_id) {
    const { count } = await supabase
      .from('dishes').select('id', { count: 'exact', head: true })
      .eq('restaurant_id', dish.restaurant_id).eq('status', 'approved');
    const newLevel = (count ?? 0) >= 7 ? 'certified' : 'participant';
    await supabase.from('restaurants').update({ participation_level: newLevel }).eq('id', dish.restaurant_id);
  }

  return {};
}

// ─── Get restaurant / farm user lists ────────────────────────────────────────

export interface RestaurantUser {
  id: string;
  name: string;
  contactName: string;
  email: string;
  city: string;
  state: string;
  participationLevel: string;
  profileId: string | null;
}

export interface FarmUser {
  id: string;
  name: string;
  contactName: string;
  email: string;
  city: string;
  state: string;
  status: string;
  profileId: string | null;
}

export async function getRestaurantUsers(): Promise<RestaurantUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: p } = await supabase.from('profiles').select('admin_tier').eq('id', user.id).single();
  if ((p?.admin_tier ?? 1) < 3) return [];

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, contact_name, contact_email, city, state, participation_level')
    .order('name');
  if (!restaurants) return [];

  const ids = restaurants.map((r) => r.id);
  const { data: profiles } = await supabase
    .from('profiles').select('id, restaurant_id').in('restaurant_id', ids);
  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((pr) => { if (pr.restaurant_id) profileMap[pr.restaurant_id] = pr.id; });

  return restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    contactName: r.contact_name,
    email: r.contact_email,
    city: r.city,
    state: r.state,
    participationLevel: r.participation_level,
    profileId: profileMap[r.id] ?? null,
  }));
}

export async function getFarmUsers(): Promise<FarmUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: p } = await supabase.from('profiles').select('admin_tier').eq('id', user.id).single();
  if ((p?.admin_tier ?? 1) < 3) return [];

  const { data: farms } = await supabase
    .from('farms')
    .select('id, name, contact_name, contact_email, city, state, status')
    .order('name');
  if (!farms) return [];

  const ids = farms.map((f) => f.id);
  const { data: profiles } = await supabase
    .from('profiles').select('id, farm_id').in('farm_id', ids);
  const profileMap: Record<string, string> = {};
  (profiles ?? []).forEach((pr) => { if (pr.farm_id) profileMap[pr.farm_id] = pr.id; });

  return farms.map((f) => ({
    id: f.id,
    name: f.name,
    contactName: f.contact_name,
    email: f.contact_email,
    city: f.city,
    state: f.state,
    status: f.status,
    profileId: profileMap[f.id] ?? null,
  }));
}

// ─── Update user email ────────────────────────────────────────────────────────

export async function updateUserEmail(
  userId: string,
  newEmail: string
): Promise<{ error?: string }> {
  const authErr = await assertTier3();
  if (authErr) return authErr;

  const masterErr = await assertNotMaster(userId);
  if (masterErr) return masterErr;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { email: newEmail });
  if (error) return { error: error.message };

  // Sync contact_email on restaurants/farms
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id, farm_id').eq('id', userId).single();
  if (profile?.role === 'restaurant' && profile.restaurant_id) {
    await admin.from('restaurants').update({ contact_email: newEmail }).eq('id', profile.restaurant_id);
  } else if (profile?.role === 'farm' && profile.farm_id) {
    await admin.from('farms').update({ contact_email: newEmail }).eq('id', profile.farm_id);
  }

  return {};
}

// ─── Get current admin tier (for server components) ──────────────────────────

export async function getMyAdminTier(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase.from('profiles').select('admin_tier').eq('id', user.id).single();
  return data?.admin_tier ?? 1;
}

export async function notifyFarmDecision(farmId: string, newStatus: string): Promise<void> {
  const supabase = await createClient();

  const { data: farm } = await supabase
    .from('farms')
    .select('name, contact_email')
    .eq('id', farmId)
    .single();

  if (!farm) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('farm_id', farmId)
    .single();

  // Email
  if (farm.contact_email) {
    await sendFarmDecision(farm.contact_email, farm.name, newStatus);
  }

  // In-app notification
  if (profile?.id) {
    const title = newStatus === 'approved'
      ? `Your farm was approved — ${farm.name}`
      : `Farm application update — ${farm.name}`;
    const body = newStatus === 'approved'
      ? 'Your farm is now listed in the MAHA From the Farm public directory.'
      : 'Your farm application was not approved at this time.';
    await createNotification(profile.id, title, body, '/dashboard/farm');
  }
}
