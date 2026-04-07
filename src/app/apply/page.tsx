'use client';

import { useRef, useState } from 'react';
import DishFormSection from '@/components/DishFormSection';
import { DishFormData, US_STATES, US_STATE_NAMES } from '@/lib/types';
import { submitApplication, uploadCertFile } from '@/lib/actions';

const HEALTH_PRACTICE_OPTIONS = [
  'Locally sourced ingredients',
  'No seed oils',
  'Pasture-raised / grass-fed',
  'No antibiotics or added hormones',
  'Non-GMO',
  'Animal welfare certified',
  'Whole / minimally processed ingredients',
  'Regenerative sourced',
];

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

const STEPS = [
  { label: 'Type' },
  { label: 'Info' },
  { label: 'Account' },
  { label: 'Details' },
  { label: 'Review' },
];

export default function ApplyPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [applicantType, setApplicantType] = useState<'restaurant' | 'farm'>('restaurant');
  const [dishes, setDishes] = useState<DishFormData[]>([{ ...emptyDish }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stepError, setStepError] = useState('');

  const [healthPractices, setHealthPractices] = useState<string[]>([]);
  const [otherPractice, setOtherPractice] = useState('');

  // Farm certification state
  const [farmCertUsdaYes, setFarmCertUsdaYes] = useState<boolean | null>(null);
  const [farmCertType, setFarmCertType] = useState('');
  const [farmCertOther, setFarmCertOther] = useState('');
  const [farmCertFileUrl, setFarmCertFileUrl] = useState('');
  const [farmCertUploading, setFarmCertUploading] = useState(false);

  function togglePractice(label: string) {
    setHealthPractices((prev) =>
      prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]
    );
  }

  const [attestations, setAttestations] = useState({
    accurate: false,
    mainElement: false,
    verification: false,
    revocation: false,
  });

  const allAttested = Object.values(attestations).every(Boolean);

  // ─── Step validation ───────────────────────────────────────────────────────
  function validateStep(s: number): string {
    const form = formRef.current;
    if (!form) return '';
    const formEl = form;

    function val(name: string) {
      return ((formEl.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').trim();
    }

    if (s === 1) {
      const required = ['name', 'contact_name', 'contact_email', 'contact_phone', 'city', 'state'];
      if (applicantType === 'restaurant') required.push('address', 'zip');
      for (const f of required) {
        if (!val(f)) return `Please fill in all required fields.`;
      }
      const email = val('contact_email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    }

    if (s === 2) {
      const pw = val('account_password');
      const confirm = val('account_password_confirm');
      if (pw.length < 8) return 'Password must be at least 8 characters.';
      if (pw !== confirm) return 'Passwords do not match.';
    }

    if (s === 3 && applicantType === 'restaurant') {
      for (const dish of dishes) {
        if (!dish.name.trim()) return 'Each dish must have a name.';
        if (!dish.main_element.trim()) return 'Each dish must have a main element.';
        if (!dish.supplier_name.trim()) return 'Each dish must have a supplier name.';
        if (!dish.main_element_cert_type) return 'Please answer the certification question for each dish.';
        if (dish.main_element_cert_type === 'other' && !dish.main_element_cert_other.trim()) {
          return 'Please enter the certification name for the "Other" option.';
        }
      }
    }

    if (s === 3 && applicantType === 'farm') {
      if (farmCertUsdaYes === null) return 'Please answer the USDA Organic certification question.';
      if (farmCertUsdaYes === false && !farmCertType) return 'Please select your certification type.';
      if (farmCertType === 'other' && !farmCertOther.trim()) return 'Please enter the name of your certification.';
    }

    return '';
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { setStepError(err); return; }
    setStepError('');
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStepError('');
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!allAttested) { setError('Please agree to all attestation statements.'); return; }

    setSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('applicant_type', applicantType);
    formData.set('dishes_json', JSON.stringify(dishes));
    const allPractices = [
      ...healthPractices,
      ...(otherPractice.trim() ? [otherPractice.trim()] : []),
    ];
    formData.set('health_practices_json', JSON.stringify(allPractices));

    if (applicantType === 'farm') {
      const resolvedCertType = farmCertUsdaYes ? 'usda' : farmCertType;
      formData.set('farm_cert_type', resolvedCertType);
      if (farmCertOther) formData.set('farm_cert_other', farmCertOther);
      if (farmCertFileUrl) formData.set('farm_cert_file_url', farmCertFileUrl);
    }

    try {
      const result = await submitApplication(formData);
      if (result?.error) setError(result.error);
    } catch (err) {
      const digest = typeof err === 'object' && err !== null && 'digest' in err
        ? String((err as { digest?: unknown }).digest) : '';
      if (digest.startsWith('NEXT_REDIRECT')) throw err;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

  // ─── Progress Bar ──────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="mb-10">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-stone-200 -z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-[#2d6a4f] transition-all duration-500 -z-0"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 z-10">
              <button
                type="button"
                disabled={!done}
                onClick={() => { if (done) { setStepError(''); setStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  done ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white cursor-pointer hover:bg-[#1b4332] hover:border-[#1b4332]'
                    : active ? 'bg-white border-[#2d6a4f] text-[#2d6a4f] cursor-default'
                    : 'bg-white border-stone-300 text-stone-400 cursor-default'
                }`}
              >
                {done
                  ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  : i + 1}
              </button>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-[#2d6a4f]' : done ? 'text-stone-500' : 'text-stone-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Apply for Certification</h1>
        <p className="text-stone-500 text-sm">Complete the steps below to apply for the MAHA From the Farm program.</p>
      </div>

      <ProgressBar />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
      )}
      {stepError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">{stepError}</div>
      )}

      <form ref={formRef} onSubmit={handleSubmit}>

        {/* ── Step 0: Type ─────────────────────────────────────────────────── */}
        <div className={step === 0 ? '' : 'hidden'}>
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">I am applying as a…</h2>
            <p className="text-sm text-stone-500 mb-5">Choose the option that best describes you.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['restaurant', 'farm'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setApplicantType(t)}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    applicantType === t ? 'border-[#2d6a4f] bg-[#2d6a4f]/5' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${applicantType === t ? 'bg-[#2d6a4f]/10' : 'bg-stone-100'}`}>
                    {t === 'restaurant'
                      ? <svg className={`w-5 h-5 ${applicantType === t ? 'text-[#2d6a4f]' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                      : <svg className={`w-5 h-5 ${applicantType === t ? 'text-[#2d6a4f]' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 5.4-5 7.8-5 11a5 5 0 0 0 10 0c0-3.2-3.8-5.6-5-11Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4" /></svg>
                    }
                  </div>
                  <div className="font-semibold text-stone-900 mb-1 capitalize">{t === 'farm' ? 'Farm / Producer' : 'Restaurant'}</div>
                  <p className="text-xs text-stone-500">
                    {t === 'restaurant'
                      ? 'I serve dishes sourced from verified farms and want to certify them.'
                      : 'I raise livestock or grow produce and want to join the MAHA network.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Step 1: Info ──────────────────────────────────────────────────── */}
        <div className={step === 1 ? '' : 'hidden'}>
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-5">
              {applicantType === 'restaurant' ? 'Restaurant' : 'Farm'} Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  {applicantType === 'restaurant' ? 'Restaurant' : 'Farm'} Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="name" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                <input type="text" name="contact_name" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Email <span className="text-red-500">*</span></label>
                <input type="email" name="contact_email" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input type="tel" name="contact_phone" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
                <input type="url" name="website" className={inp} placeholder="https://" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Street Address {applicantType === 'restaurant' && <span className="text-red-500">*</span>}
                </label>
                <input type="text" name="address" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">City <span className="text-red-500">*</span></label>
                <input type="text" name="city" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">State <span className="text-red-500">*</span></label>
                <select name="state" className={inp}>
                  <option value="">Select state</option>
                  {US_STATES.map((st) => <option key={st} value={st}>{US_STATE_NAMES[st]}</option>)}
                </select>
              </div>
              {applicantType === 'restaurant' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">ZIP Code <span className="text-red-500">*</span></label>
                  <input type="text" name="zip" pattern="[0-9]{5}" className={inp} />
                </div>
              )}
              <div className={applicantType === 'restaurant' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className={inp}
                  placeholder={applicantType === 'restaurant'
                    ? 'Tell us about your restaurant…'
                    : 'Tell us about your farm and farming philosophy…'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 2: Account ───────────────────────────────────────────────── */}
        <div className={step === 2 ? '' : 'hidden'}>
          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-1">Create Your Account</h2>
            <p className="text-sm text-stone-500 mb-6">
              Use your contact email to sign in and track your application from your dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input type="password" name="account_password" autoComplete="new-password" className={inp} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <input type="password" name="account_password_confirm" autoComplete="new-password" className={inp} placeholder="Re-enter password" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 3: Details ───────────────────────────────────────────────── */}
        <div className={step === 3 ? '' : 'hidden'}>
          {applicantType === 'restaurant' ? (
            <>
              {/* Dish submissions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">Dish Submissions</h2>
                    <p className="text-sm text-stone-500 mt-0.5">Add each dish you'd like to certify.</p>
                  </div>
                  <button type="button" onClick={addDish} className="flex items-center gap-1.5 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Dish
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

              {/* Better Health Practices */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-1">Better Health Practices</h2>
                <p className="text-sm text-stone-500 mb-5">
                  Select any practices your restaurant follows that you&apos;d like to showcase. These will appear on your public profile.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {HEALTH_PRACTICE_OPTIONS.map((label) => {
                    const checked = healthPractices.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => togglePractice(label)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                          checked
                            ? 'border-[#2d6a4f] bg-[#2d6a4f]/5 text-[#2d6a4f]'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          checked ? 'bg-[#2d6a4f] border-[#2d6a4f]' : 'border-stone-300'
                        }`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Other practices</label>
                  <input
                    type="text"
                    value={otherPractice}
                    onChange={(e) => setOtherPractice(e.target.value)}
                    className={inp}
                    placeholder="e.g. No high-fructose corn syrup, Fermented foods, Organic dairy…"
                  />
                  <p className="text-xs text-stone-400 mt-1">Optional — describe any additional practices not listed above.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-5">Farm Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Livestock Types</label>
                    <input type="text" name="livestock_types" className={inp} placeholder="e.g. Cattle, Poultry, Pigs (comma-separated)" />
                    <p className="text-xs text-stone-400 mt-1">Leave blank if not applicable</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Produce Types</label>
                    <input type="text" name="produce_types" className={inp} placeholder="e.g. Vegetables, Herbs, Grains (comma-separated)" />
                    <p className="text-xs text-stone-400 mt-1">Leave blank if not applicable</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Regenerative / Better Health Practices</label>
                    <textarea name="regenerative_practices" rows={3} className={inp} placeholder="Describe any regenerative, sustainable, or better health practices your farm follows…" />
                  </div>
                </div>
              </div>

              {/* Farm Certification */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-1">Certification</h2>
                <p className="text-sm text-stone-500 mb-5">Tell us about your farm&apos;s certifications. This helps restaurants find verified suppliers.</p>

                {/* USDA Organic yes/no */}
                <p className="text-sm font-medium text-stone-700 mb-3">Is your farm USDA Organic Certified? <span className="text-red-500">*</span></p>
                <div className="flex gap-3 mb-5">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => { setFarmCertUsdaYes(val); setFarmCertType(''); setFarmCertOther(''); setFarmCertFileUrl(''); }}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        farmCertUsdaYes === val
                          ? 'border-[#2d6a4f] bg-[#2d6a4f]/5 text-[#2d6a4f]'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>

                {/* USDA confirmed */}
                {farmCertUsdaYes === true && (
                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-emerald-800 font-medium">USDA Organic Certified — you&apos;re all set.</p>
                  </div>
                )}

                {/* Non-USDA options */}
                {farmCertUsdaYes === false && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-stone-700 mb-3">Which best describes your certification? <span className="text-red-500">*</span></p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { value: 'aga', label: 'American Grassfed (AGA)' },
                          { value: 'raa', label: 'Regenerative Organic Certified' },
                          { value: 'other', label: 'Other Certification' },
                          { value: 'none', label: 'None / In Progress' },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => { setFarmCertType(value); setFarmCertOther(''); setFarmCertFileUrl(''); }}
                            className={`px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                              farmCertType === value
                                ? 'border-[#2d6a4f] bg-[#2d6a4f]/5 text-[#2d6a4f]'
                                : 'border-stone-200 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {farmCertType === 'other' && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Certification name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={farmCertOther}
                          onChange={(e) => setFarmCertOther(e.target.value)}
                          className={inp}
                          placeholder="e.g. Certified Humane, Animal Welfare Approved…"
                        />
                      </div>
                    )}

                    {(farmCertType === 'aga' || farmCertType === 'raa' || farmCertType === 'other') && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Upload certification document</label>
                        <p className="text-xs text-stone-400 mb-2">PDF, PNG, or JPG — optional but recommended for faster verification.</p>
                        {farmCertFileUrl ? (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-xs text-emerald-800 flex-1 truncate">Document uploaded</span>
                            <button type="button" onClick={() => setFarmCertFileUrl('')} className="text-xs text-stone-400 hover:text-stone-600">Remove</button>
                          </div>
                        ) : (
                          <label className={`flex items-center gap-2 px-4 py-2.5 border border-stone-300 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors ${farmCertUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            <span className="text-sm text-stone-600">{farmCertUploading ? 'Uploading…' : 'Choose file'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              className="hidden"
                              disabled={farmCertUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setFarmCertUploading(true);
                                try {
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  fd.append('context', 'farm_cert');
                                  const result = await uploadCertFile(fd);
                                  if (result?.url) setFarmCertFileUrl(result.url);
                                } catch { /* ignore upload errors */ } finally {
                                  setFarmCertUploading(false);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Step 4: Review & Attest ───────────────────────────────────────── */}
        <div className={step === 4 ? '' : 'hidden'}>
          {/* Summary card */}
          <div className="bg-[#2d6a4f]/5 border border-[#2d6a4f]/20 rounded-xl p-5 mb-6">
            <h2 className="text-base font-semibold text-[#2d6a4f] mb-3">Application Summary</h2>
            <div className="text-sm text-stone-600 space-y-1">
              <p><span className="font-medium text-stone-800">Type:</span> {applicantType === 'restaurant' ? 'Restaurant' : 'Farm / Producer'}</p>
              {applicantType === 'restaurant' && (
                <p><span className="font-medium text-stone-800">Dishes:</span> {dishes.length} submitted</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-stone-900 mb-2">Attestation</h2>
            <p className="text-sm text-stone-500 mb-5">Please read and agree to each statement before submitting.</p>
            <div className="space-y-4">
              {[
                { key: 'accurate' as const, text: 'I attest that all information provided in this application is accurate and truthful to the best of my knowledge.' },
                { key: 'mainElement' as const, text: applicantType === 'restaurant'
                  ? 'I understand that certification applies to the main element of each dish only, and does not necessarily extend to all ingredients.'
                  : 'I understand that MAHA certification is dish-specific and applies to the main element sourced from our farm.' },
                { key: 'verification' as const, text: 'I understand that MAHA may conduct additional verification of the claims made in this application, including contacting suppliers or farms directly.' },
                { key: 'revocation' as const, text: 'I understand that certification may be revoked if any claims are found to be inaccurate or if practices change without notification.' },
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
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>

      </form>

      {/* Navigation */}
      <div className={`flex mt-6 ${step === 0 ? 'justify-end' : step < 4 ? 'justify-between' : 'justify-start'}`}>
        {step > 0 && (
          <button type="button" onClick={handleBack} className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 px-4 py-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
        )}
        {step < 4 && (
          <button type="button" onClick={handleNext} className="flex items-center gap-1.5 bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1b4332] transition-colors">
            Continue
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
