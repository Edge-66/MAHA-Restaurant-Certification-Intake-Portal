'use client';

import { useState } from 'react';

type Dish = {
  id: string;
  name: string;
  category: string;
  main_element: string;
  supplier_name: string;
  supplier_city: string | null;
  supplier_state: string | null;
  status: string;
};

interface Props {
  dishes: Dish[];
  qrCodes: Record<string, string>; // dishId → data URL
}

export default function CertifiedDishes({ dishes, qrCodes }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="divide-y divide-stone-100">
      {dishes.map((dish) => {
        const isOpen = expanded === dish.id;
        const qr = qrCodes[dish.id];

        return (
          <div key={dish.id}>
            {/* Row — always visible */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : dish.id)}
              className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="font-medium text-stone-900 text-sm">{dish.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {dish.main_element} — {dish.supplier_name}
                  {(dish.supplier_city || dish.supplier_state) && (
                    <>, {[dish.supplier_city, dish.supplier_state].filter(Boolean).join(', ')}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {dish.category}
                </span>
                <svg
                  className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-6 pb-5 bg-stone-50 border-t border-stone-100">
                <div className="pt-4 flex flex-col sm:flex-row gap-6 items-start">
                  {/* Dish details */}
                  <div className="flex-1 space-y-2 text-sm">
                    <div>
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Main element</span>
                      <p className="text-stone-900 mt-0.5">{dish.main_element}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Supplier</span>
                      <p className="text-stone-900 mt-0.5">
                        {dish.supplier_name}
                        {(dish.supplier_city || dish.supplier_state) && (
                          <span className="text-stone-500">
                            {' '}· {[dish.supplier_city, dish.supplier_state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Category</span>
                      <p className="text-stone-900 mt-0.5">{dish.category}</p>
                    </div>
                  </div>

                  {/* QR code */}
                  {qr && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-white rounded-xl border border-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qr} alt={`QR code for ${dish.name}`} width={120} height={120} />
                      </div>
                      <p className="text-[11px] text-stone-400 text-center">Scan to view certified page</p>
                      <a
                        href={qr}
                        download={`${dish.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.png`}
                        className="text-xs font-medium text-[#2d6a4f] hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR code
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
