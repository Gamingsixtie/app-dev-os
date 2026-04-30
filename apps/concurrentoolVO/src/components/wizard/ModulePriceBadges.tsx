import { DEFAULT_PRICES } from '@/data/default-prices';
import { CITO_BUNDLES } from '@/data/cito-bundles';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';
import { PROVIDER_LABELS, type ProviderKey } from '@/engine/price-comparison';
import { formatCurrency } from '@/lib/format';
import { useState } from 'react';

interface ModulePriceBadgesProps {
  moduleId: string;
}

const PROVIDER_COLORS: Record<ProviderKey, string> = {
  cito: 'bg-blue-50 text-blue-700 border-blue-200',
  dia: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  jij: 'bg-orange-50 text-orange-700 border-orange-200',
  saqi: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function ModulePriceBadges({ moduleId }: ModulePriceBadgesProps) {
  const [expanded, setExpanded] = useState(false);

  const prices = DEFAULT_PRICES.filter((p) => p.moduleId === moduleId);
  if (prices.length === 0) return null;

  // Check if module is in a Cito bundle
  const bundle = CITO_BUNDLES.find(
    (b) => b.id !== 'individual' && b.includedModuleIds.includes(moduleId),
  );

  // Differentiator counts
  const diffEntry = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === moduleId);

  return (
    <div className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Price badges */}
      <div className="flex flex-wrap gap-1.5">
        {prices.map((p) => (
          <span
            key={p.provider}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[p.provider as ProviderKey] ?? 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}
          >
            {PROVIDER_LABELS[p.provider as ProviderKey] ?? p.provider}:{' '}
            {p.amountPerStudent === 0 ? '€0*' : formatCurrency(p.amountPerStudent)}
          </span>
        ))}
      </div>

      {/* Bundle indicator */}
      {bundle && (
        <div className="text-xs text-neutral-500">
          Onderdeel {bundle.name} ({formatCurrency(bundle.pricePerStudent ?? 0)}/lln voor {bundle.includedModuleIds.length} modules)
        </div>
      )}

      {/* Expandable details */}
      {diffEntry && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-xs text-cito-primary hover:underline"
          >
            {expanded ? 'Minder details' : 'Meer details'}
          </button>

          {expanded && (
            <div className="text-xs text-neutral-600 space-y-1 pl-1 border-l-2 border-neutral-100 ml-1">
              {(['cito', 'dia', 'jij', 'saqi'] as const).map((provider) => {
                const diffs = diffEntry[provider];
                if (diffs.length === 0) return null;
                return (
                  <div key={provider}>
                    <span className="font-semibold">{PROVIDER_LABELS[provider]}:</span>{' '}
                    {diffs.length} voordeel{diffs.length !== 1 ? 'en' : ''}
                    <span className="text-neutral-400"> — {diffs.join(', ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
