import { usePriceComparisonStore } from './store';
import { CONTRACT_PERIODS, getContractPeriodConfig } from '../../data/cito-bundles';
import type { ContractPeriod } from '../../data/cito-bundles';

export function PeriodToggle() {
  const period = usePriceComparisonStore((s) => s.contractPeriod);
  const setPeriod = usePriceComparisonStore((s) => s.setContractPeriod);
  const config = getContractPeriodConfig(period);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Contractperiode
      </label>
      <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
        {CONTRACT_PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id as ContractPeriod)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              period === p.id
                ? 'bg-cito-primary text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-50'
            }`}
            aria-pressed={period === p.id}
          >
            {p.shortLabel}
          </button>
        ))}
      </div>
      {config.note && (
        <div className="bg-amber-50 text-amber-800 text-xs rounded-md px-3 py-2 max-w-md">
          {config.note}
        </div>
      )}
    </div>
  );
}
