import type { ProviderPriceCalculator, ModulePriceResult } from './types';
import type { CitoProviderConfig, CitoBundleType } from '@/data/providers/cito';
import { getCitoBundle } from '@/data/providers/cito';
import { buildOverrideResult } from './shared';

/**
 * Cito calculator: platform+module pricing with bundle logic.
 *
 * Supports three purchasing options: Individual, Basis bundle, Plus bundle.
 * When a bundle is active and ALL bundle modules are selected, bundle pricing applies.
 * Otherwise falls back to individual module pricing.
 *
 * Stateless: pure functions wrapped in a class for the interface.
 */
export class CitoCalculator implements ProviderPriceCalculator {
  readonly citoBundleType: CitoBundleType;
  readonly allSelectedModules: string[];

  readonly config: CitoProviderConfig;

  constructor(
    config: CitoProviderConfig,
    citoBundleType: CitoBundleType = 'individual',
    allSelectedModules: string[] = [],
  ) {
    this.config = config;
    this.citoBundleType = citoBundleType;
    this.allSelectedModules = allSelectedModules;
  }

  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null {
    if (overridePrice !== undefined) {
      return buildOverrideResult(overridePrice, totalStudents);
    }

    // Look up module in defaultPrices
    const defaultPrice = this.config.defaultPrices.find(
      (p) => p.moduleId === moduleId,
    );

    if (!defaultPrice) {
      return null;
    }

    // Check bundle eligibility
    const bundle = getCitoBundle(this.citoBundleType);
    const isBundleActive =
      bundle.pricePerStudent !== null && bundle.includedModuleIds.length > 0;

    if (isBundleActive) {
      const moduleInBundle = bundle.includedModuleIds.includes(moduleId);
      const allBundleModulesSelected = bundle.includedModuleIds.every((id) =>
        this.allSelectedModules.includes(id),
      );

      if (moduleInBundle && allBundleModulesSelected) {
        const bundleModuleCount = bundle.includedModuleIds.length;
        const pricePerStudent =
          Math.round((bundle.pricePerStudent! / bundleModuleCount) * 100) / 100;
        const totalCost = Math.round(pricePerStudent * totalStudents * 100) / 100;

        return {
          pricePerStudent,
          totalCost,
          breakdown: [
            {
              label: `Cito ${bundle.name} bundel: EUR ${bundle.pricePerStudent!.toFixed(2)} / ${bundleModuleCount} modules = EUR ${pricePerStudent.toFixed(2)}/lln`,
              amount: totalCost,
            },
          ],
          isPackagePrice: true,
        };
      }
    }

    // Individual pricing
    const pricePerStudent = defaultPrice.amountPerStudent;
    const totalCost = pricePerStudent * totalStudents;

    return {
      pricePerStudent,
      totalCost,
      breakdown: [
        {
          label: `Cito individuele prijs: EUR ${pricePerStudent.toFixed(2)}/lln`,
          amount: totalCost,
        },
      ],
      isPackagePrice: false,
    };
  }

  calculateAll(
    selectedModuleIds: string[],
    totalStudents: number,
    overridePrices?: Map<string, number>,
  ): Map<string, ModulePriceResult> {
    const results = new Map<string, ModulePriceResult>();

    for (const moduleId of selectedModuleIds) {
      const override = overridePrices?.get(moduleId);
      const result = this.calculateModule(moduleId, totalStudents, override);
      if (result) {
        results.set(moduleId, result);
      }
    }

    return results;
  }
}
