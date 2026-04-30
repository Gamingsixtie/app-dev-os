import type { DiaPackage, DiaPackageResult } from '../models/dia-packages';

/**
 * DIA volume discount tiers (staffelkorting).
 * Source: DIA Webshop (shop.dia.nl), verified March 2026.
 */
export const DIA_VOLUME_TIERS = [
  { minStudents: 1000, discountPercent: 10 },
  { minStudents: 500, discountPercent: 5 },
] as const;

/**
 * Get the DIA volume discount percentage for a given student count.
 * Returns 0, 5, or 10.
 */
export function getDiaVolumeDiscountPercent(totalStudents: number): number {
  for (const tier of DIA_VOLUME_TIERS) {
    if (totalStudents >= tier.minStudents) return tier.discountPercent;
  }
  return 0;
}

/**
 * Select the optimal DIA package for a given set of selected DIA modules.
 * Returns the cheapest combination of package + individual pricing.
 *
 * Pure function: no side effects, no state.
 *
 * @param selectedDiaModuleIds - Module IDs the school has selected for DIA
 * @param packages - Available DIA packages
 * @param perModulePrices - Per-module price per student (may include overrides)
 * @returns DiaPackageResult with selected package (if any), costs, and savings
 */
export function selectOptimalDiaPackage(
  selectedDiaModuleIds: string[],
  packages: DiaPackage[],
  perModulePrices: Map<string, number>,
  forcedPackageId?: string | null,
): DiaPackageResult {
  if (selectedDiaModuleIds.length === 0) {
    return {
      selectedPackage: null,
      totalCost: 0,
      individualTotal: 0,
      savings: 0,
      coveredModuleIds: [],
    };
  }

  // Calculate individual total (no package)
  const individualTotal = selectedDiaModuleIds.reduce((sum, moduleId) => {
    return sum + (perModulePrices.get(moduleId) ?? 0);
  }, 0);

  // If forcedPackageId is explicitly null, use individual pricing only (no packages)
  if (forcedPackageId === null) {
    return {
      selectedPackage: null,
      totalCost: individualTotal,
      individualTotal,
      savings: 0,
      coveredModuleIds: [],
    };
  }

  // If a specific package is forced, use it directly (skip optimization)
  if (forcedPackageId !== undefined) {
    const forcedPkg = packages.find((p) => p.id === forcedPackageId);
    if (forcedPkg) {
      const coveredModuleIds = forcedPkg.includedModuleIds.filter((id) =>
        selectedDiaModuleIds.includes(id),
      );
      const uncoveredModuleIds = selectedDiaModuleIds.filter(
        (id) => !coveredModuleIds.includes(id),
      );
      const uncoveredCost = uncoveredModuleIds.reduce((sum, moduleId) => {
        return sum + (perModulePrices.get(moduleId) ?? 0);
      }, 0);
      const totalCost = forcedPkg.pricePerStudent + uncoveredCost;

      return {
        selectedPackage: forcedPkg,
        totalCost,
        individualTotal,
        savings: individualTotal - totalCost,
        coveredModuleIds,
      };
    }
    // Forced package not found — fall through to auto-optimization
  }

  // Find qualifying packages: selected modules must include at least minModules
  // of the package's included modules
  const candidates: Array<{
    pkg: DiaPackage;
    coveredModuleIds: string[];
    uncoveredModuleIds: string[];
    totalCost: number;
  }> = [];

  for (const pkg of packages) {
    // Modules that are both in the package AND selected by the school
    const coveredModuleIds = pkg.includedModuleIds.filter((id) =>
      selectedDiaModuleIds.includes(id),
    );

    // Need at least minModules overlap to qualify
    if (coveredModuleIds.length < pkg.minModules) {
      continue;
    }

    // Modules selected but not covered by this package
    const uncoveredModuleIds = selectedDiaModuleIds.filter(
      (id) => !coveredModuleIds.includes(id),
    );

    // Total cost = package price + individual prices for uncovered modules
    const uncoveredCost = uncoveredModuleIds.reduce((sum, moduleId) => {
      return sum + (perModulePrices.get(moduleId) ?? 0);
    }, 0);

    const totalCost = pkg.pricePerStudent + uncoveredCost;

    candidates.push({ pkg, coveredModuleIds, uncoveredModuleIds, totalCost });
  }

  if (candidates.length === 0) {
    return {
      selectedPackage: null,
      totalCost: individualTotal,
      individualTotal,
      savings: 0,
      coveredModuleIds: [],
    };
  }

  // Pick the candidate with the lowest total cost
  candidates.sort((a, b) => a.totalCost - b.totalCost);
  const best = candidates[0];

  // Only use package if it's actually cheaper than individual pricing
  if (best.totalCost >= individualTotal) {
    return {
      selectedPackage: null,
      totalCost: individualTotal,
      individualTotal,
      savings: 0,
      coveredModuleIds: [],
    };
  }

  return {
    selectedPackage: best.pkg,
    totalCost: best.totalCost,
    individualTotal,
    savings: individualTotal - best.totalCost,
    coveredModuleIds: best.coveredModuleIds,
  };
}

/**
 * Calculate per-module costs for DIA, considering package pricing.
 * Returns a per-module breakdown and the total cost for the given student count.
 *
 * Pure function: no side effects, no state.
 *
 * @param selectedModuleIds - Module IDs selected for DIA
 * @param studentCount - Total number of students
 * @param diaPerModulePrices - Per-module price per student
 * @param packages - Available DIA packages
 */
export function calculateDiaModuleCosts(
  selectedModuleIds: string[],
  studentCount: number,
  diaPerModulePrices: Map<string, number>,
  packages: DiaPackage[],
): {
  perModule: Map<string, { cost: number; isPackagePrice: boolean; packageId?: string }>;
  total: number;
  packageResult: DiaPackageResult;
} {
  const packageResult = selectOptimalDiaPackage(
    selectedModuleIds,
    packages,
    diaPerModulePrices,
  );

  const perModule = new Map<
    string,
    { cost: number; isPackagePrice: boolean; packageId?: string }
  >();

  if (packageResult.selectedPackage) {
    const coveredCount = packageResult.coveredModuleIds.length;
    const packagePricePerModule =
      packageResult.selectedPackage.pricePerStudent / coveredCount;

    for (const moduleId of selectedModuleIds) {
      if (packageResult.coveredModuleIds.includes(moduleId)) {
        perModule.set(moduleId, {
          cost: packagePricePerModule * studentCount,
          isPackagePrice: true,
          packageId: packageResult.selectedPackage.id,
        });
      } else {
        const pricePerStudent = diaPerModulePrices.get(moduleId) ?? 0;
        perModule.set(moduleId, {
          cost: pricePerStudent * studentCount,
          isPackagePrice: false,
        });
      }
    }
  } else {
    for (const moduleId of selectedModuleIds) {
      const pricePerStudent = diaPerModulePrices.get(moduleId) ?? 0;
      perModule.set(moduleId, {
        cost: pricePerStudent * studentCount,
        isPackagePrice: false,
      });
    }
  }

  const total = packageResult.totalCost * studentCount;

  return { perModule, total, packageResult };
}
