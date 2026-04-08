-- Farm certification verification (reviewer attestation for non-USDA types)
-- Run against your Supabase project if these columns are not already present.

alter table farms add column if not exists cert_verified_at timestamptz;
alter table farms add column if not exists cert_verified_by text;

comment on column farms.cert_verified_at is 'When a reviewer confirmed third-party certification documentation was verified (non-USDA paths).';
comment on column farms.cert_verified_by is 'Admin email who recorded certification verification.';
