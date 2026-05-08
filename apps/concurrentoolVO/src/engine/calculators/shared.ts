import type { ModulePriceResult } from './types';

export function buildOverrideResult(
  overridePrice: number,
  totalStudents: number,
): ModulePriceResult {
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
