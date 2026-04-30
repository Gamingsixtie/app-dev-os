import {
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_STATUS_LABELS,
} from '@/models/school';
import type { EngagementStatus } from '@/models/school';

type DmuFilterValue = EngagementStatus | 'all';

interface DmuStatusFilterProps {
  activeFilter: DmuFilterValue;
  onFilterChange: (filter: DmuFilterValue) => void;
  counts: Record<DmuFilterValue, number>;
}

export default function DmuStatusFilter({
  activeFilter,
  onFilterChange,
  counts,
}: DmuStatusFilterProps) {
  const filters: { value: DmuFilterValue; label: string }[] = [
    { value: 'all', label: 'Alle' },
    ...ENGAGEMENT_STATUSES.map((status) => ({
      value: status as DmuFilterValue,
      label: ENGAGEMENT_STATUS_LABELS[status],
    })),
  ];

  return (
    <div className="flex gap-1.5 overflow-x-auto flex-nowrap pb-0.5">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;
        const count = counts[filter.value] ?? 0;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className={`h-8 px-3 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 transition-all ${
              isActive
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            {filter.label}
            <span
              className={`ml-1 ${isActive ? 'text-white/70' : 'text-purple-400'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { DmuFilterValue };
