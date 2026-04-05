-- Farms table
create table farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  website text,
  address text,
  city text not null,
  state text not null,
  zip text,
  description text,
  livestock_types text,        -- e.g. "Cattle, Poultry, Pigs"
  produce_types text,          -- e.g. "Vegetables, Herbs, Fruit"
  regenerative_practices text, -- e.g. "Rotational grazing, Cover cropping, No-till"
  certifications text,         -- e.g. "USDA Organic, Animal Welfare Approved"
  hero_image_url text,
  photo_urls text,             -- JSON array of image URLs
  status text not null default 'pending', -- pending, approved, rejected
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for farms
alter table farms enable row level security;

create policy "Public read approved farms" on farms for select using (status = 'approved');
create policy "Public insert farms" on farms for insert with check (true);
create policy "Admin full access farms" on farms for all using (auth.role() = 'authenticated');
