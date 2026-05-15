import { describe, it, expect } from 'vitest';
import { DEFAULT_PRICES } from '../../default-prices';

/**
 * Migration parity test: ensures all original DEFAULT_PRICES records survive restructuring,
 * plus validates new module prices added in Plan 02.
 * Guards against accidental price data corruption during refactoring.
 */
describe('DEFAULT_PRICES migration parity', () => {
  // Original 16 records (must remain bit-identical after restructuring)
  const originalPrices: Array<{ moduleId: string; provider: string; amountPerStudent: number }> = [
    // Rekenwiskunde
    { moduleId: 'rekenwiskunde', provider: 'cito', amountPerStudent: 7.98 },
    { moduleId: 'rekenwiskunde', provider: 'dia', amountPerStudent: 3.36 },
    { moduleId: 'rekenwiskunde', provider: 'jij', amountPerStudent: 9.34 },
    // Nederlands
    { moduleId: 'nederlands', provider: 'cito', amountPerStudent: 7.98 },
    { moduleId: 'nederlands', provider: 'dia', amountPerStudent: 3.36 },
    { moduleId: 'nederlands', provider: 'jij', amountPerStudent: 9.34 },
    // Engels
    { moduleId: 'engels', provider: 'cito', amountPerStudent: 7.98 },
    { moduleId: 'engels', provider: 'dia', amountPerStudent: 5.84 },
    { moduleId: 'engels', provider: 'jij', amountPerStudent: 9.34 },
    // Taalverzorging
    { moduleId: 'taalverzorging', provider: 'cito', amountPerStudent: 5.00 },
    { moduleId: 'taalverzorging', provider: 'dia', amountPerStudent: 3.36 },
    // Sociaal-emotioneel
    { moduleId: 'sociaal-emotioneel', provider: 'cito', amountPerStudent: 3.00 },
    { moduleId: 'sociaal-emotioneel', provider: 'saqi', amountPerStudent: 3.50 },
    { moduleId: 'sociaal-emotioneel', provider: 'jij', amountPerStudent: 0 },
    // Cognitieve capaciteiten
    { moduleId: 'cognitieve-capaciteiten', provider: 'cito', amountPerStudent: 19.90 },
    { moduleId: 'cognitieve-capaciteiten', provider: 'dia', amountPerStudent: 9.75 },
  ];

  // New module prices added in Plan 02
  const newPrices: Array<{ moduleId: string; provider: string; amountPerStudent: number }> = [
    { moduleId: 'leer-werkhouding', provider: 'cito', amountPerStudent: 3.00 },
    { moduleId: 'frans', provider: 'jij', amountPerStudent: 9.34 },
    { moduleId: 'duits', provider: 'jij', amountPerStudent: 9.34 },
    { moduleId: 'spaans', provider: 'jij', amountPerStudent: 9.34 },
  ];

  // Phase 27 R6 — Cito-only Extra modules (placeholder tarieven, owner vult in).
  const phase27Prices: Array<{ moduleId: string; provider: string; amountPerStudent: number }> = [
    { moduleId: 'burgerschap', provider: 'cito', amountPerStudent: 0 },
    { moduleId: 'digitale-geletterdheid', provider: 'cito', amountPerStudent: 0 },
  ];

  const allPrices = [...originalPrices, ...newPrices, ...phase27Prices];

  it('has exactly 22 price records (16 original + 4 Plan 02 + 2 Phase 27 R6)', () => {
    expect(DEFAULT_PRICES).toHaveLength(22);
  });

  it('contains all 16 original price records with exact values', () => {
    for (const expected of originalPrices) {
      const actual = DEFAULT_PRICES.find(
        (p) => p.moduleId === expected.moduleId && p.provider === expected.provider,
      );
      expect(actual, `Missing original: ${expected.moduleId}/${expected.provider}`).toBeDefined();
      expect(actual!.amountPerStudent).toBe(expected.amountPerStudent);
    }
  });

  for (const expected of allPrices) {
    it(`${expected.moduleId}/${expected.provider} = ${expected.amountPerStudent}`, () => {
      const actual = DEFAULT_PRICES.find(
        (p) => p.moduleId === expected.moduleId && p.provider === expected.provider,
      );
      expect(actual, `Missing price record: ${expected.moduleId}/${expected.provider}`).toBeDefined();
      expect(actual!.amountPerStudent).toBe(expected.amountPerStudent);
    });
  }
});
