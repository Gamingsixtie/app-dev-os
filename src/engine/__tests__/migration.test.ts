import { describe, it, expect } from 'vitest';
import { calculateMigration } from '../migration';
import type { CitoMigrationPriceRecord } from '../../data/cito-migration-prices';

const mockMigrationPrices: CitoMigrationPriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    oldPricePerStudent: 4.5,
    newPricePerStudent: 4.0,
    verifiedAt: new Date('2026-01-01'),
  },
  {
    moduleId: 'nederlands',
    oldPricePerStudent: 4.5,
    newPricePerStudent: 4.5,
    verifiedAt: new Date('2026-01-01'),
  },
];

const studentCounts = { havo: { 1: 100 } }; // 100 students

describe('calculateMigration', () => {
  it('returns empty result for empty selectedModules', () => {
    const result = calculateMigration([], studentCounts, mockMigrationPrices, {}, 50);
    expect(result.modules).toHaveLength(0);
    expect(result.totalOldCost).toBe(0);
    expect(result.totalNewCost).toBe(0);
    expect(result.financialDifference).toBe(0);
  });

  it('calculates module costs and difference correctly', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    const mod = result.modules[0];

    // old: 4.5 × 100 = 450, new: 4.0 × 100 = 400
    expect(mod.oldTotalCost).toBe(450);
    expect(mod.newTotalCost).toBe(400);
    expect(mod.annualDifference).toBe(50); // new is cheaper by €50
  });

  it('skips modules without migration price record', () => {
    const result = calculateMigration(
      ['cognitieve-capaciteiten'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    expect(result.modules).toHaveLength(0);
  });

  it('uses TIME_SAVING_TASKS defaults when no overrides', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );

    // Default hours: rechten=10, resetten=12, inloggen=8, planning=10, koppeling=8 → total=48
    expect(result.totalTimeSavingsHours).toBe(48);
    expect(result.totalTimeSavingsValue).toBe(48 * 50); // 2400
  });

  it('applies time saving overrides', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      { rechten: 20, resetten: 5 },
      50,
    );

    // rechten=20 (override), resetten=5 (override), inloggen=8, planning=10, koppeling=8 → total=51
    expect(result.totalTimeSavingsHours).toBe(51);
  });

  it('calculates totalAnnualValue as financial + time savings', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    // financialDifference: 450 - 400 = 50
    // timeSavingsValue: 48 × 50 = 2400
    expect(result.totalAnnualValue).toBe(50 + 2400);
  });

  it('generates multi-year projection for 1 and 3 years', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );

    const totalAnnual = result.totalAnnualValue;
    expect(result.multiYearProjection).toEqual([
      { year: 1, cumulativeSavings: totalAnnual },
      { year: 3, cumulativeSavings: totalAnnual * 3 },
    ]);
  });

  it('handles null hourlyRate (unknown)', () => {
    const result = calculateMigration(
      ['rekenwiskunde'],
      studentCounts,
      mockMigrationPrices,
      {},
      null,
    );

    expect(result.totalTimeSavingsHours).toBe(48);
    expect(result.totalTimeSavingsValue).toBe(0);
    expect(result.totalAnnualValue).toBe(result.financialDifference);
  });

  it('handles zero annualDifference when prices are equal', () => {
    const result = calculateMigration(
      ['nederlands'],
      studentCounts,
      mockMigrationPrices,
      {},
      50,
    );
    // old = new = 4.5 × 100 = 450
    expect(result.financialDifference).toBe(0);
    expect(result.modules[0].annualDifference).toBe(0);
  });

  describe('null time saving overrides', () => {
    it('excludes tasks with null override from totals', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        { rechten: null },
        50,
      );
      // rechten=null (excluded), resetten=12, inloggen=8, planning=10, koppeling=8 → total=38
      expect(result.totalTimeSavingsHours).toBe(38);
      expect(result.totalTimeSavingsValue).toBe(38 * 50);
      // The null task should have hoursPerYear=null and valuePerYear=0
      const rechtenTask = result.timeSavings.find((t) => t.taskId === 'rechten');
      expect(rechtenTask?.hoursPerYear).toBeNull();
      expect(rechtenTask?.valuePerYear).toBe(0);
    });

    it('handles mix of null and number overrides', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        { rechten: null, resetten: 5, planning: null },
        50,
      );
      // rechten=null, resetten=5, inloggen=8 (default), planning=null, koppeling=8 (default) → total=21
      expect(result.totalTimeSavingsHours).toBe(21);
    });

    it('returns 0 time savings when all tasks are null', () => {
      const allNull: Record<string, number | null> = {
        rechten: null,
        resetten: null,
        inloggen: null,
        planning: null,
        koppeling: null,
      };
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        allNull,
        50,
      );
      expect(result.totalTimeSavingsHours).toBe(0);
      expect(result.totalTimeSavingsValue).toBe(0);
    });

    it('uses defaults when overrides object is empty (backward compat)', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
      );
      expect(result.totalTimeSavingsHours).toBe(48);
    });
  });

  describe('breakEvenMonth', () => {
    it('calculates breakEvenMonth with switchingCosts and positive totalAnnualValue', () => {
      // rekenwiskunde: financialDifference = 50, timeSavingsValue = 48 * 50 = 2400
      // totalAnnualValue = 2450
      // breakEvenMonth = ceil(5000 / 2450 * 12) = ceil(24.49) = 25
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
        5000,
      );
      expect(result.switchingCosts).toBe(5000);
      expect(result.breakEvenMonth).toBe(Math.ceil((5000 / 2450) * 12));
    });

    it('returns breakEvenMonth=0 when switchingCosts is 0', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
        0,
      );
      expect(result.switchingCosts).toBe(0);
      expect(result.breakEvenMonth).toBe(0);
    });

    it('returns breakEvenMonth=null when totalAnnualValue is 0', () => {
      // Use nederlands (same old/new price = 4.5) with all time saving overrides set to 0
      const zeroTimeOverrides: Record<string, number> = {
        rechten: 0,
        resetten: 0,
        inloggen: 0,
        planning: 0,
        koppeling: 0,
      };
      const result = calculateMigration(
        ['nederlands'],
        studentCounts,
        mockMigrationPrices,
        zeroTimeOverrides,
        50,
        5000,
      );
      // financialDifference = 0 (same prices), timeSavingsValue = 0
      expect(result.totalAnnualValue).toBe(0);
      expect(result.breakEvenMonth).toBeNull();
    });

    it('returns breakEvenMonth=null when totalAnnualValue is negative', () => {
      // Create a scenario where new platform is MORE expensive
      // Need high hourly cost difference: old=4, new=30, students=100 -> diff = -2600
      // timeSavings at hourlyRate=1: 48*1=48 -> totalAnnualValue = -2600+48 = -2552
      const veryExpensivePrices: CitoMigrationPriceRecord[] = [
        {
          moduleId: 'rekenwiskunde',
          oldPricePerStudent: 4.0,
          newPricePerStudent: 30.0,
          verifiedAt: new Date('2026-01-01'),
        },
      ];
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        veryExpensivePrices,
        {},
        1, // low hourly rate to keep timeSavingsValue low
        5000,
      );
      expect(result.totalAnnualValue).toBeLessThan(0);
      expect(result.breakEvenMonth).toBeNull();
    });

    it('includes switchingCosts field in result', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
        3000,
      );
      expect(result.switchingCosts).toBe(3000);
    });

    it('multiYearProjection cumulativeSavings remain unchanged (backward compatible)', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
        5000,
      );
      const totalAnnual = result.totalAnnualValue;
      expect(result.multiYearProjection).toEqual([
        { year: 1, cumulativeSavings: totalAnnual },
        { year: 3, cumulativeSavings: totalAnnual * 3 },
      ]);
    });

    it('defaults switchingCosts to 0 when not provided (backward compatible)', () => {
      const result = calculateMigration(
        ['rekenwiskunde'],
        studentCounts,
        mockMigrationPrices,
        {},
        50,
      );
      expect(result.switchingCosts).toBe(0);
      expect(result.breakEvenMonth).toBe(0);
    });
  });
});
