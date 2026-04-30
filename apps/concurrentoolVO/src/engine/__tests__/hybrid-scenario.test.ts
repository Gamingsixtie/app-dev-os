import { describe, it, expect } from 'vitest';
import { calculateHybridScenario } from '../hybrid-scenario';
import type { ComparisonResult, ModuleComparison } from '../price-comparison';
import type { ModuleCurrentSetup } from '../../models/school';
import type { PriceRecord } from '../../models/pricing';

// Helper: build a price record quickly
function makePrice(
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord {
  return {
    moduleId,
    provider,
    amountPerStudent: amount,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-15'),
    isPublicationPrice: true,
  };
}

// Helper: build a module comparison
function makeModuleComparison(
  moduleId: string,
  moduleName: string,
  citoCost: number | null,
  diaCost: number | null,
  jijCost: number | null,
  studentCount: number = 100,
): ModuleComparison {
  return {
    moduleId,
    moduleName,
    moduleCategory: 'leerlingvolgsysteem',
    providers: {
      cito: citoCost !== null
        ? { pricePerStudent: citoCost / studentCount, totalCost: citoCost, studentCount, priceRecord: makePrice(moduleId, 'cito', citoCost / studentCount), breakdown: [] }
        : null,
      dia: diaCost !== null
        ? { pricePerStudent: diaCost / studentCount, totalCost: diaCost, studentCount, priceRecord: makePrice(moduleId, 'dia', diaCost / studentCount), breakdown: [] }
        : null,
      jij: jijCost !== null
        ? { pricePerStudent: jijCost / studentCount, totalCost: jijCost, studentCount, priceRecord: makePrice(moduleId, 'jij', jijCost / studentCount), breakdown: [] }
        : null,
      saqi: null,
    },
  };
}

describe('calculateHybridScenario', () => {
  it('Test 1: School uses DIA for rekenwiskunde -> savings calculated', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('rekenwiskunde', 'Reken-Wiskunde', 450, 520, 480),
      ],
      totals: { cito: 450, dia: 520, jij: 480, saqi: 0 },
      differences: { citoVsDia: -70, citoVsJij: -30, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.20 },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].currentProvider).toBe('dia');
    expect(result.modules[0].currentCost).toBe(520);
    expect(result.modules[0].citoCost).toBe(450);
    expect(result.modules[0].savings).toBe(70); // 520 - 450
    expect(result.totalSavings).toBe(70);
  });

  it('Test 2: School uses JIJ for nederlands -> uses JIJ cost from comparison', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('nederlands', 'Nederlands', 450, 520, 480),
      ],
      totals: { cito: 450, dia: 520, jij: 480, saqi: 0 },
      differences: { citoVsDia: -70, citoVsJij: -30, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'nederlands', currentProvider: 'jij', pricePerStudent: 4.80 },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].currentProvider).toBe('jij');
    expect(result.modules[0].currentCost).toBe(480);
    expect(result.modules[0].citoCost).toBe(450);
    expect(result.modules[0].savings).toBe(30);
  });

  it('Test 3: Mixed providers -> separate savings per module, correct totals', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('rekenwiskunde', 'Reken-Wiskunde', 450, 520, null),
        makeModuleComparison('nederlands', 'Nederlands', 450, 520, null),
        makeModuleComparison('engels', 'Engels', 450, null, 480),
      ],
      totals: { cito: 1350, dia: 1040, jij: 480, saqi: 0 },
      differences: { citoVsDia: 310, citoVsJij: 870, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.20 },
      { moduleId: 'nederlands', currentProvider: 'dia', pricePerStudent: 5.20 },
      { moduleId: 'engels', currentProvider: 'jij', pricePerStudent: 4.80 },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(3);
    expect(result.totalCurrentCost).toBe(520 + 520 + 480); // 1520
    expect(result.totalCitoCost).toBe(450 + 450 + 450); // 1350
    expect(result.totalSavings).toBe(170); // 1520 - 1350
  });

  it('Test 4: Module with currentProvider geen -> excluded from hybrid', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('rekenwiskunde', 'Reken-Wiskunde', 450, 520, 480),
      ],
      totals: { cito: 450, dia: 520, jij: 480, saqi: 0 },
      differences: { citoVsDia: -70, citoVsJij: -30, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(0);
    expect(result.totalSavings).toBe(0);
  });

  it('Test 5: Module with currentProvider cito-oud -> excluded (already Cito)', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('rekenwiskunde', 'Reken-Wiskunde', 450, 520, 480),
      ],
      totals: { cito: 450, dia: 520, jij: 480, saqi: 0 },
      differences: { citoVsDia: -70, citoVsJij: -30, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: 4.50 },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(0);
  });

  it('Test 6: No non-Cito providers -> empty result', () => {
    const comparisonResult: ComparisonResult = {
      modules: [
        makeModuleComparison('rekenwiskunde', 'Reken-Wiskunde', 450, 520, 480),
        makeModuleComparison('nederlands', 'Nederlands', 450, 520, 480),
      ],
      totals: { cito: 900, dia: 1040, jij: 960, saqi: 0 },
      differences: { citoVsDia: -140, citoVsJij: -60, citoVsSaqi: null },
      diaPackageResult: null,
    };

    const moduleSetups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-nieuw', pricePerStudent: 4.50 },
      { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = calculateHybridScenario(comparisonResult, moduleSetups);

    expect(result.modules).toHaveLength(0);
    expect(result.totalCurrentCost).toBe(0);
    expect(result.totalCitoCost).toBe(0);
    expect(result.totalSavings).toBe(0);
  });
});
