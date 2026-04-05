import { Dish } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface DishCardProps {
  dish: Dish;
  showStatus?: boolean;
}

export default function DishCard({ dish, showStatus = false }: DishCardProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-stone-900">{dish.name}</h3>
          <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            {dish.category}
          </span>
        </div>
        {showStatus && <StatusBadge status={dish.status} />}
      </div>
      {dish.description && (
        <p className="text-sm text-stone-600 mb-3">{dish.description}</p>
      )}
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-stone-700">Main Element:</span>{' '}
          <span className="text-stone-600">{dish.main_element}</span>
        </div>
        <div className="bg-stone-50 rounded-lg p-3 space-y-1">
          <div className="font-medium text-stone-700 text-xs uppercase tracking-wider">
            Supplier Info
          </div>
          <div className="text-stone-600">{dish.supplier_name}</div>
          {(dish.supplier_city || dish.supplier_state) && (
            <div className="text-stone-500 text-xs">
              {[dish.supplier_city, dish.supplier_state].filter(Boolean).join(', ')}
            </div>
          )}
          {dish.supplier_website && (
            <a
              href={dish.supplier_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2d6a4f] hover:underline text-xs"
            >
              {dish.supplier_website}
            </a>
          )}
          {dish.supplier_certifications && (
            <div className="text-xs text-stone-500">
              Certifications: {dish.supplier_certifications}
            </div>
          )}
        </div>
        {dish.meets_non_negotiables && (
          <div className="flex items-center gap-1 text-green-700 text-xs">
            Meets non-negotiable sourcing requirements
          </div>
        )}
      </div>
    </div>
  );
}
