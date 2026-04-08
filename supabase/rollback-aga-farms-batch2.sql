-- Rollback for seed-aga-farms-batch2-copy-safe.sql

SELECT id, name, contact_email, city, state
FROM farms
WHERE (name, contact_email) IN (
  ('Gonsoulin Land and Cattle, LLC', 'info@glranch.com'),
  ('Flying B Bar Ranch', 'margaret@flyingbbar.com'),
  ('Field''s Grassfed Beef, LLC / Fields Grassfed Beef', 'fieldbeef@gmail.com'),
  ('Tyner Pond Farm LLC', 'amber@farmersmarket.com'),
  ('Sunny Acres Dairy', 'bulk-import+sunnyacresdairy@placeholder.local'),
  ('Alpine Jay Farm', 'david.bigelow@opengatesgroup.com'),
  ('Lane Legacy Beef', 'lanelegacybeef@gmail.com'),
  ('Troyer Farm', 'bulk-import+troyerfarm@placeholder.local'),
  ('Hearst Ranch', 'bulk-import+hearstranch@placeholder.local'),
  ('Trevor Roche', 'trevor.roche@gmail.com'),
  ('Little O Ranch & Livestock', 'michael@littleoranchandlivestock.com'),
  ('Bello Tallow', 'bellotallow@icloud.com'),
  ('Ham Sweet Farm, DBA Mo-Mi Lamb', 'christian@eatmorelamb.com')
)
ORDER BY name;

DELETE FROM farms
WHERE (name, contact_email) IN (
  ('Gonsoulin Land and Cattle, LLC', 'info@glranch.com'),
  ('Flying B Bar Ranch', 'margaret@flyingbbar.com'),
  ('Field''s Grassfed Beef, LLC / Fields Grassfed Beef', 'fieldbeef@gmail.com'),
  ('Tyner Pond Farm LLC', 'amber@farmersmarket.com'),
  ('Sunny Acres Dairy', 'bulk-import+sunnyacresdairy@placeholder.local'),
  ('Alpine Jay Farm', 'david.bigelow@opengatesgroup.com'),
  ('Lane Legacy Beef', 'lanelegacybeef@gmail.com'),
  ('Troyer Farm', 'bulk-import+troyerfarm@placeholder.local'),
  ('Hearst Ranch', 'bulk-import+hearstranch@placeholder.local'),
  ('Trevor Roche', 'trevor.roche@gmail.com'),
  ('Little O Ranch & Livestock', 'michael@littleoranchandlivestock.com'),
  ('Bello Tallow', 'bellotallow@icloud.com'),
  ('Ham Sweet Farm, DBA Mo-Mi Lamb', 'christian@eatmorelamb.com')
);
