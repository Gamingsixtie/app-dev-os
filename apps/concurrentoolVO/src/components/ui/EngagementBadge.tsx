import type { EngagementStatus } from '@/models/school';
import { ENGAGEMENT_STATUS_LABELS } from '@/models/school';

const ENGAGEMENT_BADGE_STYLES: Record<EngagementStatus, string> = {
  'nog-niet-benaderd': 'bg-neutral-100 text-neutral-600 border-neutral-300',
  'in-gesprek': 'bg-blue-50 text-blue-700 border-blue-200',
  'positief': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'wacht-op-intern': 'bg-amber-50 text-amber-700 border-amber-200',
  'akkoord': 'bg-green-50 text-green-700 border-green-200',
  'afgehaakt': 'bg-red-50 text-red-700 border-red-200',
};

interface EngagementBadgeProps {
  status: EngagementStatus;
  size?: 'sm' | 'md';
}

export default function EngagementBadge({ status, size = 'md' }: EngagementBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0 text-[12px]' : 'px-2 py-0.5 text-[14px]';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-normal ${sizeClasses} ${ENGAGEMENT_BADGE_STYLES[status]}`}
    >
      {ENGAGEMENT_STATUS_LABELS[status]}
    </span>
  );
}
