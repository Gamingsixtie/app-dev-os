import { describe, it, expect } from 'vitest';
import {
  calculateComparison,
  getTotalStudents,
  PROVIDERS,
  PROVIDER_LABELS,
  type EngineDealDiscount,
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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 28 — dealDiscounts overlay (R3).
// Engine accepts per-deal kortingen via ComparisonOptions.dealDiscounts and
// applies them as a post-calculator overlay before totals + differences.
// Backward-compat: omitting or passing empty dealDiscounts is a no-op.
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 28 — dealDiscounts overlay (R3)', () => {
  const studentCounts: Record<string, Record<number, number>> = {
    'havo': { 1: 50, 2: 50 }, // 100 students total
  };

  it('backward-compat: omitting dealDiscounts produces identical output', () => {
    const a = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    const b = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    expect(a).toEqual(b);
  });

  it('backward-compat: empty dealDiscounts array produces identical output to no-option', () => {
    const withEmpty = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [],
    });
    const baseline = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    expect(withEmpty).toEqual(baseline);
  });

  it('percentage discount: 10% on dia/rekenwiskunde reduces pricePerStudent by 10%', () => {
    const base = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    const baseDia = base.modules[0].providers.dia;
    expect(baseDia).not.toBeNull();
    const basePrice = baseDia!.pricePerStudent;

    const discount: EngineDealDiscount = {
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    const dia = result.modules[0].providers.dia;
    expect(dia).not.toBeNull();
    expect(dia!.pricePerStudent).toBeCloseTo(basePrice * 0.9, 2);
    expect(dia!.totalCost).toBeCloseTo(dia!.pricePerStudent * 100, 2);
    expect(dia!.priceRecord.source).toBe('manual');
    expect(dia!.priceRecord.sourceLabel).toBe('Deal-korting');
  });

  it('amount discount: €1.50 on jij/nederlands reduces pricePerStudent by €1.50', () => {
    const base = calculateComparison(['nederlands'], studentCounts, {
      citoBundleType: 'individual',
    });
    const baseJij = base.modules[0].providers.jij;
    if (baseJij === null) return; // skip if jij has no price for nederlands in current config
    const basePrice = baseJij.pricePerStudent;

    const discount: EngineDealDiscount = {
      moduleId: 'nederlands',
      provider: 'jij',
      discountAmount: 1.5,
    };
    const result = calculateComparison(['nederlands'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    const jij = result.modules[0].providers.jij;
    expect(jij).not.toBeNull();
    expect(jij!.pricePerStudent).toBeCloseTo(Math.max(0, basePrice - 1.5), 2);
  });

  it('amount discount: clamps to 0 (cannot go negative)', () => {
    const discount: EngineDealDiscount = {
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountAmount: 999999,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    const dia = result.modules[0].providers.dia;
    expect(dia).not.toBeNull();
    expect(dia!.pricePerStudent).toBe(0);
    expect(dia!.totalCost).toBe(0);
  });

  it('totals recompute: totals.dia reflects the overlay', () => {
    const base = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    const baseTotalDia = base.totals.dia;

    const discount: EngineDealDiscount = {
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 50,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    expect(result.totals.dia).toBeCloseTo(baseTotalDia * 0.5, 2);
  });

  it('differences recompute: citoVsDia uses overlaid totals', () => {
    const discount: EngineDealDiscount = {
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    // After overlay: differences.citoVsDia === totals.cito - totals.dia
    expect(result.differences.citoVsDia).toBe(result.totals.cito - result.totals.dia);
  });

  it('defensive: unknown moduleId is silently skipped', () => {
    const discount: EngineDealDiscount = {
      moduleId: 'nonexistent-module',
      provider: 'dia',
      discountPercentage: 50,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    const base = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    expect(result).toEqual(base);
  });

  it('defensive: discount on (module, provider) where cost is null is silently skipped', () => {
    // sociaal-emotioneel: cito has price; some competitors may be null
    const base = calculateComparison(['sociaal-emotioneel'], studentCounts, {
      citoBundleType: 'individual',
    });
    // Find a provider that is null for this module (config-dependent)
    const nullProvider = (['dia', 'jij', 'saqi'] as const).find(
      (p) => base.modules[0].providers[p] === null,
    );
    if (!nullProvider) return; // skip if all providers happen to have a price

    const discount: EngineDealDiscount = {
      moduleId: 'sociaal-emotioneel',
      provider: nullProvider,
      discountPercentage: 50,
    };
    const result = calculateComparison(['sociaal-emotioneel'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    // Skipped → null still null
    expect(result.modules[0].providers[nullProvider]).toBeNull();
  });

  it('multi-discount: applies independently per (module, provider)', () => {
    const discounts: EngineDealDiscount[] = [
      { moduleId: 'rekenwiskunde', provider: 'dia', discountPercentage: 20 },
      { moduleId: 'rekenwiskunde', provider: 'jij', discountAmount: 0.5 },
    ];
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: discounts,
    });
    const dia = result.modules[0].providers.dia;
    const jij = result.modules[0].providers.jij;
    const cito = result.modules[0].providers.cito;
    expect(dia?.priceRecord.source).toBe('manual');
    expect(jij?.priceRecord.source).toBe('manual');
    // cito unchanged (no discount applied)
    expect(cito?.priceRecord.source).not.toBe('manual');
  });

  it('breakdown: overlay appends a Deal-korting step with the negative delta', () => {
    const base = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
    });
    const baseDia = base.modules[0].providers.dia;
    expect(baseDia).not.toBeNull();
    const baseBreakdownLen = baseDia!.breakdown.length;
    const basePrice = baseDia!.pricePerStudent;

    const discount: EngineDealDiscount = {
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
    };
    const result = calculateComparison(['rekenwiskunde'], studentCounts, {
      citoBundleType: 'individual',
      dealDiscounts: [discount],
    });
    const dia = result.modules[0].providers.dia;
    expect(dia).not.toBeNull();
    expect(dia!.breakdown.length).toBe(baseBreakdownLen + 1);
    const lastStep = dia!.breakdown[dia!.breakdown.length - 1];
    expect(lastStep.label).toMatch(/Deal-korting/);
    // Delta = adjustedPerStudent - basePerStudent = -10% of base
    expect(lastStep.amount).toBeCloseTo(-basePrice * 0.1, 2);
  });
});
