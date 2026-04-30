/**
 * Status badge for price proposals.
 * Follows the same pattern as PriceBadge but for proposal statuses.
 *
 * Per UI-SPEC state indicators:
 * - open: blue (status-manual-bg), label "Open"
 * - approved: green (status-verified-bg), label "Goedgekeurd"
 * - rejected: orange (status-stale-bg), label "Afgewezen"
 */

type ProposalStatus = 'open' | 'approved' | 'rejected';

const statusConfig: Record<ProposalStatus, { label: string; classes: string }> = {
  open: {
    label: 'Open',
    classes: 'bg-status-manual-bg text-status-manual-text border-status-manual',
  },
  approved: {
    label: 'Goedgekeurd',
    classes: 'bg-status-verified-bg text-status-verified-text border-status-verified',
  },
  rejected: {
    label: 'Afgewezen',
    classes: 'bg-status-stale-bg text-status-stale-text border-status-stale',
  },
};

interface ProposalBadgeProps {
  status: ProposalStatus;
}

export function ProposalBadge({ status }: ProposalBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold border ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
