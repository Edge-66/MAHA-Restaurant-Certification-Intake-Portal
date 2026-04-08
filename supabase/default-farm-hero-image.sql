-- Standardize default hero image for farms.
-- Run once in Supabase SQL Editor.

-- 1) Backfill existing farms without a hero image.
UPDATE farms
SET hero_image_url = '/farm-default-hero.png'
WHERE hero_image_url IS NULL
   OR trim(hero_image_url) = '';

-- 2) Ensure future farms default to this image.
ALTER TABLE farms
ALTER COLUMN hero_image_url
SET DEFAULT '/farm-default-hero.png';

-- 3) Optional verification
SELECT
  count(*) FILTER (WHERE hero_image_url = '/farm-default-hero.png') AS using_default_image,
  count(*) AS total_farms
FROM farms;
