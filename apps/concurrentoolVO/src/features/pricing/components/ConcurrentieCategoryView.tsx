import { PROVIDER_CONFIGS } from '@/data/providers/index';
import {
  CONCURRENTIE_CATEGORY_LABELS,
  moduleInCategory,
  type ConcurrentieCategory,
} from '../constants/cito-module-grouping';
import type { ProviderKey } from '@/engine/price-comparison';

interface ConcurrentieCategoryViewProps {
  category: ConcurrentieCategory;
}

/** Providers shown in cross-provider category views — Cito is excluded omdat
 * Cito de baseline-aanbieder is en in z'n eigen Basisvaardigheden-tab hoort. */
const COMPETING_PROVIDERS: ReadonlyArray<ProviderKey> = ['dia', 'jij', 'saqi'];

interface CategoryRow {
  provider: ProviderKey;
  providerLabel: string;
  moduleId: string;
  pricePerStudent: number | null;
}

/**
 * Cross-provider read-only view of all modules in a single Concurrentie category.
 *
 * Renders rows of (provider, module, prijs) so the user kan in één oogopslag
 * zien welke aanbieders iets bieden in deze categorie en tegen welke prijs.
 *
 * Bewerken van prijzen blijft in de provider-specifieke sub-tabs (DIA / JIJ) —
 * deze view is voor vergelijking, niet voor editen.
 */
export function ConcurrentieCategoryView({ category }: ConcurrentieCategoryViewProps) {
  const rows: CategoryRow[] = [];

  for (const provider of COMPETING_PROVIDERS) {
    const cfg = PROVIDER_CONFIGS[provider];
    if (!cfg) continue;

    const strat = cfg.pricingStrategy;
    // Extract module-id → price mapping from each strategy shape.
    const moduleEntries: Array<{ moduleId: string; price: number | null }> = [];

    if (strat.type === 'platform+module') {
      for (const [moduleId, price] of Object.entries(strat.individualPrices)) {
        moduleEntries.push({ moduleId, price });
      }
    } else if (strat.type === 'package-bundle') {
      // Each package bundles multiple modules at one price — expand for category match.
      const seen = new Set<string>();
      for (const pkg of strat.packages) {
        for (const moduleId of pkg.includedModuleIds) {
          if (seen.has(moduleId)) continue;
          seen.add(moduleId);
          moduleEntries.push({ moduleId, price: pkg.pricePerStudent });
        }
      }
    } else if (strat.type === 'tiered-license') {
      // Tiered licenses are not per-module — represent as one row per tier.
      for (const tier of strat.tiers) {
        moduleEntries.push({
          moduleId: `${cfg.label} ${tier.label}`,
          price: tier.annualFee,
        });
      }
    } else if (strat.type === 'flat') {
      moduleEntries.push({ moduleId: cfg.label, price: strat.pricePerStudent });
    }

    for (const { moduleId, price } of moduleEntries) {
      if (moduleInCategory(moduleId, category)) {
        rows.push({
          provider,
          providerLabel: cfg.label,
          moduleId,
          pricePerStudent: price,
        });
      }
    }
  }

  const label = CONCURRENTIE_CATEGORY_LABELS[category];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-cito-primary">{label}</h3>
      <p className="text-sm text-neutral-600">
        Aanbod van concurrenten in de categorie &lsquo;{label}&rsquo;. Bewerken kan in de
        provider-specifieke sub-tabs (DIA / JIJ).
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">
          Geen concurrent-modules in deze categorie. Verschijnen hier automatisch zodra een aanbieder iets toevoegt.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-neutral-200">
              <th className="py-2 pr-4 font-medium text-neutral-700">Aanbieder</th>
              <th className="py-2 pr-4 font-medium text-neutral-700">Module</th>
              <th className="py-2 pr-4 font-medium text-neutral-700">Prijs/lln</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.provider}-${row.moduleId}-${i}`} className="border-b border-neutral-100">
                <td className="py-2 pr-4 text-neutral-700">{row.providerLabel}</td>
                <td className="py-2 pr-4 text-neutral-700 capitalize">{row.moduleId}</td>
                <td className="py-2 pr-4 text-neutral-700">
                  {row.pricePerStudent != null ? `€${row.pricePerStudent.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
