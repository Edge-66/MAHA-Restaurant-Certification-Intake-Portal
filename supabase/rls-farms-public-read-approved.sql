-- Ensure anonymous visitors can read approved farms (directory + public profiles).
-- Run in Supabase SQL Editor if farms exist but the directory list is empty for logged-out users.

drop policy if exists "Public read approved farms" on farms;

create policy "Public read approved farms"
  on farms
  for select
  using (status = 'approved');

comment on policy "Public read approved farms" on farms is
  'Allow anyone to SELECT rows where status is approved (public directory).';
