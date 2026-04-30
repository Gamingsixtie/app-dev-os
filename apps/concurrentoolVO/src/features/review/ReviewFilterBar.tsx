import { useCallback } from 'react';

export interface ReviewFilters {
  status?: string;
  provider?: string;
}

interface ReviewFilterBarProps {
  filters: ReviewFilters;
  onFilterChange: (filters: ReviewFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'approved', label: 'Goedgekeurd' },
  { value: 'rejected', label: 'Afgewezen' },
] as const;

const PROVIDER_OPTIONS = [
  { value: 'cito', label: 'Cito' },
  { value: 'dia', label: 'DIA' },
  { value: 'jij', label: 'JIJ' },
  { value: 'saqi', label: 'SAQI' },
] as const;

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#003082] text-white'
          : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  );
}

export default function ReviewFilterBar({ filters, onFilterChange }: ReviewFilterBarProps) {
  const toggleStatus = useCallback(
    (value: string) => {
      onFilterChange({
        ...filters,
        status: filters.status === value ? undefined : value,
      });
    },
    [filters, onFilterChange],
  );

  const toggleProvider = useCallback(
    (value: string) => {
      onFilterChange({
        ...filters,
        provider: filters.provider === value ? undefined : value,
      });
    },
    [filters, onFilterChange],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">
        Status
      </span>
      {STATUS_OPTIONS.map((opt) => (
        <FilterPill
          key={opt.value}
          label={opt.label}
          active={filters.status === opt.value}
          onClick={() => toggleStatus(opt.value)}
        />
      ))}

      <span className="mx-2 h-4 w-px bg-neutral-200" aria-hidden="true" />

      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-1">
        Aanbieder
      </span>
      {PROVIDER_OPTIONS.map((opt) => (
        <FilterPill
          key={opt.value}
          label={opt.label}
          active={filters.provider === opt.value}
          onClick={() => toggleProvider(opt.value)}
        />
      ))}
    </div>
  );
}
