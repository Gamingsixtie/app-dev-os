import type { Contact } from '@/db/types';
import { STAGNATION_THRESHOLD_DAYS } from '@/models/school';

interface DmuProgressIndicatorProps {
  contacts: Contact[];
}

/** Calculate days since a given ISO date string */
function daysSince(isoDate: string | null): number {
  if (!isoDate) return 0;
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/**
 * Compact DMU progress indicator for SchoolCard and KanbanCard.
 * Shows "DMU X/Y" where X = positief + akkoord contacts.
 * Shows orange dot when any contact is stagnating (>30 days in same phase).
 * Returns null when no contacts exist.
 */
export default function DmuProgressIndicator({ contacts }: DmuProgressIndicatorProps) {
  if (!contacts || contacts.length === 0) return null;

  const total = contacts.length;
  const positive = contacts.filter(
    (c) => c.engagementStatus === 'positief' || c.engagementStatus === 'akkoord',
  ).length;

  const hasStagnation = contacts.some(
    (c) => daysSince(c.engagementStatusChangedAt) >= STAGNATION_THRESHOLD_DAYS,
  );

  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-neutral-500">
      DMU {positive}/{total}
      {hasStagnation && (
        <span
          className="w-2 h-2 rounded-full bg-orange-400 inline-block"
          title="Stagnatie gedetecteerd"
          aria-label="Stagnatie gedetecteerd"
        />
      )}
    </span>
  );
}
