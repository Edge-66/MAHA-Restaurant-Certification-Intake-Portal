-- restaurants
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  website text,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  participation_level text not null default 'participant',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  status text not null default 'pending',
  admin_notes text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewer_id uuid
);

-- dishes
create table dishes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade not null,
  restaurant_id uuid references restaurants(id) on delete cascade not null,
  name text not null,
  category text not null,
  description text,
  main_element text not null,
  supplier_name text not null,
  supplier_city text,
  supplier_state text,
  supplier_website text,
  supplier_certifications text,
  meets_non_negotiables boolean not null default false,
  notes text,
  status text not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- uploads
create table uploads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  dish_id uuid references dishes(id) on delete cascade,
  file_type text not null,
  file_url text not null,
  file_name text,
  created_at timestamptz default now()
);

-- RLS
alter table restaurants enable row level security;
alter table submissions enable row level security;
alter table dishes enable row level security;
alter table uploads enable row level security;

create policy "Public read approved restaurants" on restaurants for select using (
  exists (select 1 from submissions where submissions.restaurant_id = restaurants.id and submissions.status = 'approved')
);
create policy "Public insert restaurants" on restaurants for insert with check (true);
create policy "Public insert submissions" on submissions for insert with check (true);
create policy "Public insert dishes" on dishes for insert with check (true);
create policy "Public insert uploads" on uploads for insert with check (true);
create policy "Public read approved dishes" on dishes for select using (status = 'approved');
create policy "Public read approved submissions" on submissions for select using (status = 'approved');
create policy "Public read uploads" on uploads for select using (true);
create policy "Admin full access restaurants" on restaurants for all using (auth.role() = 'authenticated');
create policy "Admin full access submissions" on submissions for all using (auth.role() = 'authenticated');
create policy "Admin full access dishes" on dishes for all using (auth.role() = 'authenticated');
create policy "Admin full access uploads" on uploads for all using (auth.role() = 'authenticated');
