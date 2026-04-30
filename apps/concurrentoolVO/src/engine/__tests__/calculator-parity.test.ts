import { describe, it, expect } from 'vitest';
import { calculateComparison } from '../price-comparison';

/**
 * Regression tests: verify specific known outputs for specific inputs.
 * These were originally parity tests comparing old pipeline vs new calculators.
 * Now that the legacy function is removed, they serve as regression guards
 * ensuring the calculator-based engine produces stable, expected results.
 */

const MODULES = ['rekenwiskunde', 'nederlands', 'engels'];

function makeStudentCounts(total: number): Partial<Record<string, Record<number, number>>> {
  if (total === 0) return {};
  return { havo: { 3: total } };
}

describe('Calculator regression tests: known outputs for known inputs', () => {
  describe('school size: 100 students', () => {
    it('produces expected totals for rekenwiskunde, nederlands, engels', () => {
      const counts = makeStudentCounts(100);
      const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

      // Cito: individual pricing, no bundle discount
      expect(result.totals.cito).toBeGreaterThan(0);
      // DIA: no volume discount at 100 students
      expect(result.totals.dia).toBeGreaterThan(0);
      // JIJ: tier-based pricing at 100 students
      expect(result.totals.jij).toBeGreaterThan(0);

      // Snapshot the exact values for regression detection
      expect(result.totals.cito).toMatchSnapshot();
      expect(result.totals.dia).toMatchSnapshot();
      expect(result.totals.jij).toMatchSnapshot();
    });
  });

  describe('school size: 500 students', () => {
    it('produces expected totals for rekenwiskunde, nederlands, engels', () => {
      const counts = makeStudentCounts(500);
      const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

      // DIA gets 5% volume discount at 500+ students
      expect(result.totals.cito).toMatchSnapshot();
      expect(result.totals.dia).toMatchSnapshot();
      expect(result.totals.jij).toMatchSnapshot();
    });
  });

  describe('school size: 800 students', () => {
    it('produces expected totals for rekenwiskunde, nederlands, engels', () => {
      const counts = makeStudentCounts(800);
      const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

      expect(result.totals.cito).toMatchSnapshot();
      expect(result.totals.dia).toMatchSnapshot();
      expect(result.totals.jij).toMatchSnapshot();
    });

    it('produces expected per-module prices', () => {
      const counts = makeStudentCounts(800);
      const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

      for (const mod of result.modules) {
        for (const provider of ['cito', 'dia', 'jij'] as const) {
          const cost = mod.providers[provider];
          if (cost !== null) {
            expect(cost.pricePerStudent).toMatchSnapshot(`${mod.moduleId}:${provider}:pricePerStudent`);
            expect(cost.totalCost).toMatchSnapshot(`${mod.moduleId}:${provider}:totalCost`);
          }
        }
      }
    });
  });

  describe('school size: 1200 students', () => {
    it('produces expected totals for rekenwiskunde, nederlands, engels', () => {
      const counts = makeStudentCounts(1200);
      const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

      // DIA gets 10% volume discount at 1000+ students
      expect(result.totals.cito).toMatchSnapshot();
      expect(result.totals.dia).toMatchSnapshot();
      expect(result.totals.jij).toMatchSnapshot();
    });
  });

  it('result has breakdown field on each non-null ProviderCost', () => {
    const counts = makeStudentCounts(800);
    const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

    for (const mod of result.modules) {
      for (const provider of ['cito', 'dia', 'jij'] as const) {
        const cost = mod.providers[provider];
        if (cost !== null) {
          expect(cost.breakdown).toBeDefined();
          expect(cost.breakdown.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('result maintains all existing fields (pricePerStudent, totalCost, studentCount, priceRecord)', () => {
    const counts = makeStudentCounts(800);
    const result = calculateComparison(MODULES, counts, { citoBundleType: 'individual' });

    for (const mod of result.modules) {
      for (const provider of ['cito', 'dia', 'jij'] as const) {
        const cost = mod.providers[provider];
        if (cost !== null) {
          expect(typeof cost.pricePerStudent).toBe('number');
          expect(typeof cost.totalCost).toBe('number');
          expect(typeof cost.studentCount).toBe('number');
          expect(cost.priceRecord).toBeDefined();
          expect(cost.priceRecord.moduleId).toBe(mod.moduleId);
          expect(cost.priceRecord.provider).toBe(provider);
        }
      }
    }
  });
});
