import type { PriceRecord } from '../models/pricing';
import type { ModuleCategory } from '../models/modules';
import type { DiaPackageResult } from '../models/dia-packages';
import type { PriceBreakdownStep } from './calculators/types';
import type { CitoBundleType } from '../data/providers/cito';
import type { Scenario } from '../models/school';
import { MODULE_CATALOG } from '../models/modules';
import { PROVIDER_CONFIGS } from '../data/providers/index';
import type { ProviderConfig } from '../data/providers/index';
import { createCalculator } from './calculators/index';
import { getDiaVolumeDiscountPercent } from './dia-packages';
import { getOldPlatformPrice } from '../data/cito-migration-prices';

export type ProviderKey = 'cito' | 'dia' | 'jij' | 'saqi';

export const PROVIDERS = ['cito', 'dia', 'jij', 'saqi'] as const;

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  cito: 'Cito',
  dia: 'DIA',
  jij: 'JIJ',
  saqi: 'SAQI',
};

export interface ProviderCost {
  pricePerStudent: number;
  totalCost: number;
  studentCount: number;
  priceRecord: PriceRecord;
  // Phase 10.2 additions:
  breakdown: PriceBreakdownStep[];
  isPackagePrice?: boolean;
  packageId?: string;
  tierId?: number;
}

export interface ModuleComparison {
  moduleId: string;
  moduleName: string;
  moduleCategory: ModuleCategory;
  providers: Record<ProviderKey, ProviderCost | null>;
}

export interface ComparisonResult {
  modules: ModuleComparison[];
  totals: Record<ProviderKey, number>;
  differences: {
    citoVsDia: number | null;
    citoVsJij: number | null;
    citoVsSaqi: number | null;
  };
  diaPackageResult: DiaPackageResult | null;
}

export interface ComparisonOptions {
  citoBundleType?: CitoBundleType;
  overridePrices?: Map<string, number>; // key: "moduleId:provider"
  scenarioType?: Scenario;
  /** Per-provider module subset from wizard — only these modules are calculated for each competitor */
  competitorModuleIds?: Partial<Record<ProviderKey, string[]>>;
  /** Force a specific DIA package instead of auto-optimization (null = individual pricing only) */
  forceDiaPackageId?: string | null;
  /** Injected provider configs from pricing data store (D-03). Falls back to static PROVIDER_CONFIGS when omitted. */
  providerConfigs?: Record<string, ProviderConfig>;
}

/**
 * Sum all student counts across all levels and years.
 */
export function getTotalStudents(
  studentCounts: Partial<Record<string, Record<number, number>>>,
): number {
  let total = 0;
  for (const levelCounts of Object.values(studentCounts)) {
    if (levelCounts) {
      for (const count of Object.values(levelCounts)) {
        total += count;
      }
    }
  }
  return total;
}

/**
 * Calculator-based comparison: uses provider-specific calculators internally.
 * Looks up prices from PROVIDER_CONFIGS. No pre-processed PriceRecord[] needed.
 *
 * Pure function: no side effects.
 */
export function calculateComparison(
  selectedModules: string[],
  studentCounts: Partial<Record<string, Record<number, number>>>,
  options: ComparisonOptions = {},
): ComparisonResult {
  const totalStudents = getTotalStudents(studentCounts);

  // Split overridePrices by provider for per-calculator use
  const providerOverrides = new Map<ProviderKey, Map<string, number>>();
  if (options.overridePrices) {
    for (const [key, value] of options.overridePrices) {
      const [moduleId, provider] = key.split(':');
      if (!moduleId || !provider) continue;
      const providerKey = provider as ProviderKey;
      if (!providerOverrides.has(providerKey)) {
        providerOverrides.set(providerKey, new Map());
      }
      providerOverrides.get(providerKey)!.set(moduleId, value);
    }
  }

  // Use injected configs or fall back to static (D-03)
  const configs = (options.providerConfigs ?? PROVIDER_CONFIGS) as Record<ProviderKey, ProviderConfig>;

  // Create calculators for each provider
  const calculators = new Map<ProviderKey, ReturnType<typeof createCalculator>>();
  for (const providerKey of PROVIDERS) {
    const config = configs[providerKey];
    calculators.set(
      providerKey,
      createCalculator(config, {
        citoBundleType: options.citoBundleType,
        selectedModules,
        forceDiaPackageId: providerKey === 'dia' ? options.forceDiaPackageId : undefined,
      }),
    );
  }

  // Run calculateAll for each provider
  // For non-cito providers, use competitorModuleIds when available
  const providerResults = new Map<ProviderKey, Map<string, import('./calculators/types').ModulePriceResult>>();
  for (const providerKey of PROVIDERS) {
    const calc = calculators.get(providerKey)!;
    const overrides = providerOverrides.get(providerKey);
    const modulesToCalc = providerKey === 'cito'
      ? selectedModules
      : (options.competitorModuleIds?.[providerKey] ?? selectedModules);
    providerResults.set(providerKey, calc.calculateAll(modulesToCalc, totalStudents, overrides));
  }

  // Scenario C: override cito prices with old-platform prices
  if (options.scenarioType === 'C') {
    const citoResults = providerResults.get('cito');
    if (citoResults) {
      for (const moduleId of selectedModules) {
        const oldPrice = getOldPlatformPrice(moduleId);
        if (oldPrice !== null) {
          const existing = citoResults.get(moduleId);
          if (existing) {
            citoResults.set(moduleId, {
              ...existing,
              pricePerStudent: oldPrice,
              totalCost: oldPrice * totalStudents,
            });
          }
        }
        // If oldPrice is null, keep the new-platform price as fallback
      }
    }
  }

  // Build module comparisons
  const modules: ModuleComparison[] = selectedModules.map((moduleId) => {
    const moduleDef = MODULE_CATALOG.find((m) => m.id === moduleId);
    const moduleName = moduleDef?.name ?? moduleId;
    const moduleCategory: ModuleCategory = moduleDef?.category ?? 'overige-instrumenten';

    const providers = {} as Record<ProviderKey, ProviderCost | null>;

    for (const providerKey of PROVIDERS) {
      const calcResult = providerResults.get(providerKey)?.get(moduleId);

      if (calcResult) {
        // Construct synthetic PriceRecord for backward compat
        const config = configs[providerKey];
        const defaultPriceRecord = config.defaultPrices.find(
          (p) => p.moduleId === moduleId,
        );

        // Check if this module+provider had an override applied
        const overrideKey = `${moduleId}:${providerKey}`;
        const hasOverride = options.overridePrices?.has(overrideKey) ?? false;

        const priceRecord: PriceRecord = defaultPriceRecord
          ? {
              ...defaultPriceRecord,
              amountPerStudent: calcResult.pricePerStudent,
              ...(hasOverride ? { source: 'manual' as const, sourceLabel: 'Handmatig ingevoerd', isPublicationPrice: false } : {}),
            }
          : {
              moduleId,
              provider: providerKey,
              amountPerStudent: calcResult.pricePerStudent,
              source: hasOverride ? 'manual' : 'publication',
              sourceLabel: hasOverride ? 'Handmatig ingevoerd' : `${PROVIDER_LABELS[providerKey]} — berekend`,
              verifiedAt: new Date(),
              isPublicationPrice: !hasOverride,
            };

        providers[providerKey] = {
          pricePerStudent: calcResult.pricePerStudent,
          totalCost: calcResult.totalCost,
          studentCount: totalStudents,
          priceRecord,
          breakdown: calcResult.breakdown,
          isPackagePrice: calcResult.isPackagePrice || undefined,
          packageId: calcResult.packageId,
          tierId: calcResult.tierId,
        };
      } else {
        providers[providerKey] = null;
      }
    }

    return { moduleId, moduleName, moduleCategory, providers };
  });

  // Compute totals per provider
  const totals: Record<ProviderKey, number> = { cito: 0, dia: 0, jij: 0, saqi: 0 };
  for (const mod of modules) {
    for (const provider of PROVIDERS) {
      const cost = mod.providers[provider];
      if (cost) {
        totals[provider] += cost.totalCost;
      }
    }
  }

  // Track whether a provider has ANY module with a price
  const hasAnyModule: Record<ProviderKey, boolean> = { cito: false, dia: false, jij: false, saqi: false };
  for (const mod of modules) {
    for (const provider of PROVIDERS) {
      if (mod.providers[provider] !== null) {
        hasAnyModule[provider] = true;
      }
    }
  }

  // Compute differences (null if the other provider has no modules at all)
  const differences = {
    citoVsDia: hasAnyModule.dia ? totals.cito - totals.dia : null,
    citoVsJij: hasAnyModule.jij ? totals.cito - totals.jij : null,
    citoVsSaqi: hasAnyModule.saqi ? totals.cito - totals.saqi : null,
  };

  // Extract DIA package result from DIA calculator results
  // The DiaCalculator internally runs package optimization in calculateAll.
  // We need to reconstruct the DiaPackageResult from the results.
  let diaPackageResult: DiaPackageResult | null = null;
  const diaResults = providerResults.get('dia');
  if (diaResults) {
    const coveredModuleIds: string[] = [];
    let packageId: string | undefined;
    for (const [moduleId, result] of diaResults) {
      if (result.isPackagePrice && result.packageId) {
        coveredModuleIds.push(moduleId);
        packageId = result.packageId;
      }
    }

    if (packageId && coveredModuleIds.length > 0) {
      // Find the package from DIA config
      const diaConfig = configs.dia;
      const pkg = (diaConfig as import('../data/providers/dia').DiaProviderConfig).packages.find(
        (p) => p.id === packageId,
      );
      if (pkg) {
        // Compute individual total (sum of discounted per-module prices)
        let individualTotal = 0;
        const disc = getDiaVolumeDiscountPercent(totalStudents);
        for (const moduleId of selectedModules) {
          const defaultPrice = diaConfig.defaultPrices.find(
            (p) => p.moduleId === moduleId,
          );
          if (defaultPrice) {
            individualTotal += Math.round(defaultPrice.amountPerStudent * (1 - disc / 100) * 100) / 100;
          }
        }

        const packageTotal = pkg.pricePerStudent;
        diaPackageResult = {
          selectedPackage: pkg,
          totalCost: packageTotal,
          individualTotal,
          savings: individualTotal - packageTotal,
          coveredModuleIds,
        };
      }
    }
  }

  return { modules, totals, differences, diaPackageResult };
}

