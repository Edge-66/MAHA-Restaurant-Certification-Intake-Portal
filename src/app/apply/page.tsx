'use client';

import { useState } from 'react';
import DishFormSection from '@/components/DishFormSection';
import { DishFormData, US_STATES, US_STATE_NAMES } from '@/lib/types';
import { submitApplication } from '@/lib/actions';
import Reveal from '@/components/Reveal';

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
  main_element_cert_type: '',
  main_element_cert_other: '',
  cert_file_url: '',
  meets_non_negotiables: false,
  notes: '',
};

export default function ApplyPage() {
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

    const form = e.currentTarget;
    const pw = (form.elements.namedItem('account_password') as HTMLInputElement)?.value ?? '';
    const pwConfirm = (form.elements.namedItem('account_password_confirm') as HTMLInputElement)?.value ?? '';

    if (pw.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pw !== pwConfirm) {
      setError('Password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    setError('');

    const formData = new FormData(form);
    formData.set('applicant_type', applicantType);
    formData.set('dishes_json', JSON.stringify(dishes));

    try {
      const result = await submitApplication(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      const digest =
        typeof err === 'object' && err !== null && 'digest' in err
          ? String((err as { digest?: unknown }).digest)
          : '';
      if (digest.startsWith('NEXT_REDIRECT')) {
        throw err;
      }
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
      <Reveal className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
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
      </Reveal>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Info (shared) */}
        <Reveal className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
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
        </Reveal>

        {/* Account password */}
        <Reveal delay={60} className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
            Create your account
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Use your contact email to sign in. Choose a password you&apos;ll use to access your dashboard and track your application.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="account_password"
                required
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="account_password_confirm"
                required
                autoComplete="new-password"
                minLength={8}
                className={inputClass}
                placeholder="Re-enter password"
              />
            </div>
          </div>
        </Reveal>

        {/* Farm-specific fields */}
        {applicantType === 'farm' && (
          <Reveal className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
              <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
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
          </Reveal>
        )}

        {/* Restaurant-specific: Dish Submissions */}
        {applicantType === 'restaurant' && (
          <Reveal className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-stone-900 flex items-center gap-2">
                <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
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
          </Reveal>
        )}

        {/* Attestation */}
        <Reveal className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-6 flex items-center gap-2">
            <span className="bg-[#2d6a4f] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
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
        </Reveal>

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
