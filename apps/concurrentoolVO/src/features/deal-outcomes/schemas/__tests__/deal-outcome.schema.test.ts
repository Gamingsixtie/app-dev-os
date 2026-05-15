/**
 * Phase 28 — Plan 01 (Wave 0) — Deal-outcome schema unit tests.
 *
 * Must be GREEN at end of Plan 01: this plan ships the schemas being tested.
 */
import { describe, test, expect } from 'vitest';

import {
  dealStatusEnum,
  lostDealFormSchema,
  winDealFormSchema,
} from '../deal-outcome.schema';

describe('Phase 28 — dealStatusEnum (R1)', () => {
  test('R1: accepts all 5 lifecycle values', () => {
    expect(() => dealStatusEnum.parse('open')).not.toThrow();
    expect(() => dealStatusEnum.parse('in_negotiation')).not.toThrow();
    expect(() => dealStatusEnum.parse('won')).not.toThrow();
    expect(() => dealStatusEnum.parse('lost')).not.toThrow();
    expect(() => dealStatusEnum.parse('archived')).not.toThrow();
  });

  test('R1: rejects unknown status', () => {
    expect(() => dealStatusEnum.parse('gewonnen')).toThrow();
  });
});

describe('Phase 28 — winDealFormSchema (R2)', () => {
  test('R2: rejects future decidedAt with Dutch error message', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24); // +1 day
    const result = winDealFormSchema.safeParse({ decidedAt: future });
    expect(result.success).toBe(false);
    if (!result.success) {
      // The Dutch error message must surface on `decidedAt`.
      const msg = result.error.issues.find((i) => i.path[0] === 'decidedAt')?.message;
      expect(msg).toMatch(/toekomst/i);
    }
  });

  test('R2: accepts past decidedAt', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const result = winDealFormSchema.safeParse({ decidedAt: past });
    expect(result.success).toBe(true);
  });
});

describe('Phase 28 — lostDealFormSchema (R1)', () => {
  test('R1: requires reason (rejects empty string)', () => {
    const result = lostDealFormSchema.safeParse({
      competitorProvider: 'dia',
      reason: '',
      reasonCategory: 'prijs',
    });
    expect(result.success).toBe(false);
  });

  test('R1: requires reasonCategory', () => {
    const result = lostDealFormSchema.safeParse({
      competitorProvider: 'dia',
      reason: 'Te duur',
      // reasonCategory missing
    });
    expect(result.success).toBe(false);
  });

  test('R1: requires competitorName when competitorProvider is "overig"', () => {
    const result = lostDealFormSchema.safeParse({
      competitorProvider: 'overig',
      reason: 'Eigen oplossing',
      reasonCategory: 'voorkeur',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues.find((i) => i.path[0] === 'competitorName')
        ?.message;
      expect(msg).toMatch(/concurrent/i);
    }
  });

  test('R1: accepts valid loss with named competitor', () => {
    const result = lostDealFormSchema.safeParse({
      competitorProvider: 'overig',
      competitorName: 'Schoolware BV',
      reason: 'Bestaande partner',
      reasonCategory: 'voorkeur',
    });
    expect(result.success).toBe(true);
  });
});
