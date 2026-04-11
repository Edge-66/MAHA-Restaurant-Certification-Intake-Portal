'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DishFormSection from '@/components/DishFormSection';
import { DishFormData } from '@/lib/types';
import { submitAdditionalRestaurantDishes } from '@/lib/actions';

function RedirectBanner() {
  const params = useSearchParams();
  if (params.get('from') !== 'apply') return null;
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 text-sm mb-6">
      You already have a MAHA account. Use this form to submit additional dishes for certification — your restaurant profile on file stays the same.
    </div>
  );
}

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

export default function AddRestaurantDishesPage() {
  const [dishes, setDishes] = useState<DishFormData[]>([{ ...emptyDish }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [attestations, setAttestations] = useState({
    accurate: false,
    mainElement: false,
    verification: false,
    revocation: false,
  });

  const allAttested = Object.values(attestations).every(Boolean);

  function validateDishes(): string {
    for (const dish of dishes) {
      if (!dish.name.trim()) return 'Each dish must have a name.';
      if (!dish.main_element.trim()) return 'Each dish must have a main element.';
      if (!dish.supplier_name.trim()) return 'Each dish must have a supplier name.';
      if (!dish.main_element_cert_type) return 'Please answer the certification question for each dish.';
      if (dish.main_element_cert_type === 'other' && !dish.main_element_cert_other.trim()) {
        return 'Please enter the certification name for the "Other" option.';
      }
    }
    return '';
  }

  const handleDishChange = (index: number, dish: DishFormData) => {
    const updated = [...dishes];
    updated[index] = dish;
    setDishes(updated);
  };

  const addDish = () => setDishes([...dishes, { ...emptyDish }]);
  const removeDish = (index: number) => setDishes(dishes.filter((_, i) => i !== index));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dishErr = validateDishes();
    if (dishErr) {
      setError(dishErr);
      return;
    }
    if (!allAttested) {
      setError('Please agree to all attestation statements.');
      return;
    }

    setSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('dishes_json', JSON.stringify(dishes));

    try {
      const result = await submitAdditionalRestaurantDishes(formData);
      if (result?.error) setError(result.error);
    } catch (err) {
      const digest =
        typeof err === 'object' && err !== null && 'digest' in err
          ? String((err as { digest?: unknown }).digest)
          : '';
      if (digest.startsWith('NEXT_REDIRECT')) throw err;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/restaurant"
          className="text-sm text-stone-500 hover:text-stone-800 mb-3 inline-flex items-center gap-1"
        >
          <span aria-hidden>←</span> Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">Certify new dishes</h1>
        <p className="text-stone-500 text-sm mt-1">
          Submit dishes for MAHA review. Your restaurant profile on file will stay the same.
        </p>
      </div>

      <Suspense>
        <RedirectBanner />
      </Suspense>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">Dish submissions</h2>
              <p className="text-sm text-stone-500 mt-0.5">Add each dish you&apos;d like to certify.</p>
            </div>
            <button
              type="button"
              onClick={addDish}
              className="flex items-center gap-1.5 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add dish
            </button>
          </div>
          <div className="space-y-6">
            {dishes.map((dish, i) => (
              <DishFormSection
                key={i}
                index={i}
                dish={dish}
                onChange={handleDishChange}
                onRemove={removeDish}
                canRemove={dishes.length > 1}
              />
            ))}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Attestation</h2>
          <p className="text-sm text-stone-500 mb-5">Please read and agree to each statement before submitting.</p>
          <div className="space-y-4">
            {[
              {
                key: 'accurate' as const,
                text: 'I attest that all information provided in this application is accurate and truthful to the best of my knowledge.',
              },
              {
                key: 'mainElement' as const,
                text: 'I understand that certification applies to the main element of each dish only, and does not necessarily extend to all ingredients.',
              },
              {
                key: 'verification' as const,
                text: 'I understand that MAHA may conduct additional verification of the claims made in this application, including contacting suppliers or farms directly.',
              },
              {
                key: 'revocation' as const,
                text: 'I understand that certification may be revoked if any claims are found to be inaccurate or if practices change without notification.',
              },
            ].map(({ key, text }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={attestations[key]}
                  onChange={(e) => setAttestations({ ...attestations, [key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-stone-700 leading-relaxed group-hover:text-stone-900">{text}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !allAttested}
          className="w-full bg-[#2d6a4f] text-white py-3.5 rounded-xl font-semibold hover:bg-[#1b4332] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}
