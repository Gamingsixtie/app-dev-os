import type { ProviderPriceCalculator, ModulePriceResult } from './types';
import type { DiaProviderConfig } from '@/data/providers/dia';
import {
  getDiaVolumeDiscountPercent,
  selectOptimalDiaPackage,
} from '@/engine/dia-packages';
import { buildOverrideResult } from './shared';

/**
 * DIA calculator: package-bundle pricing with volume discount and package optimization.
 *
 * DIA offers individual module pricing with volume discounts (5% at 500+, 10% at 1000+)
 * and package bundles that can be cheaper when multiple modules are selected.
 *
 * Stateless: pure functions wrapped in a class for the interface.
 */
export class DiaCalculator implements ProviderPriceCalculator {
  private readonly config: DiaProviderConfig;
  private readonly forceDiaPackageId?: string | null;

  constructor(config: DiaProviderConfig, forceDiaPackageId?: string | null) {
    this.config = config;
    this.forceDiaPackageId = forceDiaPackageId;
  }

  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null {
    if (overridePrice !== undefined) {
      return buildOverrideResult(overridePrice, totalStudents);
    }

    // Look up base price
    const defaultPrice = this.config.defaultPrices.find(
      (p) => p.moduleId === moduleId,
    );

    if (!defaultPrice) {
      return null;
    }

    const basePrice = defaultPrice.amountPerStudent;
    const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
    const discountedPrice =
      Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
    const totalCost = Math.round(discountedPrice * totalStudents * 100) / 100;

    const breakdown = [
      {
        label: `Basisprijs: EUR ${basePrice.toFixed(2)}/lln`,
        amount: basePrice,
      },
    ];

    if (discountPercent > 0) {
      breakdown.push({
        label: `Staffelkorting ${discountPercent}% (${totalStudents}+ leerlingen): EUR ${discountedPrice.toFixed(2)}/lln`,
        amount: discountedPrice,
      });
    }

    return {
      pricePerStudent: discountedPrice,
      totalCost,
      breakdown,
      isPackagePrice: false,
    };
  }

  calculateAll(
    selectedModuleIds: string[],
    totalStudents: number,
    overridePrices?: Map<string, number>,
  ): Map<string, ModulePriceResult> {
    const results = new Map<string, ModulePriceResult>();

    // First, compute discounted per-module prices (for non-overridden modules)
    const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
    const perModulePrices = new Map<string, number>();

    for (const moduleId of selectedModuleIds) {
      if (overridePrices?.has(moduleId)) {
        // Override modules use override price for package optimization
        perModulePrices.set(moduleId, overridePrices.get(moduleId)!);
      } else {
        const defaultPrice = this.config.defaultPrices.find(
          (p) => p.moduleId === moduleId,
        );
        if (defaultPrice) {
          const discounted =
            Math.round(
              defaultPrice.amountPerStudent * (1 - discountPercent / 100) * 100,
            ) / 100;
          perModulePrices.set(moduleId, discounted);
        }
      }
    }

    // Filter: only non-overridden modules participate in package optimization
    const nonOverriddenModules = selectedModuleIds.filter(
      (id) => !overridePrices?.has(id),
    );

    // Run package optimization on non-overridden modules
    const packageResult = selectOptimalDiaPackage(
      nonOverriddenModules,
      this.config.packages,
      perModulePrices,
      this.forceDiaPackageId,
    );

    // Build results for each module
    for (const moduleId of selectedModuleIds) {
      const override = overridePrices?.get(moduleId);

      if (override !== undefined) {
        results.set(moduleId, buildOverrideResult(override, totalStudents));
        continue;
      }

      const defaultPrice = this.config.defaultPrices.find(
        (p) => p.moduleId === moduleId,
      );
      if (!defaultPrice) continue;

      const basePrice = defaultPrice.amountPerStudent;

      // Check if this module is covered by a package
      if (
        packageResult.selectedPackage &&
        packageResult.coveredModuleIds.includes(moduleId)
      ) {
        const coveredCount = packageResult.coveredModuleIds.length;
        const packagePricePerModule =
          Math.round(
            (packageResult.selectedPackage.pricePerStudent / coveredCount) * 100,
          ) / 100;
        const moduleTotalCost =
          Math.round(packagePricePerModule * totalStudents * 100) / 100;

        results.set(moduleId, {
          pricePerStudent: packagePricePerModule,
          totalCost: moduleTotalCost,
          breakdown: [
            {
              label: `Onderdeel van ${packageResult.selectedPackage.name} (EUR ${packageResult.selectedPackage.pricePerStudent.toFixed(2)} / ${coveredCount} modules)`,
              amount: packagePricePerModule,
            },
          ],
          isPackagePrice: true,
          packageId: packageResult.selectedPackage.id,
        });
      } else {
        // Individual pricing with volume discount
        const discountedPrice =
          Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
        const totalCost =
          Math.round(discountedPrice * totalStudents * 100) / 100;

        const breakdown = [
          {
            label: `Basisprijs: EUR ${basePrice.toFixed(2)}/lln`,
            amount: basePrice,
          },
        ];

        if (discountPercent > 0) {
          breakdown.push({
            label: `Staffelkorting ${discountPercent}% (${totalStudents}+ leerlingen): EUR ${discountedPrice.toFixed(2)}/lln`,
            amount: discountedPrice,
          });
        }

        results.set(moduleId, {
          pricePerStudent: discountedPrice,
          totalCost,
          breakdown,
          isPackagePrice: false,
        });
      }
    }

    return results;
  }
}
