import { useOpenProposalCount } from '@/hooks/usePriceProposals';

/**
 * Red circle badge showing the number of open price proposals.
 * Per UI-SPEC: 20px diameter, bg-red-500, white text.
 * Only renders when count > 0.
 * Positioned inline next to "Review" nav item text.
 */
export default function ReviewBadgeCounter() {
  const { data: count } = useOpenProposalCount();

  if (!count || count === 0) return null;

  const label = `${count} openstaande voorstellen`;

  return (
    <span
      className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
      title={label}
      aria-label={label}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
