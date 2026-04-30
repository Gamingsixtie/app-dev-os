import type { ModuleCurrentSetup } from '@/models/school';
import type { PriceRecord } from '@/models/pricing';
import { toPriceProvider } from '@/models/school';

/**
 * Converts moduleSetups (Products tab prices) into the overridePrices map
 * that the comparison engine accepts.
 *
 * Key format: "moduleId:provider" (e.g. "begrijpend-lezen:cito")
 */
export function buildOverridePricesFromSetups(
  moduleSetups: ModuleCurrentSetup[],
  defaultPrices: PriceRecord[],
): Map<string, number> {
  const overrides = new Map<string, number>();

  for (const setup of moduleSetups) {
    const provider = toPriceProvider(setup.currentProvider);
    if (!provider) continue;

    const key = `${setup.moduleId}:${provider}`;

    if (setup.priceAdjustmentType === 'korting' && setup.discountPercentage != null) {
      // Discount: calculate absolute price from publication price
      const pubPrice = defaultPrices.find(
        (p) => p.moduleId === setup.moduleId && p.provider === provider,
      )?.amountPerStudent;
      if (pubPrice != null) {
        overrides.set(key, pubPrice * (1 - setup.discountPercentage / 100));
      }
    } else if (setup.pricePerStudent != null) {
      // Absolute price override (prijswijziging or legacy)
      overrides.set(key, setup.pricePerStudent);
    }
  }

  return overrides;
}
