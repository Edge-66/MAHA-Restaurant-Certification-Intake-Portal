-- =============================================================================
-- Rollback: AGA farms batch 1 (updated mapping import)
-- Use this to remove ONLY the 6 farms inserted by seed-aga-farms-batch1.sql.
-- =============================================================================

-- 1) Preview rows that will be removed
SELECT id, name, contact_email, city, state
FROM farms
WHERE (name, contact_email) IN (
  ('Curtis Ranch', 'loricurtis987@gmail.com'),
  ('Grady Ranch', 'brwest74@gmail.com'),
  ('Pettit Pastures', 'pettitpastures@gmail.com'),
  ('Markegard Family Grass-Fed / Markegard Family Farm', 'info@markegardfamily.com'),
  ('Princess Beef', 'CynthRanch@aol.com'),
  ('Leafy Creek Farm LLC', 'info@leftcoastgrassfed.com')
)
ORDER BY name;

-- 2) Delete the batch-1 rows
DELETE FROM farms
WHERE (name, contact_email) IN (
  ('Curtis Ranch', 'loricurtis987@gmail.com'),
  ('Grady Ranch', 'brwest74@gmail.com'),
  ('Pettit Pastures', 'pettitpastures@gmail.com'),
  ('Markegard Family Grass-Fed / Markegard Family Farm', 'info@markegardfamily.com'),
  ('Princess Beef', 'CynthRanch@aol.com'),
  ('Leafy Creek Farm LLC', 'info@leftcoastgrassfed.com')
);
