/**
 * Phase 28 — Plan 01 (Wave 0) — Deal-discount XOR schema unit tests.
 *
 * Must be GREEN at end of Plan 01.
 */
import { describe, test, expect } from 'vitest';

import { dealDiscountSchema } from '../deal-discount.schema';

describe('Phase 28 — dealDiscountSchema XOR (R3)', () => {
  test('R3: only discountPercentage passes', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
    });
    expect(result.success).toBe(true);
  });

  test('R3: only discountAmount passes', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountAmount: 5,
    });
    expect(result.success).toBe(true);
  });

  test('R3: both fields set fails with "niet allebei"', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 10,
      discountAmount: 5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toMatch(/niet allebei/i);
    }
  });

  test('R3: neither field set fails XOR refine', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
    });
    expect(result.success).toBe(false);
  });

  test('R3: discountPercentage range — 0 fails (must be >= 0.01)', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 0,
    });
    expect(result.success).toBe(false);
  });

  test('R3: discountPercentage range — 101 fails (must be <= 100)', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountPercentage: 101,
    });
    expect(result.success).toBe(false);
  });

  test('R3: discountAmount must be non-negative', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountAmount: -1,
    });
    expect(result.success).toBe(false);
  });

  test('R3: discountAmount of 0 is accepted', () => {
    const result = dealDiscountSchema.safeParse({
      moduleId: 'rekenwiskunde',
      provider: 'dia',
      discountAmount: 0,
    });
    expect(result.success).toBe(true);
  });
});
