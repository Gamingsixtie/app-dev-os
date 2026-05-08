import type { ProviderPriceCalculator, ModulePriceResult } from './types';
import type { JijProviderConfig, JijLicenseTier } from '@/data/providers/jij';
import { buildOverrideResult } from './shared';

/**
 * JIJ! calculator: tiered-license pricing varying with school size.
 *
 * JIJ! uses a fundamentally different model:
 * - ONE fixed annual license fee (regardless of how many modules)
 * - Per-test administration fee (per module × per student × measurements/year)
 * - ONE Magister/SomToday integration fee (optional, regardless of modules)
 *
 * The tier is determined by TOTAL administrations across ALL modules:
 *   totalAdministrations = totalStudents × testsPerStudent × paidModuleCount
 *
 * License and Magister fees are charged ONCE and distributed across modules
 * for per-module display purposes.
 *
 * Stateless: pure functions wrapped in a class for the interface.
 */
export class JijCalculator implements ProviderPriceCalculator {
  private readonly config: JijProviderConfig;
  private readonly allSelectedModules: string[];

  constructor(config: JijProviderConfig, allSelectedModules: string[] = []) {
    this.config = config;
    this.allSelectedModules = allSelectedModules;
  }

  /**
   * Find the tier for a given number of total administrations.
   */
  private selectTier(totalAdministrations: number): JijLicenseTier {
    return (
      this.config.licenseTiers.find(
        (t) =>
          totalAdministrations >= t.minAdministrations &&
          totalAdministrations <= t.maxAdministrations,
      ) ?? this.config.licenseTiers[this.config.licenseTiers.length - 1]
    );
  }

  /**
   * Count how many of the given modules are "paid" JIJ! modules
   * (i.e., have a default price entry with amountPerStudent > 0).
   */
  private getPaidModuleIds(moduleIds: string[]): string[] {
    return moduleIds.filter((id) => {
      const dp = this.config.defaultPrices.find((p) => p.moduleId === id);
      return dp && dp.amountPerStudent > 0;
    });
  }

  /**
   * Single-module calculation. Uses allSelectedModules context to determine
   * the correct tier and license distribution. Falls back to single-module
   * assumptions if no context is available.
   */
  calculateModule(
    moduleId: string,
    totalStudents: number,
    overridePrice?: number,
  ): ModulePriceResult | null {
    const defaultPrice = this.config.defaultPrices.find(
      (p) => p.moduleId === moduleId,
    );

    if (!defaultPrice) {
      return null;
    }

    if (overridePrice !== undefined) {
      return buildOverrideResult(overridePrice, totalStudents);
    }

    // Modules included in the license at no extra cost (amountPerStudent === 0)
    if (defaultPrice.amountPerStudent === 0) {
      return {
        pricePerStudent: 0,
        totalCost: 0,
        breakdown: [
          {
            label: 'Onderdeel van JIJ! licentie (geen meerprijs)',
            amount: 0,
          },
        ],
        isPackagePrice: false,
      };
    }

    // Determine context: how many paid modules are selected?
    const contextModules =
      this.allSelectedModules.length > 0
        ? this.allSelectedModules
        : [moduleId]; // fallback: just this module
    const paidModuleIds = this.getPaidModuleIds(contextModules);
    const paidModuleCount = Math.max(paidModuleIds.length, 1);

    // Compute tier based on TOTAL administrations across ALL paid modules
    const { defaultTestsPerStudent } = this.config.pricingStrategy;
    const totalAdministrations =
      totalStudents * defaultTestsPerStudent * paidModuleCount;
    const tier = this.selectTier(totalAdministrations);

    // License: charged ONCE, distributed across paid modules
    const licenseCostTotal = tier.annualFee / totalStudents;
    const licenseCostPerModule = licenseCostTotal / paidModuleCount;

    // Magister/SomToday: charged ONCE, distributed across paid modules
    const magisterCostTotal = tier.magisterSomtodayFee / totalStudents;
    const magisterCostPerModule = magisterCostTotal / paidModuleCount;

    // Test costs: per module (each module has its own administrations)
    const testCostPerStudent = defaultTestsPerStudent * tier.pricePerTest;

    const pricePerStudent =
      Math.round(
        (licenseCostPerModule + testCostPerStudent + magisterCostPerModule) *
          100,
      ) / 100;
    const totalCost = Math.round(pricePerStudent * totalStudents * 100) / 100;

    return {
      pricePerStudent,
      totalCost,
      breakdown: [
        {
          label: tier.label,
          amount: tier.annualFee,
        },
        {
          label: `Licentiekosten: EUR ${tier.annualFee.toLocaleString('nl-NL')} / ${totalStudents} lln${paidModuleCount > 1 ? ` / ${paidModuleCount} modules` : ''} = EUR ${licenseCostPerModule.toFixed(2)}/lln`,
          amount: licenseCostPerModule,
        },
        {
          label: `Toetskosten: ${defaultTestsPerStudent} afnames x EUR ${tier.pricePerTest.toFixed(2)} = EUR ${testCostPerStudent.toFixed(2)}/lln`,
          amount: testCostPerStudent,
        },
        {
          label: `Magister/SomToday-koppeling: EUR ${tier.magisterSomtodayFee.toLocaleString('nl-NL')} / ${totalStudents} lln${paidModuleCount > 1 ? ` / ${paidModuleCount} modules` : ''} = EUR ${magisterCostPerModule.toFixed(2)}/lln`,
          amount: magisterCostPerModule,
        },
        {
          label: `Totaal per leerling: EUR ${pricePerStudent.toFixed(2)}/lln`,
          amount: pricePerStudent,
        },
      ],
      isPackagePrice: false,
      tierId: tier.tier,
    };
  }

  calculateAll(
    selectedModuleIds: string[],
    totalStudents: number,
    overridePrices?: Map<string, number>,
  ): Map<string, ModulePriceResult> {
    const results = new Map<string, ModulePriceResult>();

    // Build a temporary calculator with the correct context for this call
    const contextCalc = new JijCalculator(this.config, selectedModuleIds);

    for (const moduleId of selectedModuleIds) {
      const override = overridePrices?.get(moduleId);
      const result = contextCalc.calculateModule(
        moduleId,
        totalStudents,
        override,
      );
      if (result) {
        results.set(moduleId, result);
      }
    }

    return results;
  }
}
