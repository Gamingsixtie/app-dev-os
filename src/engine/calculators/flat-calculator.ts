import type { ProviderPriceCalculator, ModulePriceResult } from './types';
import type { SaqiProviderConfig } from '@/data/providers/saqi';

/**
 * Generic flat pricing calculator for providers with simple per-student pricing.
 * Used for SAQI and as fallback for any flat-pricing provider.
 *
 * Stateless: pure functions wrapped in a class for the interface.
 */
export class FlatCalculator implements ProviderPriceCalculator {
  private readonly config: SaqiProviderConfig;

  constructor(config: SaqiProviderConfig) {
    this.config = config;
  }

  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null {
    // Override takes precedence
    if (overridePrice !== undefined) {
      return {
        pricePerStudent: overridePrice,
        totalCost: overridePrice * totalStudents,
        breakdown: [
          {
            label: `Schoolspecifieke prijs (overschrijving): EUR ${overridePrice.toFixed(2)}/lln`,
            amount: overridePrice * totalStudents,
          },
        ],
        isPackagePrice: false,
      };
    }

    // Look up module in defaultPrices
    const defaultPrice = this.config.defaultPrices.find(
      (p) => p.moduleId === moduleId,
    );

    if (!defaultPrice) {
      return null;
    }

    const pricePerStudent = defaultPrice.amountPerStudent;
    const totalCost = pricePerStudent * totalStudents;

    return {
      pricePerStudent,
      totalCost,
      breakdown: [
        {
          label: `${totalStudents} leerlingen x EUR ${pricePerStudent.toFixed(2)}/lln`,
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
