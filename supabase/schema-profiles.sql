-- ============================================================
-- PROFILES TABLE
-- Links Supabase Auth users to roles and restaurant/farm IDs.
-- Run this after schema.sql and schema-farms.sql.
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'restaurant', 'farm')),
  restaurant_id uuid references restaurants(id) on delete set null,
  farm_id uuid references farms(id) on delete set null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Users can read their own profile
create policy "Own profile read" on profiles
  for select using (auth.uid() = id);

-- All authenticated users can manage profiles (admin use via dashboard or SQL)
create policy "Authenticated manage profiles" on profiles
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- ADDITIONAL RLS POLICIES
-- Allow restaurant/farm owners to read their own data
-- even before approval.
-- ============================================================

-- Restaurant owners can read their own restaurant
create policy "Restaurant owner read" on restaurants
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.restaurant_id = restaurants.id
    )
  );

-- Restaurant owners can read their own submissions
create policy "Restaurant owner read submissions" on submissions
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.restaurant_id = submissions.restaurant_id
    )
  );

-- Restaurant owners can read their own dishes
create policy "Restaurant owner read dishes" on dishes
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.restaurant_id = dishes.restaurant_id
    )
  );

-- Farm owners can read their own farm
create policy "Farm owner read" on farms
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.farm_id = farms.id
    )
  );

-- ============================================================
-- ACCOUNTS
--
-- Restaurant & farm applicants: profiles rows are created automatically when
-- they submit the public application (see Next.js server action + service role).
--
-- Admins only: create the user in Supabase Dashboard → Authentication → Users,
-- then link their profile:
--
--   insert into profiles (id, role) values ('<auth-user-uuid>', 'admin');
-- ============================================================
