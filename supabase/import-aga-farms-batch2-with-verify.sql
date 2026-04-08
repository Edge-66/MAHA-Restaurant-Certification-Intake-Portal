-- One-shot batch 2 import + verification (idempotent)
-- Safe to run multiple times.

BEGIN;

-- 1) Normalize legacy status formatting globally (prevents directory misses)
UPDATE farms
SET status = lower(trim(status))
WHERE status IS NOT NULL
  AND status <> lower(trim(status));

-- 2) Insert only missing batch-2 rows (name + contact_email key)
WITH incoming (
  name, contact_name, contact_email, contact_phone, website, address, city, state, zip,
  description, livestock_types, produce_types, regenerative_practices, certifications, status
) AS (
  VALUES
    ('Gonsoulin Land and Cattle, LLC','Shannon Gonsoulin','info@glranch.com','337-577-9162','http://www.glranch.com','6108 Loreauville Rd.','New Iberia','LA','70563','Grass-fed beef. American Grassfed Association (AGA) certified.','Beef',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Flying B Bar Ranch','Margaret Buchanan','margaret@flyingbbar.com','(303) 887-9735','https://www.flyingbbar.com/','7300 Yulle Road','Strasburg','CO','80136','Grass-fed beef. American Grassfed Association (AGA) certified.','Beef',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Field''s Grassfed Beef, LLC / Fields Grassfed Beef','Richard Field','fieldbeef@gmail.com','541-820-4430',NULL,'29500 N River Rd','Prairie City','OR','97869','Grass-fed beef. American Grassfed Association (AGA) certified.','Beef',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Tyner Pond Farm LLC','Amber Groce','amber@farmersmarket.com','317-477-7940','https://www.tynerpondfarm.com','7408 E 200 S','Greenfield','IN','46410','Grass-fed beef and pork. American Grassfed Association (AGA) certified.','Beef, Pork',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Sunny Acres Dairy','Andrew Hostetler','bulk-import+sunnyacresdairy@placeholder.local','(877) 774-7277',NULL,'4110 Marble Rd NE','East Rochester','OH','44625','Grass-fed dairy. American Grassfed Association (AGA) certified.','Dairy',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Alpine Jay Farm','Jason Miller','david.bigelow@opengatesgroup.com','(330) 600-8474',NULL,'19967 Bolivar Rd','Wellsville','OH','43968','Grass-fed dairy. American Grassfed Association (AGA) certified.','Dairy',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Lane Legacy Beef','Katie Lane','lanelegacybeef@gmail.com','(406) 853-2337',NULL,'1611 Willard Rd. W.','Ismay','MT','59336','Grass-fed beef. American Grassfed Association (AGA) certified.','Beef',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Troyer Farm','Ivan Troyer','bulk-import+troyerfarm@placeholder.local','(231) 928-5966',NULL,'7999 Skells Road','Holton','MI','49425','Grass-fed dairy. American Grassfed Association (AGA) certified.','Dairy',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Hearst Ranch','Roland E. Camacho','bulk-import+hearstranch@placeholder.local','(805) 423-2362','https://www.hearstranch.com/','1 Hearst Ranch Rd','San Simeon','CA','93452','American Grassfed Association (AGA) certified.',NULL,NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Trevor Roche','Trevor Roche','trevor.roche@gmail.com','(208) 880-7676',NULL,'25451 Klahr Rd.','Parma','ID','83660-6736','Grass-fed beef. American Grassfed Association (AGA) certified.','Beef',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Little O Ranch & Livestock','Michael Greco','michael@littleoranchandlivestock.com','(845) 332-7302',NULL,'996 Route 212','Saugerties','NY','12477','Grass-fed sheep products. American Grassfed Association (AGA) certified.','Sheep',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Bello Tallow','Natalie Castillo','bellotallow@icloud.com','(432) 661-5308',NULL,'358 County Line Rd','Rutherfordton','NC','28139','Grass-fed sheep products. American Grassfed Association (AGA) certified.','Sheep',NULL,NULL,'American Grassfed Association (AGA)','approved'),
    ('Ham Sweet Farm, DBA Mo-Mi Lamb','Christian Spinillo','christian@eatmorelamb.com','(517) 244-6030',NULL,'357 Holt Road','Williamston','MI','48895','Grass-fed sheep products. American Grassfed Association (AGA) certified.','Sheep',NULL,NULL,'American Grassfed Association (AGA)','approved')
),
to_insert AS (
  SELECT i.*
  FROM incoming i
  WHERE NOT EXISTS (
    SELECT 1
    FROM farms f
    WHERE f.name = i.name
      AND f.contact_email = i.contact_email
  )
)
INSERT INTO farms (
  name, contact_name, contact_email, contact_phone, website, address, city, state, zip,
  description, livestock_types, produce_types, regenerative_practices, certifications,
  status, approved_at, updated_at
)
SELECT
  name, contact_name, contact_email, contact_phone, website, address, city, state, zip,
  description, livestock_types, produce_types, regenerative_practices, certifications,
  lower(trim(status)), now(), now()
FROM to_insert;

COMMIT;

-- 3) Verification: expected 13 rows visible for batch-2 keys
SELECT count(*) AS batch2_rows_present
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
);

-- 4) Verification: show statuses for just this batch
SELECT name, contact_email, status
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
