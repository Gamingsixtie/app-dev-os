import { describe, it, expect } from 'vitest';
import {
  calculateComparison,
  getTotalStudents,
  PROVIDERS,
  PROVIDER_LABELS,
} from '../price-comparison';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../../lib/format';

describe('getTotalStudents', () => {
  it('sums nested Record<SchoolLevel, Record<number, number>> correctly', () => {
    const counts: Record<string, Record<number, number>> = {
      'havo': { 1: 30, 2: 25, 3: 20 },
      'vwo': { 1: 15, 2: 10 },
    };
    expect(getTotalStudents(counts)).toBe(100);
  });
});

describe('calculateComparison', () => {
  const studentCounts: Record<string, Record<number, number>> = {
    'havo': { 1: 50, 2: 50 },
  };

  it('returns correct per-module costs from provider configs for 100 students', () => {
    const result = calculateComparison(
      ['rekenwiskunde', 'nederlands'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    expect(result.modules).toHaveLength(2);

    // Check rekenwiskunde
    const rw = result.modules[0];
    expect(rw.moduleId).toBe('rekenwiskunde');
    expect(rw.providers.cito).not.toBeNull();
    expect(rw.providers.cito!.pricePerStudent).toBeGreaterThan(0);
    expect(rw.providers.cito!.totalCost).toBe(rw.providers.cito!.pricePerStudent * 100);
    expect(rw.providers.dia).not.toBeNull();
    expect(rw.providers.jij).not.toBeNull();

    // Check totals are sum of modules
    const citoSum = result.modules.reduce((sum, m) => sum + (m.providers.cito?.totalCost ?? 0), 0);
    expect(result.totals.cito).toBe(citoSum);
  });

  it('returns null ProviderCost for provider without price for module', () => {
    // sociaal-emotioneel: Cito has a price; DIA and JIJ may or may not
    const result = calculateComparison(
      ['sociaal-emotioneel'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    expect(result.modules[0].providers.cito).not.toBeNull();
    // At least one provider should be null or have 0 cost for this module
    // Verify that null providers result in null differences
    const hasNullProvider = PROVIDERS.some(
      (p) => result.modules[0].providers[p] === null,
    );
    expect(hasNullProvider || result.modules[0].providers.jij?.pricePerStudent === 0).toBe(true);
  });

  it('returns empty modules array and zero totals for 0 selected modules', () => {
    const result = calculateComparison([], studentCounts);

    expect(result.modules).toHaveLength(0);
    expect(result.totals.cito).toBe(0);
    expect(result.totals.dia).toBe(0);
    expect(result.totals.jij).toBe(0);
  });

  it('correctly sums studentCounts across all levels and years', () => {
    const multiLevelCounts: Record<string, Record<number, number>> = {
      'vmbo-b': { 1: 20, 2: 15 },
      'havo': { 1: 30, 2: 25, 3: 10 },
    };

    const result = calculateComparison(
      ['rekenwiskunde'],
      multiLevelCounts,
      { citoBundleType: 'individual' },
    );

    // 20+15+30+25+10 = 100 students
    expect(result.modules[0].providers.cito!.studentCount).toBe(100);
    expect(result.modules[0].providers.cito!.totalCost).toBe(
      result.modules[0].providers.cito!.pricePerStudent * 100,
    );
  });

  it('uses override prices instead of default amount', () => {
    const overrides = new Map([['rekenwiskunde:cito', 3.0]]);
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual', overridePrices: overrides },
    );

    expect(result.modules[0].providers.cito!.pricePerStudent).toBe(3.0);
    expect(result.modules[0].providers.cito!.totalCost).toBe(300);
  });

  it('computes correct citoVsDia and citoVsJij differences', () => {
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    // Differences = cito total - other total
    expect(result.differences.citoVsDia).toBe(result.totals.cito - result.totals.dia);
    expect(result.differences.citoVsJij).toBe(result.totals.cito - result.totals.jij);
  });

  it('returns null difference when provider has no modules at all', () => {
    // cognitieve-capaciteiten may not have prices for all providers
    const result = calculateComparison(
      ['cognitieve-capaciteiten'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    // Cito should have a price
    expect(result.modules[0].providers.cito).not.toBeNull();
    // If DIA or JIJ don't have prices, difference should be null
    if (result.modules[0].providers.dia === null) {
      expect(result.differences.citoVsDia).toBeNull();
    }
    if (result.modules[0].providers.jij === null) {
      expect(result.differences.citoVsJij).toBeNull();
    }
  });
});

describe('formatCurrency', () => {
  it('formats 1234.50 as Dutch locale currency with 2 decimals', () => {
    const formatted = formatCurrency(1234.5);
    // nl-NL: "€ 1.234,50" (may have non-breaking space)
    expect(formatted).toMatch(/€\s*1\.234,50/);
  });
});

describe('formatCurrencyCompact', () => {
  it('formats 1234 as Dutch locale currency without decimals', () => {
    const formatted = formatCurrencyCompact(1234);
    expect(formatted).toMatch(/€\s*1\.234/);
    expect(formatted).not.toMatch(/,/); // no decimal separator
  });
});

describe('formatNumber', () => {
  it('formats numbers with nl-NL locale (dot as thousands separator)', () => {
    expect(formatNumber(1234567)).toMatch(/1\.234\.567/);
  });
});

describe('calculateComparison (calculator features)', () => {
  const studentCounts: Record<string, Record<number, number>> = {
    'havo': { 1: 400, 2: 400 },
  };

  it('breakdown is present on each non-null provider', () => {
    const result = calculateComparison(
      ['rekenwiskunde', 'nederlands'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

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

  it('diaPackageResult is returned in ComparisonResult', () => {
    const result = calculateComparison(
      ['rekenwiskunde', 'nederlands', 'engels'],
      studentCounts,
      { citoBundleType: 'individual' },
    );
    // diaPackageResult should be present (null or populated depending on package optimization)
    expect('diaPackageResult' in result).toBe(true);
  });

  it('differences are correctly computed with calculator-based totals', () => {
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    // Both DIA and JIJ have prices for rekenwiskunde
    expect(result.differences.citoVsDia).not.toBeNull();
    expect(result.differences.citoVsJij).not.toBeNull();
    // citoVsDia = cito total - dia total
    expect(result.differences.citoVsDia).toBe(
      result.totals.cito - result.totals.dia,
    );
    expect(result.differences.citoVsJij).toBe(
      result.totals.cito - result.totals.jij,
    );
  });

  it('uses override prices when provided', () => {
    const overrides = new Map([['rekenwiskunde:cito', 5.00]]);
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual', overridePrices: overrides },
    );

    expect(result.modules[0].providers.cito!.pricePerStudent).toBe(5.00);
  });

  it('returns empty modules array for 0 selected modules with new signature', () => {
    const result = calculateComparison([], studentCounts, {});
    expect(result.modules).toHaveLength(0);
    expect(result.totals.cito).toBe(0);
  });
});

describe('exports', () => {
  it('exports PROVIDERS array with all three provider keys', () => {
    expect(PROVIDERS).toEqual(['cito', 'dia', 'jij', 'saqi']);
  });

  it('exports PROVIDER_LABELS with Dutch display names', () => {
    expect(PROVIDER_LABELS.cito).toBe('Cito');
    expect(PROVIDER_LABELS.dia).toBe('DIA');
    expect(PROVIDER_LABELS.jij).toBe('JIJ');
  });
});
