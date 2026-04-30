import { describe, it, expect } from 'vitest';
import { getPriceStatus, type PriceRecord } from '@/models/pricing';

function makePriceRecord(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 7.98,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-03-01'),
    isPublicationPrice: true,
    ...overrides,
  };
}

describe('getPriceStatus', () => {
  it('returns "stale" for prices verified more than 6 months ago', () => {
    const now = new Date('2026-10-01');
    const record = makePriceRecord({
      verifiedAt: new Date('2026-03-01'), // 7 months before "now"
    });
    expect(getPriceStatus(record, now)).toBe('stale');
  });

  it('returns "verified" for recently verified publication prices', () => {
    const now = new Date('2026-06-01');
    const record = makePriceRecord({
      verifiedAt: new Date('2026-03-01'), // 3 months before "now"
      source: 'publication',
    });
    expect(getPriceStatus(record, now)).toBe('verified');
  });

  it('returns "manual" for manual source prices that are not stale', () => {
    const now = new Date('2026-06-01');
    const record = makePriceRecord({
      verifiedAt: new Date('2026-03-01'),
      source: 'manual',
    });
    expect(getPriceStatus(record, now)).toBe('manual');
  });

  it('returns "stale" for manual prices verified > 6 months ago (stale takes precedence)', () => {
    const now = new Date('2026-10-01');
    const record = makePriceRecord({
      verifiedAt: new Date('2026-03-01'),
      source: 'manual',
    });
    // Stale check happens first, so even manual prices can be stale
    expect(getPriceStatus(record, now)).toBe('stale');
  });

  it('returns "verified" for prices verified 5 months ago', () => {
    const now = new Date('2026-08-15');
    const record = makePriceRecord({
      verifiedAt: new Date('2026-03-20'), // ~5 months before "now"
    });
    expect(getPriceStatus(record, now)).toBe('verified');
  });
});
