import type { PriceRecord } from '../models/pricing';
import type { CitoBundle, ContractPeriod } from '../data/cito-bundles';
import type { ComparisonResult } from './price-comparison';
import { getContractPeriodConfig } from '../data/cito-bundles';

/**
 * Apply Cito bundle pricing to the price array.
 * When a bundle is selected, Cito prices for included modules are replaced
 * with the bundle's per-student rate (spread evenly across modules).
 *
 * Pure function: no side effects.
 *
 * @param basePrices - Base price records (may already have JIJ/DIA adjustments)
 * @param bundle - The selected Cito bundle definition
 * @param selectedModules - Currently selected module IDs
 * @returns Updated price records with bundle pricing applied
 */
export function applyCitoBundlePrices(
  basePrices: PriceRecord[],
  bundle: CitoBundle,
  selectedModules: string[],
): PriceRecord[] {
  // No bundle or individual pricing — return unchanged
  if (bundle.pricePerStudent === null || bundle.includedModuleIds.length === 0) {
    return basePrices;
  }

  // Only apply bundle if school has selected ALL bundle modules
  const selectedBundleModules = bundle.includedModuleIds.filter((id) =>
    selectedModules.includes(id),
  );
  if (selectedBundleModules.length < bundle.includedModuleIds.length) {
    return basePrices;
  }

  // Spread bundle price evenly across included modules
  const pricePerModule =
    Math.round((bundle.pricePerStudent / bundle.includedModuleIds.length) * 100) / 100;

  return basePrices.map((price) => {
    if (price.provider !== 'cito') return price;
    if (!bundle.includedModuleIds.includes(price.moduleId)) return price;

    return {
      ...price,
      amountPerStudent: pricePerModule,
      source: 'publication' as const,
      sourceLabel: `Cito ${bundle.name} bundel — €${bundle.pricePerStudent}/lln voor ${bundle.includedModuleIds.length} modules`,
      isPublicationPrice: true,
    };
  });
}

/**
 * Apply contract period multiplier to a full ComparisonResult.
 * Adjusts both per-module totalCost and overall totals + differences.
 * Cito gets a discounted factor; DIA, JIJ and SAQI pay full price × years.
 *
 * When customCitoFactor is provided (from bundle-specific contract pricing),
 * it overrides the generic citoFactor from the period config.
 *
 * Pure function: returns a new result, does not mutate the input.
 */
export function applyContractPeriodToResult(
  result: ComparisonResult,
  period: ContractPeriod,
  customCitoFactor?: number,
): ComparisonResult {
  const config = getContractPeriodConfig(period);
  if (config.years === 1) return result;

  const citoFactor = customCitoFactor ?? config.citoFactor;

  // Adjust per-module totals AND per-student prices
  const modules = result.modules.map((mod) => {
    const providers = { ...mod.providers };
    for (const [provider, cost] of Object.entries(providers) as Array<[string, typeof mod.providers[keyof typeof mod.providers]]>) {
      if (cost === null) continue;
      const factor = provider === 'cito' ? citoFactor : config.otherFactor;
      (providers as Record<string, typeof cost>)[provider] = {
        ...cost,
        pricePerStudent: Math.round(cost.pricePerStudent * factor * 100) / 100,
        totalCost: Math.round(cost.totalCost * factor * 100) / 100,
      };
    }
    return { ...mod, providers };
  });

  // Adjust totals
  const totals = { ...result.totals };
  for (const provider of Object.keys(totals) as Array<keyof typeof totals>) {
    const factor = provider === 'cito' ? citoFactor : config.otherFactor;
    totals[provider] = Math.round(totals[provider] * factor * 100) / 100;
  }

  // Recalculate differences — preserve null from original result (means provider has no matching modules)
  const differences = {
    citoVsDia: result.differences.citoVsDia !== null ? totals.cito - totals.dia : null,
    citoVsJij: result.differences.citoVsJij !== null ? totals.cito - totals.jij : null,
    citoVsSaqi: result.differences.citoVsSaqi !== null ? totals.cito - totals.saqi : null,
  };

  return { modules, totals, differences, diaPackageResult: result.diaPackageResult ?? null };
}
