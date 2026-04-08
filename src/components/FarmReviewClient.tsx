'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import FarmReviewActions, { type FarmReviewDecision } from '@/components/FarmReviewActions';
import type { Farm } from '@/lib/types';
import { parseFarmTagField } from '@/lib/farmTags';

function certLabel(farm: Farm): string {
  const t = farm.cert_type;
  if (!t) return '—';
  if (t === 'usda') return 'USDA Organic';
  if (t === 'aga') return 'American Grassfed (AGA)';
  if (t === 'raa') return 'Regenerative Organic Certified';
  if (t === 'other') return farm.cert_other?.trim() || 'Other certification';
  if (t === 'none') return 'None / in progress';
  return t;
}

function getNextQueueId(queueIds: string[], currentId: string): string | null {
  const idx = queueIds.indexOf(currentId);
  if (idx === -1) return queueIds[0] ?? null;
  if (idx < queueIds.length - 1) return queueIds[idx + 1]!;
  return null;
}

export default function FarmReviewClient({
  farm,
  pendingQueueIds,
  adminTier,
}: {
  farm: Farm;
  pendingQueueIds: string[];
  adminTier: number;
}) {
  const router = useRouter();
  const inPendingQueue = farm.status === 'pending' && pendingQueueIds.includes(farm.id);
  const queueIndex = pendingQueueIds.indexOf(farm.id);
  const prevId = queueIndex > 0 ? pendingQueueIds[queueIndex - 1]! : null;
  const nextId =
    queueIndex >= 0 && queueIndex < pendingQueueIds.length - 1
      ? pendingQueueIds[queueIndex + 1]!
      : null;

  function afterDecision(decision: FarmReviewDecision) {
    if (decision === 'approved' || decision === 'rejected') {
      const next = getNextQueueId(pendingQueueIds, farm.id);
      if (next && next !== farm.id) {
        router.push(`/admin/farms/${next}/review`);
        router.refresh();
        return;
      }
    }
    router.push('/admin/review-queue');
    router.refresh();
  }

  const healthFromProfile = farm.health_practices ?? [];
  const livestockTags = parseFarmTagField(farm.livestock_types);
  const produceTags = parseFarmTagField(farm.produce_types);
  const regenerativeTags = parseFarmTagField(farm.regenerative_practices);
  const certTags = parseFarmTagField(farm.certifications);
  const practicesOther = (farm.farm_practices_other ?? '').trim();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link href="/admin/review-queue" className="text-sm text-[#2d6a4f] hover:underline">
          ← Review queue
        </Link>
        <span className="text-stone-300">|</span>
        <Link href={`/admin/farms/${farm.id}`} className="text-sm text-stone-500 hover:text-stone-800 hover:underline">
          Open full farm profile (edit)
        </Link>
      </div>

      {inPendingQueue && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">Queue:</span>{' '}
            {queueIndex + 1} of {pendingQueueIds.length} pending
          </p>
          <div className="flex gap-2">
            {prevId ? (
              <Link
                href={`/admin/farms/${prevId}/review`}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                ← Previous
              </Link>
            ) : (
              <span className="text-sm px-3 py-1.5 text-stone-400">← Previous</span>
            )}
            {nextId ? (
              <Link
                href={`/admin/farms/${nextId}/review`}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Next →
              </Link>
            ) : (
              <span className="text-sm px-3 py-1.5 text-stone-400">Next →</span>
            )}
          </div>
        </div>
      )}

      {!inPendingQueue && farm.status !== 'pending' && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          This farm is <strong>{farm.status}</strong> and is not in the pending queue. You can still update status
          below or{' '}
          <Link href={`/admin/farms/${farm.id}`} className="font-medium underline">
            manage the full profile
          </Link>
          .
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">{farm.name}</h1>
          <p className="text-stone-500 text-sm">
            {farm.city}, {farm.state}
            {farm.contact_email && (
              <>
                {' · '}
                <a href={`mailto:${farm.contact_email}`} className="text-[#2d6a4f] hover:underline">
                  {farm.contact_email}
                </a>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={farm.status} />
      </div>

      {/* Review actions */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Decision</h2>
        <FarmReviewActions
          farmId={farm.id}
          certType={farm.cert_type}
          adminTier={adminTier}
          onCompleted={afterDecision}
        />
      </div>

      {/* Application snapshot (read-only) */}
      <div className="space-y-6">
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Certification</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-stone-500 font-medium">Declared type</dt>
              <dd className="text-stone-900 mt-0.5">{certLabel(farm)}</dd>
            </div>
            {farm.cert_file_url && (
              <div>
                <dt className="text-stone-500 font-medium">Uploaded document</dt>
                <dd className="mt-1">
                  <a
                    href={farm.cert_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2d6a4f] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Open certification file
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </dd>
              </div>
            )}
            {!farm.cert_file_url && farm.cert_type && farm.cert_type !== 'usda' && farm.cert_type !== 'none' && (
              <p className="text-amber-800 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No document was uploaded. Verify certification through other records before approving.
              </p>
            )}
            {farm.cert_verified_at && (
              <p className="text-xs text-stone-500">
                Last certification verification recorded{' '}
                {new Date(farm.cert_verified_at).toLocaleString()} {farm.cert_verified_by && `by ${farm.cert_verified_by}`}
              </p>
            )}
          </dl>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Practices & production</h2>
          <div className="space-y-4 text-sm">
            {healthFromProfile.length > 0 && (
              <div>
                <p className="text-stone-500 font-medium mb-2">Better health practices (profile)</p>
                <ul className="flex flex-wrap gap-2">
                  {healthFromProfile.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center rounded-full bg-[#2d6a4f]/10 text-[#2d6a4f] text-xs font-medium px-3 py-1 border border-[#2d6a4f]/20"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {livestockTags.length > 0 && (
              <div>
                <p className="text-stone-500 font-medium mb-2">Livestock</p>
                <ul className="flex flex-wrap gap-2">
                  {livestockTags.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center rounded-full bg-stone-100 text-stone-800 text-xs font-medium px-3 py-1 border border-stone-200"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {produceTags.length > 0 && (
              <div>
                <p className="text-stone-500 font-medium mb-2">Produce</p>
                <ul className="flex flex-wrap gap-2">
                  {produceTags.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center rounded-full bg-amber-50 text-amber-950 text-xs font-medium px-3 py-1 border border-amber-200/80"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {regenerativeTags.length > 0 && (
              <div>
                <p className="text-stone-500 font-medium mb-2">Regenerative / better health (checkboxes)</p>
                <ul className="flex flex-wrap gap-2">
                  {regenerativeTags.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-900 text-xs font-medium px-3 py-1 border border-emerald-200"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {practicesOther && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                <p className="text-stone-500 font-medium mb-1">Other (free text — verify before approval)</p>
                <p className="text-stone-800 text-sm whitespace-pre-wrap">{practicesOther}</p>
              </div>
            )}
            {certTags.length > 0 && (
              <div>
                <p className="text-stone-500 font-medium mb-2">Additional certifications</p>
                <ul className="flex flex-wrap gap-2">
                  {certTags.map((p) => (
                    <li
                      key={p}
                      className="inline-flex items-center rounded-full bg-stone-100 text-stone-800 text-xs font-medium px-3 py-1 border border-stone-200"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {farm.description && (
              <div>
                <p className="text-stone-500 font-medium mb-1">Description</p>
                <p className="text-stone-800 whitespace-pre-wrap">{farm.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Contact (reference)</h2>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-stone-500">Name</dt>
              <dd className="text-stone-900">{farm.contact_name}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Phone</dt>
              <dd className="text-stone-900">{farm.contact_phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-stone-500">Address</dt>
              <dd className="text-stone-900">
                {[farm.address, farm.city, farm.state, farm.zip].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
