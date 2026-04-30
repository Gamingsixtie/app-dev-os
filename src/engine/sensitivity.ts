import type { ComparisonResult } from './price-comparison';
import type { ProviderKey } from './price-comparison';

export interface SensitivityScenario {
  discountPercent: number;
  label: string;
  competitorTotal: number;
  citoTotal: number;
  difference: number;
  perModule: Array<{
    moduleId: string;
    moduleName: string;
    competitorCost: number;
    citoCost: number;
    difference: number;
  }>;
}

export interface SensitivityResult {
  competitor: ProviderKey;
  competitorLabel: string;
  scenarios: SensitivityScenario[];
  breakEven: {
    totalPercent: number | null;
    perModule: Array<{
      moduleId: string;
      percent: number | null;
    }>;
  };
}

const PROVIDER_LABELS: Record<ProviderKey, string> = {
  cito: 'Cito',
  dia: 'DIA',
  jij: 'JIJ',
  saqi: 'SAQI',
};

/**
 * Calculate the break-even discount percentage at which the competitor
 * becomes cheaper than (or equal to) Cito.
 *
 * Returns null if Cito is already more expensive (no discount needed)
 * or if competitorCost is 0.
 *
 * Formula: (1 - citoCost / competitorCost) * 100
 *
 * Pure function.
 */
export function calculateBreakEven(
  citoCost: number,
  competitorCost: number,
): number | null {
  if (competitorCost <= 0) return null;
  if (citoCost >= competitorCost) return null;

  const breakEvenPercent = (1 - citoCost / competitorCost) * 100;
  return Math.round(breakEvenPercent * 10) / 10;
}

/**
 * Calculate sensitivity analysis: what happens to the comparison at
 * different discount levels for the active competitor.
 *
 * Includes break-even calculation per module and total.
 *
 * Pure function: no side effects, no state.
 *
 * @param comparisonResult - The base comparison at publication prices
 * @param activeCompetitor - Which competitor to apply discounts to
 * @param discountPercents - Discount percentages to evaluate (default: [0, 10, 20])
 */
export function calculateSensitivity(
  comparisonResult: ComparisonResult,
  activeCompetitor: ProviderKey,
  discountPercents: number[] = [0, 10, 20],
): SensitivityResult {
  const citoTotal = comparisonResult.totals.cito;

  const scenarios: SensitivityScenario[] = discountPercents.map((discountPercent) => {
    const discountMultiplier = 1 - discountPercent / 100;
    const label = discountPercent === 0 ? 'Huidige prijs' : `${discountPercent}% korting`;

    const perModule = comparisonResult.modules
      .filter((m) => m.providers[activeCompetitor] !== null)
      .map((m) => {
        const competitorCost = m.providers[activeCompetitor]!.totalCost * discountMultiplier;
        const citoCost = m.providers.cito?.totalCost ?? 0;

        return {
          moduleId: m.moduleId,
          moduleName: m.moduleName,
          competitorCost: Math.round(competitorCost * 100) / 100,
          citoCost,
          difference: Math.round((citoCost - competitorCost) * 100) / 100,
        };
      });

    const competitorTotal = Math.round(
      (comparisonResult.totals[activeCompetitor] * discountMultiplier) * 100,
    ) / 100;

    return {
      discountPercent,
      label,
      competitorTotal,
      citoTotal,
      difference: Math.round((citoTotal - competitorTotal) * 100) / 100,
      perModule,
    };
  });

  // Break-even per module
  const perModuleBreakEven = comparisonResult.modules
    .filter((m) => m.providers[activeCompetitor] !== null)
    .map((m) => {
      const citoCost = m.providers.cito?.totalCost ?? 0;
      const competitorCost = m.providers[activeCompetitor]!.totalCost;

      return {
        moduleId: m.moduleId,
        percent: calculateBreakEven(citoCost, competitorCost),
      };
    });

  // Break-even total
  const totalBreakEven = calculateBreakEven(
    citoTotal,
    comparisonResult.totals[activeCompetitor],
  );

  return {
    competitor: activeCompetitor,
    competitorLabel: PROVIDER_LABELS[activeCompetitor],
    scenarios,
    breakEven: {
      totalPercent: totalBreakEven,
      perModule: perModuleBreakEven,
    },
  };
}
