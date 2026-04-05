-- ============================================
-- DEMO SEED DATA: 3 Restaurants + 3 Farms
-- Run this in Supabase SQL Editor after schema
-- ============================================

-- ==================
-- DEMO RESTAURANTS
-- ==================

-- Restaurant 1: Harvest Table
INSERT INTO restaurants (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, participation_level, description)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Harvest Table',
  'Maria Chen',
  'maria@harvesttable.com',
  '(404) 555-0101',
  'https://harvesttable.com',
  '245 Peachtree St NE',
  'Atlanta',
  'GA',
  '30303',
  'participant',
  'Farm-to-fork Southern cuisine featuring locally sourced proteins and seasonal vegetables from Georgia farms.'
);

INSERT INTO submissions (id, restaurant_id, status, submitted_at, reviewed_at)
VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  'approved',
  now() - interval '14 days',
  now() - interval '7 days'
);

INSERT INTO dishes (submission_id, restaurant_id, name, category, description, main_element, supplier_name, supplier_city, supplier_state, supplier_certifications, meets_non_negotiables, status, approved_at)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Grass-Fed Ribeye', 'Entrée', 'Dry-aged 14oz ribeye with roasted root vegetables and red wine jus', 'Grass-fed beef ribeye', 'White Oak Pastures', 'Bluffton', 'GA', 'Animal Welfare Approved, Certified Grassfed', true, 'approved', now() - interval '7 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Heritage Pork Chop', 'Entrée', 'Bone-in heritage breed pork chop with braised greens and sweet potato purée', 'Heritage breed pork chop', 'Riverview Farms', 'Ranger', 'GA', 'Pasture-raised, No antibiotics', true, 'approved', now() - interval '7 days'),
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Pasture-Raised Chicken', 'Entrée', 'Half roasted chicken with herb butter, grits, and seasonal pickles', 'Pasture-raised whole chicken', 'Crystal Lake Farms', 'Dawsonville', 'GA', 'Pasture-raised, Non-GMO feed', true, 'approved', now() - interval '7 days');

-- Restaurant 2: The Green Fork
INSERT INTO restaurants (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, participation_level, description)
VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'The Green Fork',
  'James Williams',
  'james@thegreenfork.com',
  '(212) 555-0202',
  'https://thegreenfork.com',
  '78 Bedford St',
  'New York',
  'NY',
  '10014',
  'certified',
  'Contemporary American restaurant dedicated to regenerative agriculture and transparent sourcing from Northeast farms.'
);

INSERT INTO submissions (id, restaurant_id, status, submitted_at, reviewed_at)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'a2222222-2222-2222-2222-222222222222',
  'approved',
  now() - interval '30 days',
  now() - interval '21 days'
);

INSERT INTO dishes (submission_id, restaurant_id, name, category, description, main_element, supplier_name, supplier_city, supplier_state, supplier_certifications, meets_non_negotiables, status, approved_at)
VALUES
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Lamb Shoulder', 'Entrée', 'Slow-roasted lamb shoulder with chimichurri and charred broccolini', 'Pasture-raised lamb shoulder', 'Kinderhook Farm', 'Valatie', 'NY', 'Certified Humane, 100% Grass-fed', true, 'approved', now() - interval '21 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Pan-Seared Trout', 'Entrée', 'Wild-caught rainbow trout with brown butter, capers, and seasonal greens', 'Wild-caught rainbow trout', 'Beaverkill Trout Hatchery', 'Livingston Manor', 'NY', 'Sustainably harvested', true, 'approved', now() - interval '21 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Farm Egg Appetizer', 'Appetizer', 'Soft-scrambled farm eggs with black truffle and sourdough', 'Pasture-raised eggs', 'Feather Ridge Farm', 'Ancramdale', 'NY', 'Pasture-raised, Organic feed', true, 'approved', now() - interval '21 days'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Beef Tartare', 'Appetizer', 'Hand-cut grass-fed beef tartare with quail egg and house mustard', 'Grass-fed beef tenderloin', 'Kinderhook Farm', 'Valatie', 'NY', 'Certified Humane, 100% Grass-fed', true, 'approved', now() - interval '21 days');

-- Restaurant 3: Roots & Rye
INSERT INTO restaurants (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, participation_level, description)
VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'Roots & Rye',
  'Aisha Johnson',
  'aisha@rootsandrye.com',
  '(615) 555-0303',
  'https://rootsandrye.com',
  '1200 4th Ave N',
  'Nashville',
  'TN',
  '37208',
  'participant',
  'Modern Southern kitchen focused on heritage ingredients and direct relationships with Tennessee family farms.'
);

INSERT INTO submissions (id, restaurant_id, status, submitted_at, reviewed_at)
VALUES (
  'b3333333-3333-3333-3333-333333333333',
  'a3333333-3333-3333-3333-333333333333',
  'approved',
  now() - interval '10 days',
  now() - interval '3 days'
);

INSERT INTO dishes (submission_id, restaurant_id, name, category, description, main_element, supplier_name, supplier_city, supplier_state, supplier_certifications, meets_non_negotiables, status, approved_at)
VALUES
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Smoked Brisket', 'Entrée', '16-hour smoked brisket with house pickles, cornbread, and collard greens', 'Grass-fed beef brisket', 'Bear Creek Farm', 'Lyles', 'TN', 'Grass-fed, No hormones', true, 'approved', now() - interval '3 days'),
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Duck Confit', 'Entrée', 'Crispy duck confit with sweet potato hash and apple cider reduction', 'Free-range duck leg', 'Wedge Oak Farm', 'Lebanon', 'TN', 'Free-range, No antibiotics', true, 'approved', now() - interval '3 days');


-- ==================
-- DEMO FARMS
-- ==================

-- Farm 1: White Oak Pastures (inspired by real farm)
INSERT INTO farms (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, description, livestock_types, produce_types, regenerative_practices, certifications, hero_image_url, photo_urls, status, approved_at)
VALUES (
  'f1111111-1111-1111-1111-111111111111',
  'White Oak Pastures',
  'Will Harris',
  'info@whiteoakpastures.com',
  '(229) 555-0401',
  'https://whiteoakpastures.com',
  '22775 GA-27',
  'Bluffton',
  'GA',
  '39824',
  'A fifth-generation farm practicing radically traditional farming. We raise 10 species of livestock on pasture using regenerative land management, producing the highest quality meats while improving the land with every generation. Our zero-waste philosophy means every part of the animal is used.',
  'Cattle, Sheep, Goats, Pigs, Chickens, Turkeys, Ducks, Geese, Guinea, Rabbits',
  'Vegetables, Herbs',
  'Rotational grazing, Multi-species grazing, Composting, No synthetic fertilizers, Zero-waste processing, Soil carbon sequestration, Riparian buffer zones',
  'Animal Welfare Approved, Certified Grassfed by AGW, Whole30 Approved, Non-GMO Project Verified',
  'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80',
  '["https://images.unsplash.com/photo-1516253593875-bd7ba052b0ae?w=800&q=80","https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80","https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&q=80"]',
  'approved',
  now() - interval '60 days'
);

-- Farm 2: Kinderhook Farm
INSERT INTO farms (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, description, livestock_types, produce_types, regenerative_practices, certifications, hero_image_url, photo_urls, status, approved_at)
VALUES (
  'f2222222-2222-2222-2222-222222222222',
  'Kinderhook Farm',
  'Lee Ranney',
  'info@kinderhookfarm.com',
  '(518) 555-0402',
  'https://kinderhookfarm.com',
  '1958 County Route 21',
  'Valatie',
  'NY',
  '12184',
  'A 1,200-acre regenerative farm in the Hudson Valley raising 100% grass-fed cattle, pastured pork, lamb, and poultry. We believe in working with nature, not against it — building healthy soil through managed grazing and creating a diverse, resilient ecosystem.',
  'Cattle, Pigs, Sheep, Chickens',
  'Hay, Pasture grasses',
  'Managed intensive rotational grazing, Silvopasture, Cover cropping, No-till pasture renovation, Predator-friendly ranching, Wetland restoration',
  'Certified Humane, 100% Grass-fed, Non-GMO',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80',
  '["https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=80","https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80","https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80"]',
  'approved',
  now() - interval '45 days'
);

-- Farm 3: Bear Creek Farm
INSERT INTO farms (id, name, contact_name, contact_email, contact_phone, website, address, city, state, zip, description, livestock_types, produce_types, regenerative_practices, certifications, hero_image_url, photo_urls, status, approved_at)
VALUES (
  'f3333333-3333-3333-3333-333333333333',
  'Bear Creek Farm',
  'Sarah Mitchell',
  'sarah@bearcreekfarm.com',
  '(615) 555-0403',
  'https://bearcreekfarm.com',
  '4520 Bear Creek Rd',
  'Lyles',
  'TN',
  '37098',
  'A family-owned farm in Middle Tennessee focused on raising grass-fed beef and heritage breed pigs without hormones or routine antibiotics. Our animals live on open pasture year-round, and we work directly with local restaurants to provide the freshest, most ethically raised meats possible.',
  'Cattle, Pigs',
  'Seasonal vegetables, Peppers, Tomatoes, Squash',
  'Rotational grazing, No antibiotics or hormones, Heritage breed preservation, Direct-to-restaurant sales, Composting, Pollinator habitat restoration',
  'Grass-fed, No hormones, No antibiotics, Tennessee Certified Farm',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
  '["https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80","https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=800&q=80","https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80"]',
  'approved',
  now() - interval '30 days'
);
