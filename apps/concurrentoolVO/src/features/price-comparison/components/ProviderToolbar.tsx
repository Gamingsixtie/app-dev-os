import { usePriceComparisonStore } from '../store';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';
import { MODULE_CATALOG } from '@/models/modules';
import { PricingInfoPopover } from './PricingInfoPopover';

/** Provider brand colors — bg variants for dots and cards. */
// eslint-disable-next-line react-refresh/only-export-components -- shared color constant used across 3 components; co-located with toolbar by convention
export const PROVIDER_COLORS: Record<ProviderKey, string> = {
  cito: 'bg-[#003082]',
  dia: 'bg-[#FF6600]',
  jij: 'bg-[#22C55E]',
  saqi: 'bg-[#8B5CF6]',
};

const allProviders: ProviderKey[] = ['cito', 'dia', 'jij', 'saqi'];

/** Merged provider selector + pricing model info (D-08). */
export function ProviderToolbar() {
  const visibleProviders = usePriceComparisonStore((s) => s.visibleProviders);
  const toggleProvider = usePriceComparisonStore((s) => s.toggleProvider);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-neutral-600">Vergelijk:</span>
      {allProviders.map((p) => {
        const moduleCount = MODULE_CATALOG.filter((m) =>
          m.availableFrom.includes(p),
        ).length;
        return (
          <label
            key={p}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              checked={visibleProviders.includes(p)}
              onChange={() => toggleProvider(p)}
              disabled={p === 'cito'}
              className="accent-[#003082]"
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[p]}`}
            />
            <span>{PROVIDER_LABELS[p]}</span>
            <span className="text-neutral-400 text-xs">({moduleCount})</span>
            <PricingInfoPopover provider={p} />
          </label>
        );
      })}
    </div>
  );
}
