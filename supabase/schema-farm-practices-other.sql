-- Free-text "other" farm practices (requires reviewer verification)
alter table farms add column if not exists farm_practices_other text;

comment on column farms.farm_practices_other is 'Applicant-entered practices outside predefined checkboxes; subject to MAHA verification.';
