'use client';

import { useState } from 'react';
import { DishFormData, DISH_CATEGORIES, US_STATES, US_STATE_NAMES } from '@/lib/types';
import { uploadCertFile } from '@/lib/actions';
import { useImageCropper } from '@/components/ImageCropper';

interface DishFormSectionProps {
  index: number;
  dish: DishFormData;
  onChange: (index: number, dish: DishFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const input = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none';

export default function DishFormSection({ index, dish, onChange, onRemove, canRemove }: DishFormSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const { requestCrop, cropperModal } = useImageCropper();

  const update = (field: keyof DishFormData, value: string | boolean) => {
    onChange(index, { ...dish, [field]: value });
  };

  async function handleCertFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    const file = selected.type.startsWith('image/') ? await requestCrop(selected) : selected;
    if (!file) return;
    setUploading(true);
    setUploadError('');
    update('cert_file_url', '');
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadCertFile(fd);
    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      update('cert_file_url', result.url);
    }
    setUploading(false);
  }

  const isUsda = dish.main_element_cert_type === 'usda_organic';
  const hasNoCert = dish.main_element_cert_type === 'none';
  const showFollowUp = dish.main_element_cert_type !== '' && dish.main_element_cert_type !== 'usda_organic';

  return (
    <div className="border border-stone-200 rounded-xl p-6 bg-white relative">
      {cropperModal}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800">Dish #{index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Dish Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={dish.name}
            onChange={(e) => update('name', e.target.value)}
            className={input}
            placeholder="e.g. Farm-to-Table Ribeye"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={dish.category}
            onChange={(e) => update('category', e.target.value)}
            className={input}
          >
            <option value="">Select category</option>
            {DISH_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={dish.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            className={input}
            placeholder="Brief description of the dish"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Main Element <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={dish.main_element}
            onChange={(e) => update('main_element', e.target.value)}
            className={input}
            placeholder="e.g. Grass-fed beef"
          />
        </div>
      </div>

      {/* Certification */}
      <div className="mt-6 border-t border-stone-100 pt-5">
        <h4 className="font-medium text-stone-800 text-sm mb-1">Main Element Certification <span className="text-red-500">*</span></h4>
        <p className="text-xs text-stone-500 mb-4">
          Certification status of the main element determines eligibility. USDA Organic is the preferred standard.
        </p>

        {/* Step 1 — USDA question */}
        <p className="text-sm font-medium text-stone-700 mb-3">
          Is the main element of this dish <span className="text-[#2d6a4f] font-semibold">USDA Organic Certified</span>?
        </p>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`usda-${index}`}
              checked={dish.main_element_cert_type === 'usda_organic'}
              onChange={() => update('main_element_cert_type', 'usda_organic')}
              className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
            />
            <span className="text-sm text-stone-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`usda-${index}`}
              checked={dish.main_element_cert_type !== '' && dish.main_element_cert_type !== 'usda_organic'}
              onChange={() => {
                if (dish.main_element_cert_type === '' || dish.main_element_cert_type === 'usda_organic') {
                  update('main_element_cert_type', 'none');
                }
              }}
              className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
            />
            <span className="text-sm text-stone-700">No</span>
          </label>
        </div>

        {/* USDA confirmed */}
        {isUsda && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            USDA Organic — preferred certification confirmed.
          </div>
        )}

        {/* Step 2 — follow-up if not USDA */}
        {showFollowUp && (
          <div className="border border-stone-200 rounded-xl p-5 bg-stone-50 space-y-3">
            <p className="text-sm font-medium text-stone-700">
              Does the main element hold any of the following certifications?
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`cert-type-${index}`}
                  checked={dish.main_element_cert_type === 'aga'}
                  onChange={() => update('main_element_cert_type', 'aga')}
                  className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-stone-700">AGA Certified (American Grassfed Association)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`cert-type-${index}`}
                  checked={dish.main_element_cert_type === 'raa'}
                  onChange={() => update('main_element_cert_type', 'raa')}
                  className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-stone-700">Regenerative Alliance of America Certified</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`cert-type-${index}`}
                  checked={dish.main_element_cert_type === 'other'}
                  onChange={() => update('main_element_cert_type', 'other')}
                  className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-stone-700">Other certification</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`cert-type-${index}`}
                  checked={dish.main_element_cert_type === 'none'}
                  onChange={() => { update('main_element_cert_type', 'none'); update('main_element_cert_other', ''); }}
                  className="h-4 w-4 text-[#2d6a4f] focus:ring-[#2d6a4f]"
                />
                <span className="text-sm text-stone-700">None of the above</span>
              </label>
            </div>

            {/* Other cert name input */}
            {dish.main_element_cert_type === 'other' && (
              <div className="pt-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Certification name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dish.main_element_cert_other}
                  onChange={(e) => update('main_element_cert_other', e.target.value)}
                  className={input}
                  placeholder="Enter the full name of the certification"
                />
              </div>
            )}

            {/* Cert document upload — shown for all non-USDA, non-none selections */}
            {(dish.main_element_cert_type === 'aga' || dish.main_element_cert_type === 'raa' || dish.main_element_cert_type === 'other') && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Upload certification document <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-stone-500 mb-2">Accepted formats: JPEG, PNG, PDF — max 10 MB</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleCertFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2d6a4f]/10 file:text-[#2d6a4f] hover:file:bg-[#2d6a4f]/20 disabled:opacity-50"
                />
                {uploading && (
                  <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </p>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>
                )}
                {dish.cert_file_url && !uploading && (
                  <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Document uploaded successfully.
                  </p>
                )}
              </div>
            )}

            {/* AGA / RAA confirmed */}
            {(dish.main_element_cert_type === 'aga' || dish.main_element_cert_type === 'raa') && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                This certification will require additional verification before approval.
              </div>
            )}

            {/* Other cert notice */}
            {dish.main_element_cert_type === 'other' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                Other certifications require manual review and may result in additional follow-up.
              </div>
            )}

            {/* No cert warning */}
            {hasNoCert && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>
                  <strong>Heads up:</strong> Dishes without a recognized certification are unlikely to be approved. You may still submit, but this dish will be flagged for review.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supplier Information */}
      <div className="mt-6 border-t border-stone-100 pt-5">
        <h4 className="font-medium text-stone-700 text-sm mb-3">Supplier Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={dish.supplier_name}
              onChange={(e) => update('supplier_name', e.target.value)}
              className={input}
              placeholder="Farm or supplier name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier City</label>
            <input
              type="text"
              value={dish.supplier_city}
              onChange={(e) => update('supplier_city', e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier State</label>
            <select
              value={dish.supplier_state}
              onChange={(e) => update('supplier_state', e.target.value)}
              className={input}
            >
              <option value="">Select state</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{US_STATE_NAMES[st]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier Website</label>
            <input
              type="url"
              value={dish.supplier_website}
              onChange={(e) => update('supplier_website', e.target.value)}
              className={input}
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={dish.meets_non_negotiables}
            onChange={(e) => update('meets_non_negotiables', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
          />
          <span className="text-sm text-stone-700">
            This dish meets all non-negotiable sourcing requirements
          </span>
        </label>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Additional Notes</label>
          <textarea
            value={dish.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            className={input}
            placeholder="Any additional information about this dish or its sourcing"
          />
        </div>
      </div>
    </div>
  );
}
