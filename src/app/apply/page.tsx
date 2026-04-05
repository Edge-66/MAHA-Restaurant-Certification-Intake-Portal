'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DishFormSection from '@/components/DishFormSection';
import { DishFormData, US_STATES, US_STATE_NAMES } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

const emptyDish: DishFormData = {
  name: '',
  category: '',
  description: '',
  main_element: '',
  supplier_name: '',
  supplier_city: '',
  supplier_state: '',
  supplier_website: '',
  supplier_certifications: '',
  meets_non_negotiables: false,
  notes: '',
};

export default function ApplyPage() {
  const router = useRouter();
  const [applicantType, setApplicantType] = useState<'restaurant' | 'farm'>('restaurant');
  const [dishes, setDishes] = useState<DishFormData[]>([{ ...emptyDish }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [attestations, setAttestations] = useState({
    accurate: false,
    mainElement: false,
    verification: false,
    revocation: false,
  });

  const handleDishChange = (index: number, dish: DishFormData) => {
    const updated = [...dishes];
    updated[index] = dish;
    setDishes(updated);
  };

  const addDish = () => setDishes([...dishes, { ...emptyDish }]);
  const removeDish = (index: number) => setDishes(dishes.filter((_, i) => i !== index));

  const allAttested = Object.values(attestations).every(Boolean);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allAttested) {
      setError('Please agree to all attestation statements.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const supabase = createClient();

      if (applicantType === 'farm') {
        // Insert farm
        const farmData = {
          name: formData.get('name') as string,
          contact_name: formData.get('contact_name') as string,
          contact_email: formData.get('contact_email') as string,
          contact_phone: formData.get('contact_phone') as string,
          website: (formData.get('website') as string) || null,
          address: (formData.get('address') as string) || null,
          city: formData.get('city') as string,
          state: formData.get('state') as string,
          zip: (formData.get('zip') as string) || null,
          description: (formData.get('description') as string) || null,
          livestock_types: (formData.get('livestock_types') as string) || null,
          produce_types: (formData.get('produce_types') as string) || null,
          regenerative_practices: (formData.get('regenerative_practices') as string) || null,
          certifications: (formData.get('certifications') as string) || null,
        };

        const { error: fError } = await supabase
          .from('farms')
          .insert(farmData);

        if (fError) throw new Error(fError.message);
      } else {
        // Insert restaurant
        const restaurantData = {
          name: formData.get('name') as string,
          contact_name: formData.get('contact_name') as string,
          contact_email: formData.get('contact_email') as string,
          contact_phone: formData.get('contact_phone') as string,
          website: (formData.get('website') as string) || null,
          address: formData.get('address') as string,
          city: formData.get('city') as string,
          state: formData.get('state') as string,
          zip: formData.get('zip') as string,
          participation_level: formData.get('participation_level') as string,
          description: (formData.get('description') as string) || null,
        };

        const { data: restaurant, error: rError } = await supabase
          .from('restaurants')
          .insert(restaurantData)
          .select()
          .single();

        if (rError) throw new Error(rError.message);

        // Insert submission
        const { data: submission, error: sError } = await supabase
          .from('submissions')
          .insert({ restaurant_id: restaurant.id })
          .select()
          .single();

        if (sError) throw new Error(sError.message);

        // Insert dishes
        for (const dish of dishes) {
          const { error: dError } = await supabase.from('dishes').insert({
            submission_id: submission.id,
            restaurant_id: restaurant.id,
            name: dish.name,
            category: dish.category,
            description: dish.description || null,
            main_element: dish.main_element,
            supplier_name: dish.supplier_name,
            supplier_city: dish.supplier_city || null,
            supplier_state: dish.supplier_state || null,
            supplier_website: dish.supplier_website || null,
            supplier_certifications: dish.supplier_certifications || null,
            meets_non_negotiables: dish.meets_non_negotiables,
            notes: dish.notes || null,
          });
          if (dError) throw new Error(dError.message);
        }
      }

      router.push('/apply/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Apply for Certification</h1>
        <p className="text-stone-600">
          Complete the form below to apply for the MAHA From the Farm program.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Applicant Type Toggle */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-stone-900 mb-4">I am applying as a...</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setApplicantType('restaurant')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              applicantType === 'restaurant'
                ? 'border-[#2d6a4f] bg-[#2d6a4f]/5'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="font-semibold text-stone-900 mb-1">Restaurant</div>
            <p className="text-xs text-stone-500">
              I serve dishes sourced from verified farms and want to certify them.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setApplicantType('farm')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              applicantType === 'farm'
                ? 'border-[#2d6a4f] bg-[#2d6a4f]/5'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="font-semibold text-stone-900 mb-1">Farm / Producer</div>
            <p className="text-xs text-stone-500">
              I raise livestock or grow produce and want to join the MAHA network.
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Info (shared) */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
            <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
            {applicantType === 'restaurant' ? 'Restaurant' : 'Farm'} Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {applicantType === 'restaurant' ? 'Restaurant' : 'Farm'} Name <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input type="text" name="contact_name" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input type="email" name="contact_email" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input type="tel" name="contact_phone" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
              <input type="url" name="website" className={inputClass} placeholder="https://" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Street Address {applicantType === 'restaurant' && <span className="text-red-500">*</span>}
              </label>
              <input type="text" name="address" required={applicantType === 'restaurant'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input type="text" name="city" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select name="state" required className={inputClass}>
                <option value="">Select state</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{US_STATE_NAMES[st]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                ZIP Code {applicantType === 'restaurant' && <span className="text-red-500">*</span>}
              </label>
              <input type="text" name="zip" required={applicantType === 'restaurant'} pattern="[0-9]{5}" className={inputClass} />
            </div>

            {/* Restaurant-only: participation level */}
            {applicantType === 'restaurant' && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Participation Level <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participation_level" value="participant" defaultChecked className="text-[#2d6a4f] focus:ring-[#2d6a4f]" />
                    <span className="text-sm text-stone-700">From the Farm Participant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="participation_level" value="certified" className="text-[#2d6a4f] focus:ring-[#2d6a4f]" />
                    <span className="text-sm text-stone-700">MAHA Certified Restaurant</span>
                  </label>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Description (optional)
              </label>
              <textarea
                name="description"
                rows={3}
                className={inputClass}
                placeholder={applicantType === 'restaurant'
                  ? 'Tell us about your restaurant and your commitment to local sourcing...'
                  : 'Tell us about your farm, what you raise or grow, and your farming philosophy...'
                }
              />
            </div>
          </div>
        </div>

        {/* Farm-specific fields */}
        {applicantType === 'farm' && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
              <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
              Farm Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Livestock Types
                </label>
                <input
                  type="text"
                  name="livestock_types"
                  className={inputClass}
                  placeholder="e.g. Cattle, Poultry, Pigs, Sheep (comma-separated)"
                />
                <p className="text-xs text-stone-400 mt-1">Leave blank if not applicable</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Produce Types
                </label>
                <input
                  type="text"
                  name="produce_types"
                  className={inputClass}
                  placeholder="e.g. Vegetables, Herbs, Fruit, Grains (comma-separated)"
                />
                <p className="text-xs text-stone-400 mt-1">Leave blank if not applicable</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Regenerative / Sustainable Practices
                </label>
                <textarea
                  name="regenerative_practices"
                  rows={3}
                  className={inputClass}
                  placeholder="e.g. Rotational grazing, Cover cropping, No-till, Composting (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  name="certifications"
                  className={inputClass}
                  placeholder="e.g. USDA Organic, Certified Humane, Animal Welfare Approved (comma-separated)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Restaurant-specific: Dish Submissions */}
        {applicantType === 'restaurant' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                Dish Submissions
              </h2>
              <button
                type="button"
                onClick={addDish}
                className="text-[#2d6a4f] hover:text-[#1b4332] text-sm font-medium flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add Another Dish
              </button>
            </div>
            <div className="space-y-6">
              {dishes.map((dish, index) => (
                <DishFormSection
                  key={index}
                  index={index}
                  dish={dish}
                  onChange={handleDishChange}
                  onRemove={removeDish}
                  canRemove={dishes.length > 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Attestation */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
            <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              {applicantType === 'restaurant' ? '3' : '3'}
            </span>
            Attestation
          </h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestations.accurate}
                onChange={(e) => setAttestations({ ...attestations, accurate: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-stone-700">
                I attest that all information provided in this application is accurate and truthful
                to the best of my knowledge.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestations.mainElement}
                onChange={(e) => setAttestations({ ...attestations, mainElement: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-stone-700">
                {applicantType === 'restaurant'
                  ? 'I understand that certification applies to the main element of each dish only, and does not necessarily extend to all ingredients.'
                  : 'I understand that MAHA certification is dish-specific and applies to the main element sourced from our farm.'}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestations.verification}
                onChange={(e) => setAttestations({ ...attestations, verification: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-stone-700">
                I understand that MAHA may conduct additional verification of the claims made in
                this application, including contacting suppliers or farms directly.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attestations.revocation}
                onChange={(e) => setAttestations({ ...attestations, revocation: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <span className="text-sm text-stone-700">
                I understand that certification may be revoked if any claims are found to be
                inaccurate or if practices change without notification.
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !allAttested}
            className="w-full sm:w-auto bg-[#2d6a4f] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#1b4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
