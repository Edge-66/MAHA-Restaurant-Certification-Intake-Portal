/** Checkbox labels for farm applications — stored as JSON arrays on `farms` */

export const FARM_LIVESTOCK_OPTIONS = [
  'Cattle / beef',
  'Dairy',
  'Poultry / eggs',
  'Pork',
  'Sheep / lamb',
  'Goats',
  'Bison',
  'Aquaculture',
  'Other livestock',
] as const;

export const FARM_PRODUCE_OPTIONS = [
  'Vegetables',
  'Fruits',
  'Herbs',
  'Grains & legumes',
  'Mushrooms',
  'Cut flowers',
  'Nursery / transplants',
  'Honey & hive products',
  'Other produce',
] as const;

export const FARM_REGENERATIVE_OPTIONS = [
  'Rotational grazing',
  'Cover cropping',
  'No-till / reduced till',
  'Compost & soil health',
  'Pasture-raised animals',
  'Integrated pest management (IPM)',
  'Hedgerows / pollinator habitat',
  'Water conservation / riparian buffers',
  'Renewable energy on-farm',
  'No routine antibiotics or added hormones',
  'Non-GMO crops',
  'Animal welfare certified practices',
] as const;
