import type { ComparisonResult } from './price-comparison';
import type { ModuleCurrentSetup, CurrentProvider } from '../models/school';

export interface HybridModuleResult {
  moduleId: string;
  moduleName: string;
  currentProvider: string;
  currentCost: number;
  citoCost: number;
  savings: number;
  savingsPercent: number;
}

export interface HybridScenarioResult {
  modules: HybridModuleResult[];
  totalCurrentCost: number;
  totalCitoCost: number;
  totalSavings: number;
  totalSavingsPercent: number;
}

/** Providers that represent a non-Cito competitor (eligible for hybrid comparison) */
const COMPETITOR_PROVIDERS: CurrentProvider[] = ['dia', 'jij', 'overig'];

/**
 * Calculate the hybrid scenario: per-module savings when switching from
 * the current provider to Cito.
 *
 * Only processes modules where the current provider is a non-Cito competitor.
 * Modules with 'geen', 'cito-oud', or 'cito-nieuw' are excluded.
 *
 * Pure function: no side effects, no state.
 */
export function calculateHybridScenario(
  comparisonResult: ComparisonResult,
  moduleSetups: ModuleCurrentSetup[],
): HybridScenarioResult {
  const modules: HybridModuleResult[] = [];

  for (const setup of moduleSetups) {
    // Only process competitor providers
    if (!COMPETITOR_PROVIDERS.includes(setup.currentProvider)) {
      continue;
    }

    // Find this module in the comparison result
    const moduleComp = comparisonResult.modules.find(
      (m) => m.moduleId === setup.moduleId,
    );
    if (!moduleComp) continue;

    // Get Cito cost from comparison
    const citoProviderCost = moduleComp.providers.cito;
    if (!citoProviderCost) continue;

    // Get current provider cost from comparison
    const providerKey = setup.currentProvider as 'dia' | 'jij';
    const currentProviderCost = moduleComp.providers[providerKey];

    // Use comparison data for the current cost, fall back to moduleSetup price
    let currentCost: number;
    if (currentProviderCost) {
      currentCost = currentProviderCost.totalCost;
    } else if (setup.pricePerStudent !== null) {
      currentCost = setup.pricePerStudent * citoProviderCost.studentCount;
    } else {
      continue; // Cannot determine current cost
    }

    const citoCost = citoProviderCost.totalCost;
    const savings = currentCost - citoCost;
    const savingsPercent = currentCost > 0
      ? (savings / currentCost) * 100
      : 0;

    modules.push({
      moduleId: setup.moduleId,
      moduleName: moduleComp.moduleName,
      currentProvider: setup.currentProvider,
      currentCost,
      citoCost,
      savings,
      savingsPercent: Math.round(savingsPercent * 10) / 10,
    });
  }

  const totalCurrentCost = modules.reduce((sum, m) => sum + m.currentCost, 0);
  const totalCitoCost = modules.reduce((sum, m) => sum + m.citoCost, 0);
  const totalSavings = totalCurrentCost - totalCitoCost;
  const totalSavingsPercent = totalCurrentCost > 0
    ? Math.round(((totalSavings / totalCurrentCost) * 100) * 10) / 10
    : 0;

  return {
    modules,
    totalCurrentCost,
    totalCitoCost,
    totalSavings,
    totalSavingsPercent,
  };
}
