/**
 * StichtingCard — overview-grid item (Phase 27 Plan 02 R1, D-02).
 *
 * Mirrors `SchoolCard` visual anatomy. The mix-indicator stays grey
 * ('unknown') until Plan 27-05 fills `currentToolUsage` per niveau.
 */
import { Link } from '@tanstack/react-router';
import type { StichtingRecord } from '@/models/stichting';
import {
  STICHTING_USAGE_MIX_COLORS,
  STICHTING_USAGE_MIX_LABELS,
  type UsageMix,
} from '@/models/stichting';

interface StichtingCardProps {
  stichting: StichtingRecord;
  /** Total schools linked to this Stichting. */
  schoolCount: number;
  /** Aggregated mix derived from linked schools — `'unknown'` until Plan 27-05. */
  usageMix: UsageMix;
}

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default function StichtingCard({
  stichting,
  schoolCount,
  usageMix,
}: StichtingCardProps) {
  const schoolLabel =
    schoolCount === 0
      ? 'Nog geen scholen'
      : schoolCount === 1
        ? '1 school gekoppeld'
        : `${schoolCount} scholen gekoppeld`;

  return (
    <Link
      to="/stichtingen/$id"
      params={{ id: stichting.id }}
      className="block bg-white border border-neutral-200 border-l-[3px] border-l-neutral-300 rounded-lg p-5 hover:shadow-md hover:border-neutral-300 transition-all duration-150 focus:outline-2 focus:outline-cito-primary focus:outline-offset-2"
      aria-label={`Stichting ${stichting.name} openen`}
    >
      {/* Header */}
      <div className="mb-1.5">
        <h3 className="font-semibold text-cito-primary text-base truncate">
          {stichting.name}
        </h3>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12px] text-neutral-400">
          {dateFormatter.format(new Date(stichting.updatedAt))}
        </span>
        {stichting.region && (
          <span className="inline-flex items-center gap-1 text-[12px] text-neutral-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {stichting.region}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
        {/* School count */}
        <div className="flex items-center gap-1.5 text-[13px] text-neutral-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-neutral-400 flex-shrink-0"
            aria-hidden="true"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 12 3 12 0v-5" />
          </svg>
          <span className="truncate">{schoolLabel}</span>
        </div>

        {/* Mix indicator — 3 dots, currently always 'unknown' grey */}
        <div
          className="flex items-center gap-1.5"
          title={STICHTING_USAGE_MIX_LABELS[usageMix]}
        >
          <span className="text-[12px] text-neutral-400">Mix:</span>
          <span
            className={`inline-block w-2 h-2 rounded-full ${STICHTING_USAGE_MIX_COLORS[usageMix]}`}
            aria-hidden="true"
          />
          <span
            className={`inline-block w-2 h-2 rounded-full ${STICHTING_USAGE_MIX_COLORS[usageMix]}`}
            aria-hidden="true"
          />
          <span
            className={`inline-block w-2 h-2 rounded-full ${STICHTING_USAGE_MIX_COLORS[usageMix]}`}
            aria-hidden="true"
          />
          <span className="text-[12px] text-neutral-500">
            {STICHTING_USAGE_MIX_LABELS[usageMix]}
          </span>
        </div>
      </div>
    </Link>
  );
}
