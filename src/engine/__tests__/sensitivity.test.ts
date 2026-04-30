import { describe, it, expect } from 'vitest';
import { calculateSensitivity, calculateBreakEven } from '../sensitivity';
import type { ComparisonResult } from '../price-comparison';
import type { PriceRecord } from '../../models/pricing';

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

describe('calculateSensitivity', () => {
  const comparisonResult: ComparisonResult = {
    modules: [
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Reken-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: { pricePerStudent: 4.50, totalCost: 450, studentCount: 100, priceRecord: makePrice('rekenwiskunde', 'cito', 4.50), breakdown: [] },
          dia: { pricePerStudent: 5.20, totalCost: 520, studentCount: 100, priceRecord: makePrice('rekenwiskunde', 'dia', 5.20), breakdown: [] },
          jij: { pricePerStudent: 4.80, totalCost: 480, studentCount: 100, priceRecord: makePrice('rekenwiskunde', 'jij', 4.80), breakdown: [] },
          saqi: null,
        },
      },
      {
        moduleId: 'nederlands',
        moduleName: 'Nederlands',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: { pricePerStudent: 4.50, totalCost: 450, studentCount: 100, priceRecord: makePrice('nederlands', 'cito', 4.50), breakdown: [] },
          dia: { pricePerStudent: 5.20, totalCost: 520, studentCount: 100, priceRecord: makePrice('nederlands', 'dia', 5.20), breakdown: [] },
          jij: { pricePerStudent: 4.80, totalCost: 480, studentCount: 100, priceRecord: makePrice('nederlands', 'jij', 4.80), breakdown: [] },
          saqi: null,
        },
      },
    ],
    totals: { cito: 900, dia: 1040, jij: 960, saqi: 0 },
    differences: { citoVsDia: -140, citoVsJij: -60, citoVsSaqi: null },
    diaPackageResult: null,
  };

  it('Test 1: Cito 900, DIA 1040 at 0%, 10%, 20% discount', () => {
    const result = calculateSensitivity(comparisonResult, 'dia', [0, 10, 20]);

    expect(result.scenarios).toHaveLength(3);

    // 0% discount
    expect(result.scenarios[0].discountPercent).toBe(0);
    expect(result.scenarios[0].competitorTotal).toBe(1040);
    expect(result.scenarios[0].citoTotal).toBe(900);
    expect(result.scenarios[0].difference).toBe(-140); // cito - competitor

    // 10% discount on competitor
    expect(result.scenarios[1].discountPercent).toBe(10);
    expect(result.scenarios[1].competitorTotal).toBe(936); // 1040 * 0.9
    expect(result.scenarios[1].difference).toBe(-36); // 900 - 936

    // 20% discount on competitor
    expect(result.scenarios[2].discountPercent).toBe(20);
    expect(result.scenarios[2].competitorTotal).toBe(832); // 1040 * 0.8
    expect(result.scenarios[2].difference).toBe(68); // 900 - 832
  });

  it('Test 5: Per-module break-even with different costs per module', () => {
    const result = calculateSensitivity(comparisonResult, 'dia', [0, 10, 20]);

    // Per-module break-even for rekenwiskunde: cito 450, dia 520
    // breakEven = (1 - 450/520) * 100 = 13.5%
    const rwBreakEven = result.breakEven.perModule.find((m) => m.moduleId === 'rekenwiskunde');
    expect(rwBreakEven).toBeDefined();
    expect(rwBreakEven!.percent).toBeCloseTo(13.5, 1);
  });

  it('Test 6: Labels are Dutch: "Huidige prijs", "10% korting", "20% korting"', () => {
    const result = calculateSensitivity(comparisonResult, 'dia', [0, 10, 20]);

    expect(result.scenarios[0].label).toBe('Huidige prijs');
    expect(result.scenarios[1].label).toBe('10% korting');
    expect(result.scenarios[2].label).toBe('20% korting');
  });
});

describe('calculateBreakEven', () => {
  it('Test 2: Break-even when Cito cheaper: 450 vs 520 -> 13.5%', () => {
    const result = calculateBreakEven(450, 520);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(13.5, 1);
  });

  it('Test 3: Break-even when Cito more expensive -> returns null', () => {
    const result = calculateBreakEven(600, 520);
    expect(result).toBeNull();
  });

  it('Test 4: Break-even with competitorCost=0 -> returns null', () => {
    const result = calculateBreakEven(450, 0);
    expect(result).toBeNull();
  });
});
