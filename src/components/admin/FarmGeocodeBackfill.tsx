'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { backfillMissingFarmCoordinates } from '@/lib/actions';

export default function FarmGeocodeBackfill({ farmsMissingCoordsCount }: { farmsMissingCoordsCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    updated: number;
    skipped: number;
    failed: { id: string; name: string; reason: string }[];
    remainingWithoutCoords: number;
  } | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    setLastResult(null);
    try {
      const res = await backfillMissingFarmCoordinates({ limit: 60 });
      if (res.error) {
        setMessage(res.error);
        return;
      }
      setLastResult({
        updated: res.updated,
        skipped: res.skipped,
        failed: res.failed,
        remainingWithoutCoords: res.remainingWithoutCoords,
      });
      setMessage(
        res.remainingWithoutCoords > 0
          ? `Updated ${res.updated} farm${res.updated !== 1 ? 's' : ''}. ${res.remainingWithoutCoords} still need coordinates — run again if needed.`
          : `Updated ${res.updated} farm${res.updated !== 1 ? 's' : ''}. All farms now have coordinates.`
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (farmsMissingCoordsCount === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        Every farm has map coordinates (or none are missing latitude/longitude).
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2d6a4f]/25 bg-[#2d6a4f]/5 px-4 py-4 text-sm">
      <h2 className="font-semibold text-stone-900 mb-1">Map coordinates</h2>
      <p className="text-stone-600 mb-3 max-w-2xl">
        <strong>{farmsMissingCoordsCount}</strong> farm{farmsMissingCoordsCount !== 1 ? 's' : ''} missing latitude/longitude
        (common after bulk import). We use OpenStreetMap to place pins from address + city + state + ZIP — usually accurate for
        street addresses; PO boxes and bad addresses may be wrong or land near town center. Spot-check important listings.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-60 transition-colors"
      >
        {loading ? 'Geocoding… (may take a minute)' : 'Fill coordinates from addresses'}
      </button>
      {message && <p className="mt-3 text-stone-800">{message}</p>}
      {lastResult && lastResult.failed.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-amber-900 text-xs space-y-1 max-h-40 overflow-y-auto">
          {lastResult.failed.map((f) => (
            <li key={f.id}>
              <span className="font-medium">{f.name}</span>: {f.reason}
            </li>
          ))}
        </ul>
      )}
      {lastResult && lastResult.skipped > 0 && (
        <p className="mt-2 text-xs text-stone-500">Skipped {lastResult.skipped} with missing city or state.</p>
      )}
    </div>
  );
}
