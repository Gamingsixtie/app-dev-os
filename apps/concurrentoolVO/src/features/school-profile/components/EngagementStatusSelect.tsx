import { ENGAGEMENT_STATUSES, ENGAGEMENT_STATUS_LABELS } from '@/models/school';
import type { EngagementStatus } from '@/models/school';

interface EngagementStatusSelectProps {
  value: EngagementStatus;
  onChange: (status: EngagementStatus) => void;
  disabled?: boolean;
}

export default function EngagementStatusSelect({
  value,
  onChange,
  disabled = false,
}: EngagementStatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EngagementStatus)}
      disabled={disabled}
      className="h-9 px-2 border border-neutral-200 rounded text-[14px] text-neutral-700 bg-white focus:outline-2 focus:outline-cito-primary focus:outline-offset-2 min-h-[44px]"
      aria-label="Status wijzigen"
    >
      {ENGAGEMENT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {ENGAGEMENT_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
