interface UpsellBadgeProps {
  count: number;
  hasGreenSignals: boolean;
}

export function UpsellBadge({ count, hasGreenSignals }: UpsellBadgeProps) {
  if (count === 0) return null;

  const colorClasses = hasGreenSignals
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-yellow-100 text-yellow-800 border-yellow-300';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${colorClasses}`}
      title={`${count} upsell-kansen voor deze school`}
    >
      {count} kansen
    </span>
  );
}
