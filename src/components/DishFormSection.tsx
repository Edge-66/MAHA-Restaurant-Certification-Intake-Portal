'use client';

import { DishFormData, DISH_CATEGORIES, US_STATES, US_STATE_NAMES } from '@/lib/types';

interface DishFormSectionProps {
  index: number;
  dish: DishFormData;
  onChange: (index: number, dish: DishFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export default function DishFormSection({ index, dish, onChange, onRemove, canRemove }: DishFormSectionProps) {
  const update = (field: keyof DishFormData, value: string | boolean) => {
    onChange(index, { ...dish, [field]: value });
  };

  return (
    <div className="border border-stone-200 rounded-xl p-6 bg-white relative">
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
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
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
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
          >
            <option value="">Select category</option>
            {DISH_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={dish.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
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
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
            placeholder="e.g. Grass-fed beef"
          />
        </div>
      </div>

      <div className="mt-6 border-t border-stone-100 pt-4">
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
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
              placeholder="Farm or supplier name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier City</label>
            <input
              type="text"
              value={dish.supplier_city}
              onChange={(e) => update('supplier_city', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier State</label>
            <select
              value={dish.supplier_state}
              onChange={(e) => update('supplier_state', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
            >
              <option value="">Select state</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {US_STATE_NAMES[st]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier Website</label>
            <input
              type="url"
              value={dish.supplier_website}
              onChange={(e) => update('supplier_website', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
              placeholder="https://"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">Supplier Certifications</label>
            <input
              type="text"
              value={dish.supplier_certifications}
              onChange={(e) => update('supplier_certifications', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
              placeholder="e.g. USDA Organic, Certified Humane"
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
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent outline-none"
            placeholder="Any additional information about this dish"
          />
        </div>
      </div>
    </div>
  );
}
