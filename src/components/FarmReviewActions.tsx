'use client';

import { useState } from 'react';
import { submitFarmReviewDecision } from '@/lib/actions';
import type { Farm } from '@/lib/types';

export type FarmReviewDecision = 'approved' | 'rejected' | 'pending';

function needsCertAck(certType: Farm['cert_type']): boolean {
  return certType === 'aga' || certType === 'raa' || certType === 'other';
}

export default function FarmReviewActions({
  farmId,
  certType,
  adminTier,
  onCompleted,
}: {
  farmId: string;
  certType: Farm['cert_type'];
  adminTier: number;
  onCompleted?: (decision: FarmReviewDecision) => void;
}) {
  const [loading, setLoading] = useState<FarmReviewDecision | null>(null);
  const [error, setError] = useState('');
  const [certConfirmed, setCertConfirmed] = useState(false);

  async function submit(decision: FarmReviewDecision) {
    setError('');
    if (decision === 'approved' && needsCertAck(certType) && !certConfirmed) {
      setError('Confirm certification verification below before approving.');
      return;
    }
    setLoading(decision);
    const result = await submitFarmReviewDecision(farmId, decision, {
      certVerificationConfirmed:
        decision === 'approved' && needsCertAck(certType) ? certConfirmed : undefined,
    });
    setLoading(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCertConfirmed(false);
    onCompleted?.(decision);
  }

  if (adminTier < 2) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Approving or rejecting farms requires <strong>Reviewer</strong> (Tier 2) or higher.
      </div>
    );
  }

  const btnBase =
    'inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[7rem]';

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {needsCertAck(certType) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-2">Certification check</p>
          <label className="flex items-start gap-3 cursor-pointer text-sm text-amber-950">
            <input
              type="checkbox"
              checked={certConfirmed}
              onChange={(e) => setCertConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-400 text-[#2d6a4f] focus:ring-[#2d6a4f]"
            />
            <span>
              I confirm I have reviewed and verified this farm&apos;s third-party certification
              (including any uploaded documentation or external records).
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => submit('approved')}
          className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {loading === 'approved' ? 'Saving…' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => submit('rejected')}
          className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
        >
          {loading === 'rejected' ? 'Saving…' : 'Reject'}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => submit('pending')}
          className={`${btnBase} bg-white border border-stone-300 text-stone-800 hover:bg-stone-50`}
        >
          {loading === 'pending' ? 'Saving…' : 'Pending'}
        </button>
      </div>
      <p className="text-xs text-stone-500">
        <strong>Pending</strong> keeps the application in the review queue without approving or rejecting.
      </p>
    </div>
  );
}
