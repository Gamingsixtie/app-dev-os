import type { ModuleCurrentSetup, CurrentProvider } from '@/models/school';
import type { ComparisonResult, ProviderKey } from './price-comparison';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';

export type UpsellSignalStrength = 'green' | 'yellow';

export interface UpsellOpportunity {
  moduleId: string;
  moduleName: string;
  currentProvider: CurrentProvider;
  citoCostPerStudent: number | null;
  competitorCostPerStudent: number | null;
  savingsPerStudent: number | null;
  hasDifferentiators: boolean;
  signalStrength: UpsellSignalStrength;
}

/** Providers that are already Cito or have no competitor data */
const EXCLUDED_PROVIDERS: CurrentProvider[] = ['geen', 'cito-oud', 'cito-nieuw', 'overig'];

/**
 * Map a CurrentProvider to a ProviderKey for comparison lookup.
 * Returns null for providers that cannot be compared.
 */
function mapProviderToKey(provider: CurrentProvider): ProviderKey | null {
  if (provider === 'dia') return 'dia';
  if (provider === 'jij') return 'jij';
  return null;
}

/**
 * Get Cito differentiators for a module.
 * Returns empty array if module not found in MODULE_DIFFERENTIATORS.
 */
function getCitoDifferentiators(moduleId: string): string[] {
  const entry = MODULE_DIFFERENTIATORS.find((m) => m.moduleId === moduleId);
  return entry?.cito ?? [];
}

/**
 * Pure function: detect upsell opportunities for modules where the school
 * currently uses a competitor and Cito offers a better value proposition.
 *
 * Filters out:
 * - Modules with no competitor (geen)
 * - Modules already on Cito (cito-oud, cito-nieuw)
 * - Modules with 'overig' provider (no comparison data)
 * - Red signals: Cito more expensive AND no differentiators
 *
 * @param moduleSetups  Current provider setup per module from school profile
 * @param comparisonResult  Price comparison result with Cito vs competitor costs
 */
export function calculateUpsell(
  moduleSetups: ModuleCurrentSetup[],
  comparisonResult: ComparisonResult,
): UpsellOpportunity[] {
  const opportunities: UpsellOpportunity[] = [];

  for (const setup of moduleSetups) {
    // Skip excluded providers
    if (EXCLUDED_PROVIDERS.includes(setup.currentProvider)) continue;

    // Map provider to comparison key
    const providerKey = mapProviderToKey(setup.currentProvider);
    if (!providerKey) continue;

    // Find matching module in comparison result
    const moduleComp = comparisonResult.modules.find((m) => m.moduleId === setup.moduleId);
    if (!moduleComp) continue;

    const citoCost = moduleComp.providers.cito;
    const competitorCost = moduleComp.providers[providerKey];

    // Need both costs for comparison
    if (!citoCost || !competitorCost) continue;

    const isCheaper = citoCost.pricePerStudent <= competitorCost.pricePerStudent;
    const citoDiffs = getCitoDifferentiators(setup.moduleId);
    const hasDifferentiators = citoDiffs.length > 0;

    // Red signal: more expensive + no differentiators -> exclude
    if (!isCheaper && !hasDifferentiators) continue;

    const signalStrength: UpsellSignalStrength = isCheaper && hasDifferentiators ? 'green' : 'yellow';
    const savingsPerStudent = competitorCost.pricePerStudent - citoCost.pricePerStudent;

    opportunities.push({
      moduleId: setup.moduleId,
      moduleName: moduleComp.moduleName,
      currentProvider: setup.currentProvider,
      citoCostPerStudent: citoCost.pricePerStudent,
      competitorCostPerStudent: competitorCost.pricePerStudent,
      savingsPerStudent,
      hasDifferentiators,
      signalStrength,
    });
  }

  return opportunities;
}
