import type { ModuleCurrentSetup, CurrentProvider } from '../models/school';
import { CURRENT_PROVIDER_LABELS } from '../models/school';
import type { PriceRecord } from '../models/pricing';
import { MODULE_CATALOG } from '../models/modules';
import { getTotalStudents } from './price-comparison';

export interface ModuleCurrentVsProposed {
  moduleId: string;
  moduleName: string;
  currentProvider: CurrentProvider;
  currentProviderLabel: string;
  customProviderName?: string;
  /** Cost per student at current provider. null when provider is 'geen' or 'cito-nieuw'/'cito-oud' (no manual price entered). */
  currentCostPerStudent: number | null;
  currentTotalCost: number | null;
  /** Cost per student at Cito (new platform). null when Cito doesn't offer this module. */
  proposedCitoCostPerStudent: number | null;
  proposedCitoTotalCost: number | null;
  /** currentTotalCost - proposedCitoTotalCost. Positive = Cito is cheaper. null when either side is unknown. */
  annualDifference: number | null;
  /** True when current provider is 'geen' — module would be a net new cost with Cito. */
  isNewModule: boolean;
}

export interface CurrentVsProposedResult {
  modules: ModuleCurrentVsProposed[];
  /** Sum of currentTotalCost for modules that have a current provider (excluding 'geen'). */
  totalCurrentCost: number;
  /** Sum of proposedCitoTotalCost for modules Cito offers. */
  totalProposedCost: number;
  /** totalCurrentCost - totalProposedCost. Positive = Cito is cheaper overall. */
  totalAnnualSavings: number;
  /** True when at least one module has a custom price differing from the publication price. */
  hasSpecialPrices: boolean;
}

/**
 * Pure function: calculate a school's current costs vs. proposed Cito costs.
 * Does not modify any external state.
 */
export function calculateCurrentVsProposed(
  moduleSetups: ModuleCurrentSetup[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  prices: PriceRecord[],
): CurrentVsProposedResult {
  const totalStudents = getTotalStudents(studentCounts);

  const modules: ModuleCurrentVsProposed[] = moduleSetups.map((setup) => {
    const moduleDef = MODULE_CATALOG.find((m) => m.id === setup.moduleId);
    const moduleName = moduleDef?.name ?? setup.moduleId;

    // Current provider cost
    let currentCostPerStudent: number | null = null;
    let isNewModule = false;

    if (setup.currentProvider === 'geen') {
      isNewModule = true;
    } else if (setup.currentProvider === 'cito-oud' || setup.currentProvider === 'cito-nieuw') {
      // Existing Cito customer — we don't have a manual price for them in this flow.
      // Use null to signal "unknown / use migration engine instead".
      currentCostPerStudent = null;
    } else {
      // dia, jij, overig — use the entered price if available, else look up publication price
      if (setup.pricePerStudent !== null) {
        currentCostPerStudent = setup.pricePerStudent;
      } else {
        // Fall back to publication price for the provider
        const providerKey = setup.currentProvider === 'dia' ? 'dia'
          : setup.currentProvider === 'jij' ? 'jij'
          : null;
        if (providerKey) {
          const record = prices.find(
            (p) => p.moduleId === setup.moduleId && p.provider === providerKey,
          );
          currentCostPerStudent = record?.amountPerStudent ?? null;
        }
        // For 'overig' without a price, leave null
      }
    }

    const currentTotalCost =
      currentCostPerStudent !== null ? currentCostPerStudent * totalStudents : null;

    // Proposed Cito cost (always the Cito publication price from price records)
    const citoRecord = prices.find(
      (p) => p.moduleId === setup.moduleId && p.provider === 'cito',
    );
    const proposedCitoCostPerStudent = citoRecord?.amountPerStudent ?? null;
    const proposedCitoTotalCost =
      proposedCitoCostPerStudent !== null ? proposedCitoCostPerStudent * totalStudents : null;

    const annualDifference =
      currentTotalCost !== null && proposedCitoTotalCost !== null
        ? currentTotalCost - proposedCitoTotalCost
        : null;

    return {
      moduleId: setup.moduleId,
      moduleName,
      currentProvider: setup.currentProvider,
      currentProviderLabel:
        setup.currentProvider === 'overig' && setup.customProviderName
          ? setup.customProviderName
          : CURRENT_PROVIDER_LABELS[setup.currentProvider],
      customProviderName: setup.customProviderName,
      currentCostPerStudent,
      currentTotalCost,
      proposedCitoCostPerStudent,
      proposedCitoTotalCost,
      annualDifference,
      isNewModule,
    };
  });

  const totalCurrentCost = modules.reduce(
    (sum, m) => sum + (m.currentTotalCost ?? 0),
    0,
  );
  const totalProposedCost = modules.reduce(
    (sum, m) => sum + (m.proposedCitoTotalCost ?? 0),
    0,
  );
  const totalAnnualSavings = totalCurrentCost - totalProposedCost;

  const hasSpecialPrices = moduleSetups.some(
    (s) => s.pricePerStudent !== null,
  );

  return { modules, totalCurrentCost, totalProposedCost, totalAnnualSavings, hasSpecialPrices };
}
