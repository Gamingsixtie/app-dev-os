import { describe, it, expect } from 'vitest';
import { calculateUpsell } from '../upsell';
import type { ModuleCurrentSetup } from '@/models/school';
import type { ComparisonResult, ModuleComparison, ProviderCost } from '../price-comparison';
import type { PriceRecord } from '@/models/pricing';

// Helper to create a minimal PriceRecord for ProviderCost
function makePriceRecord(moduleId: string, provider: string, amount: number): PriceRecord {
  return {
    moduleId,
    provider: provider as PriceRecord['provider'],
    amountPerStudent: amount,
    source: 'publication',
    sourceLabel: 'Publicatieprijs',
    verifiedAt: new Date('2026-01-01'),
    isPublicationPrice: true,
  };
}

// Helper to create a ProviderCost
function makeProviderCost(pricePerStudent: number, moduleId: string, provider: string): ProviderCost {
  return {
    pricePerStudent,
    totalCost: pricePerStudent * 100,
    studentCount: 100,
    priceRecord: makePriceRecord(moduleId, provider, pricePerStudent),
    breakdown: [],
  };
}

// Helper to build a ComparisonResult with specific module comparisons
function makeComparisonResult(modules: ModuleComparison[]): ComparisonResult {
  return {
    modules,
    totals: { cito: 0, dia: 0, jij: 0, saqi: 0 },
    differences: { citoVsDia: null, citoVsJij: null, citoVsSaqi: null },
    diaPackageResult: null,
  };
}

describe('calculateUpsell', () => {
  it('returns green signal: competitor=dia, Cito cheaper, has differentiators', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(1);
    expect(result[0].signalStrength).toBe('green');
    expect(result[0].moduleId).toBe('rekenwiskunde');
    expect(result[0].hasDifferentiators).toBe(true);
  });

  it('returns yellow signal: competitor=dia, Cito cheaper, no differentiators', () => {
    // taalverzorging: DIA has no differentiators, but Cito DOES have differentiators
    // We need a module where Cito has NO differentiators but is cheaper
    // Actually, let's test with a module where Cito IS cheaper but check if hasDifferentiators
    // is based on Cito differentiators. For 'taalverzorging': cito has differentiators.
    // Let's use a hypothetical module not in MODULE_DIFFERENTIATORS
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'unknown-module', currentProvider: 'dia', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'unknown-module',
        moduleName: 'Unknown Module',
        moduleCategory: 'overige-instrumenten',
        providers: {
          cito: makeProviderCost(3.0, 'unknown-module', 'cito'),
          dia: makeProviderCost(5.0, 'unknown-module', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(1);
    // Cito cheaper but no differentiators -> yellow
    expect(result[0].signalStrength).toBe('yellow');
    expect(result[0].hasDifferentiators).toBe(false);
  });

  it('returns yellow signal: competitor=jij, Cito more expensive, has differentiators', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'jij', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(6.0, 'rekenwiskunde', 'cito'),
          dia: null,
          jij: makeProviderCost(4.0, 'rekenwiskunde', 'jij'),
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(1);
    // Cito more expensive but has differentiators -> yellow
    expect(result[0].signalStrength).toBe('yellow');
  });

  it('excludes red signal: Cito more expensive + no differentiators', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'unknown-module', currentProvider: 'dia', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'unknown-module',
        moduleName: 'Unknown Module',
        moduleCategory: 'overige-instrumenten',
        providers: {
          cito: makeProviderCost(8.0, 'unknown-module', 'cito'),
          dia: makeProviderCost(5.0, 'unknown-module', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    // Red signal: more expensive + no differentiators -> excluded
    expect(result).toHaveLength(0);
  });

  it('excludes module with currentProvider=geen', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(0);
  });

  it('excludes module with currentProvider=cito-oud', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(0);
  });

  it('excludes module with currentProvider=cito-nieuw', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-nieuw', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty moduleSetups', () => {
    const comparisonResult = makeComparisonResult([]);
    const result = calculateUpsell([], comparisonResult);
    expect(result).toEqual([]);
  });

  it('excludes module not in comparisonResult', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'non-existent', currentProvider: 'dia', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(0);
  });

  it('calculates savingsPerStudent correctly (positive when Cito cheaper)', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(1);
    // savingsPerStudent = competitorCost - citoCost = 5.0 - 3.0 = 2.0
    expect(result[0].savingsPerStudent).toBe(2.0);
    expect(result[0].citoCostPerStudent).toBe(3.0);
    expect(result[0].competitorCostPerStudent).toBe(5.0);
  });

  it('excludes module with currentProvider=overig (no comparison data)', () => {
    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'overig', pricePerStudent: null },
    ];
    const comparisonResult = makeComparisonResult([
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Rekenen-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: makeProviderCost(3.0, 'rekenwiskunde', 'cito'),
          dia: makeProviderCost(5.0, 'rekenwiskunde', 'dia'),
          jij: null,
          saqi: null,
        },
      },
    ]);

    const result = calculateUpsell(moduleSetups, comparisonResult);
    expect(result).toHaveLength(0);
  });
});
