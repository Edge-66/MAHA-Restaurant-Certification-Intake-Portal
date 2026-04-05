-- Add lat/lng columns to restaurants and farms
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE farms ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS longitude double precision;

-- Seed coordinates for demo data
-- Harvest Table - Atlanta, GA
UPDATE restaurants SET latitude = 33.7590, longitude = -84.3880
WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- The Green Fork - New York, NY
UPDATE restaurants SET latitude = 40.7336, longitude = -74.0027
WHERE id = 'a2222222-2222-2222-2222-222222222222';

-- Roots & Rye - Nashville, TN
UPDATE restaurants SET latitude = 36.1812, longitude = -86.7906
WHERE id = 'a3333333-3333-3333-3333-333333333333';

-- White Oak Pastures - Bluffton, GA
UPDATE farms SET latitude = 31.5338, longitude = -84.8932
WHERE id = 'f1111111-1111-1111-1111-111111111111';

-- Kinderhook Farm - Valatie, NY
UPDATE farms SET latitude = 42.4134, longitude = -73.6732
WHERE id = 'f2222222-2222-2222-2222-222222222222';

-- Bear Creek Farm - Lyles, TN
UPDATE farms SET latitude = 35.9048, longitude = -87.3173
WHERE id = 'f3333333-3333-3333-3333-333333333333';
