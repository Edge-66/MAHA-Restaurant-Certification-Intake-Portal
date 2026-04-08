export interface Restaurant {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  participation_level: 'participant' | 'certified';
  description: string | null;
  health_practices: string[] | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  restaurant_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_clarification';
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
  reviewed_by: string | null;
}

export interface Dish {
  id: string;
  submission_id: string;
  restaurant_id: string;
  name: string;
  category: 'Entrée' | 'Appetizer' | 'Side' | 'Special' | 'Other';
  description: string | null;
  main_element: string;
  supplier_name: string;
  supplier_city: string | null;
  supplier_state: string | null;
  supplier_website: string | null;
  supplier_certifications: string | null;
  main_element_cert_type: 'usda_organic' | 'aga' | 'raa' | 'other' | 'none' | null;
  main_element_cert_other: string | null;
  meets_non_negotiables: boolean;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  created_at: string;
}

export interface Upload {
  id: string;
  submission_id: string | null;
  dish_id: string | null;
  file_type: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
}

export interface SubmissionWithRestaurant extends Submission {
  restaurants: Restaurant;
}

export interface SubmissionWithDetails extends Submission {
  restaurants: Restaurant;
  dishes: Dish[];
  uploads: Upload[];
}

export interface RestaurantWithDishes extends Restaurant {
  dishes: Dish[];
  submissions: Submission[];
}

export interface Farm {
  id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string | null;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  description: string | null;
  livestock_types: string | null;
  produce_types: string | null;
  regenerative_practices: string | null;
  /** Custom practices not covered by checkboxes; verify before highlighting publicly */
  farm_practices_other?: string | null;
  certifications: string | null;
  cert_type: 'usda' | 'aga' | 'raa' | 'other' | 'none' | null;
  cert_other: string | null;
  cert_file_url: string | null;
  health_practices: string[] | null;
  hero_image_url: string | null;
  photo_urls: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_at: string | null;
  reviewed_by: string | null;
  /** Set when a reviewer confirms non-USDA certification was verified */
  cert_verified_at: string | null;
  cert_verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DishFormData {
  name: string;
  category: string;
  description: string;
  main_element: string;
  supplier_name: string;
  supplier_city: string;
  supplier_state: string;
  supplier_website: string;
  supplier_certifications: string;
  main_element_cert_type: 'usda_organic' | 'aga' | 'raa' | 'other' | 'none' | '';
  main_element_cert_other: string;
  cert_file_url: string;
  meets_non_negotiables: boolean;
  notes: string;
}

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
] as const;

export const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia'
};

export const DISH_CATEGORIES = ['Entrée', 'Appetizer', 'Side', 'Special', 'Other'] as const;
