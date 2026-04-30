import { PIPELINE_STATUSES, PIPELINE_STATUS_LABELS } from '@/models/school';
import type { PipelineStatus } from '@/models/school';

type FilterValue = PipelineStatus | 'all';

interface FilterBarProps {
  activeFilter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  counts: Record<FilterValue, number>;
}

export default function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: FilterBarProps) {
  const filters: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'Alle' },
    ...PIPELINE_STATUSES.map((status) => ({
      value: status as FilterValue,
      label: PIPELINE_STATUS_LABELS[status],
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
                ? 'bg-cito-primary text-white shadow-sm'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {filter.label}
            <span
              className={`ml-1 ${isActive ? 'text-white/70' : 'text-neutral-400'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
