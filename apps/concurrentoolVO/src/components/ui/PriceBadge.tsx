import { getPriceStatus, getPriceStalenessLabel, getSchoolPriceStatus, getSchoolPriceStalenessLabel } from '../../models/pricing';
import type { PriceRecord, PriceStatus, SchoolPriceStatus } from '../../models/pricing';
import type { SchoolPriceEntry } from '../../db/types';

const statusClasses: Record<PriceStatus, string> = {
  verified: 'bg-status-verified-bg text-status-verified-text border-status-verified',
  manual: 'bg-status-manual-bg text-status-manual-text border-status-manual',
  stale: 'bg-status-stale-bg text-status-stale-text border-status-stale',
};

const schoolPriceStatusClasses: Record<SchoolPriceStatus, string> = {
  verified: 'bg-status-verified-bg text-status-verified-text border-status-verified',
  manual: 'bg-status-manual-bg text-status-manual-text border-status-manual',
  stale: 'bg-status-stale-bg text-status-stale-text border-status-stale',
  unknown: 'bg-neutral-100 text-neutral-500 border-neutral-300',
};

interface PriceBadgeProps {
  record: PriceRecord;
  now?: Date;
}

export function PriceBadge({ record, now }: PriceBadgeProps) {
  const status = getPriceStatus(record, now);
  const label = getPriceStalenessLabel(record, now);
  const classes = statusClasses[status];

  const tooltip =
    status === 'stale'
      ? `Laatst geverifieerd: ${record.verifiedAt.toLocaleDateString('nl-NL')}. Controleer of deze prijs nog actueel is.`
      : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold border ${classes}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}

// ─── SchoolPriceBadge (for SchoolPriceEntry from school_prices table) ────────

interface SchoolPriceBadgeProps {
  entry: SchoolPriceEntry;
  now?: Date;
}

/**
 * Badge for school-specific price entries. Supports all four statuses
 * including 'unknown' for prices without a known source.
 */
export function SchoolPriceBadge({ entry, now }: SchoolPriceBadgeProps) {
  const status = getSchoolPriceStatus(entry, now);
  const label = getSchoolPriceStalenessLabel(status);
  const classes = schoolPriceStatusClasses[status];

  const tooltip =
    status === 'stale' && entry.verifiedAt
      ? `Laatst geverifieerd: ${new Date(entry.verifiedAt).toLocaleDateString('nl-NL')}. Controleer of deze prijs nog actueel is.`
      : status === 'unknown'
        ? 'Geen bron of verificatiedatum bekend.'
        : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold border ${classes}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
