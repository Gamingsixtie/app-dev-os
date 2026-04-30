import { describe, it, expect } from 'vitest';
import {
  detectDiscountPatterns,
  type SchoolPriceInput,
  type PublicationPriceInput,
} from '../discount-patterns';

// Helper to create school price inputs
function schoolPrice(
  overrides: Partial<SchoolPriceInput> & { schoolId: string; amount: number },
): SchoolPriceInput {
  return {
    moduleId: 'mod-a',
    provider: 'dia',
    source: 'document',
    ...overrides,
  };
}

// Helper to create publication price inputs
function pubPrice(
  overrides: Partial<PublicationPriceInput> = {},
): PublicationPriceInput {
  return {
    moduleId: 'mod-a',
    provider: 'dia',
    amountPerStudent: 10,
    ...overrides,
  };
}

describe('detectDiscountPatterns', () => {
  it('returns empty array when fewer than 3 schools have prices for same provider+module', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),
      schoolPrice({ schoolId: 's2', amount: 8.5 }),
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice()];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toEqual([]);
  });

  it('returns DiscountPattern when 3+ schools have comparable discounts', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),
      schoolPrice({ schoolId: 's2', amount: 8.5 }),
      schoolPrice({ schoolId: 's3', amount: 7.5 }),
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice({ amountPerStudent: 10 })];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe('dia');
    expect(result[0].moduleId).toBe('mod-a');
    expect(result[0].schoolCount).toBe(3);
  });

  it('only includes prices with source document or verified (not manual or ai-lookup)', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8, source: 'document' }),
      schoolPrice({ schoolId: 's2', amount: 8.5, source: 'verified' }),
      schoolPrice({ schoolId: 's3', amount: 7.5, source: 'manual' }),
      schoolPrice({ schoolId: 's4', amount: 8, source: 'ai-lookup' }),
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice()];

    // Only 2 valid sources (document + verified), below threshold of 3
    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toEqual([]);
  });

  it('correctly calculates averageDiscount, minDiscount, maxDiscount, schoolCount', () => {
    // Publication price = 10, school prices = 8, 7, 9
    // Discounts = 20%, 30%, 10%
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),
      schoolPrice({ schoolId: 's2', amount: 7 }),
      schoolPrice({ schoolId: 's3', amount: 9 }),
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice({ amountPerStudent: 10 })];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toHaveLength(1);

    const pattern = result[0];
    expect(pattern.schoolCount).toBe(3);
    expect(pattern.minDiscount).toBe(10);
    expect(pattern.maxDiscount).toBe(30);
    expect(pattern.averageDiscount).toBe(20); // (20 + 30 + 10) / 3
    expect(pattern.marketPrice).toBe(8); // (8 + 7 + 9) / 3
  });

  it('returns patterns for multiple provider+module combinations independently', () => {
    const schoolPrices: SchoolPriceInput[] = [
      // DIA mod-a
      schoolPrice({ schoolId: 's1', amount: 8, provider: 'dia', moduleId: 'mod-a' }),
      schoolPrice({ schoolId: 's2', amount: 8.5, provider: 'dia', moduleId: 'mod-a' }),
      schoolPrice({ schoolId: 's3', amount: 7.5, provider: 'dia', moduleId: 'mod-a' }),
      // JIJ mod-b
      schoolPrice({ schoolId: 's1', amount: 12, provider: 'jij', moduleId: 'mod-b' }),
      schoolPrice({ schoolId: 's2', amount: 11, provider: 'jij', moduleId: 'mod-b' }),
      schoolPrice({ schoolId: 's3', amount: 13, provider: 'jij', moduleId: 'mod-b' }),
    ];
    const publicationPrices: PublicationPriceInput[] = [
      pubPrice({ moduleId: 'mod-a', provider: 'dia', amountPerStudent: 10 }),
      pubPrice({ moduleId: 'mod-b', provider: 'jij', amountPerStudent: 15 }),
    ];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toHaveLength(2);

    const diaPattern = result.find((p) => p.provider === 'dia');
    const jijPattern = result.find((p) => p.provider === 'jij');
    expect(diaPattern).toBeDefined();
    expect(jijPattern).toBeDefined();
    expect(diaPattern!.moduleId).toBe('mod-a');
    expect(jijPattern!.moduleId).toBe('mod-b');
  });

  it('returns empty array when publication price is 0 (avoids division by zero)', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),
      schoolPrice({ schoolId: 's2', amount: 8.5 }),
      schoolPrice({ schoolId: 's3', amount: 7.5 }),
    ];
    const publicationPrices: PublicationPriceInput[] = [
      pubPrice({ amountPerStudent: 0 }),
    ];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toEqual([]);
  });

  it('respects custom minSchools option', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),
      schoolPrice({ schoolId: 's2', amount: 8.5 }),
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice()];

    // With minSchools = 2, should detect pattern
    const result = detectDiscountPatterns(schoolPrices, publicationPrices, { minSchools: 2 });
    expect(result).toHaveLength(1);
  });

  it('filters out negative discounts (school pays more than publication)', () => {
    const schoolPrices: SchoolPriceInput[] = [
      schoolPrice({ schoolId: 's1', amount: 8 }),   // 20% discount
      schoolPrice({ schoolId: 's2', amount: 7.5 }), // 25% discount
      schoolPrice({ schoolId: 's3', amount: 12 }),   // negative discount (pays more)
      schoolPrice({ schoolId: 's4', amount: 7 }),    // 30% discount
    ];
    const publicationPrices: PublicationPriceInput[] = [pubPrice({ amountPerStudent: 10 })];

    const result = detectDiscountPatterns(schoolPrices, publicationPrices);
    expect(result).toHaveLength(1);
    // s3 filtered out, only 3 schools with positive discounts
    expect(result[0].schoolCount).toBe(3);
  });
});
