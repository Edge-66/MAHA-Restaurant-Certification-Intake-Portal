-- Admin audit logs (Tier 3-only read in app)
create table if not exists admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  admin_email text,
  admin_tier integer not null default 1,
  action text not null,
  target_type text,
  target_id text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_at_idx on admin_logs (created_at desc);
create index if not exists admin_logs_action_idx on admin_logs (action);
create index if not exists admin_logs_target_idx on admin_logs (target_type, target_id);

alter table admin_logs enable row level security;

drop policy if exists "Tier 3 read admin logs" on admin_logs;
create policy "Tier 3 read admin logs"
  on admin_logs
  for select
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
        and coalesce(profiles.admin_tier, 1) >= 3
    )
  );
