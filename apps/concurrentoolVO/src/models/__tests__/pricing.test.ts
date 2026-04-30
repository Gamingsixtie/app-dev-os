import { describe, it, expect } from 'vitest';
import {
  getPriceStatus,
  getPriceStalenessLabel,
  type PriceRecord,
} from '../pricing';

function makePriceRecord(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 5.0,
    source: 'publication',
    sourceLabel: 'Publicatielijst 2025-2026',
    verifiedAt: new Date(),
    isPublicationPrice: true,
    ...overrides,
  };
}

describe('getPriceStatus', () => {
  it('returns "verified" for publication price verified today', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'publication',
      verifiedAt: new Date('2026-03-20'),
    });
    expect(getPriceStatus(record, now)).toBe('verified');
  });

  it('returns "stale" for price verified 7 months ago', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'publication',
      verifiedAt: new Date('2025-08-01'),
    });
    expect(getPriceStatus(record, now)).toBe('stale');
  });

  it('returns "manual" for manually entered price verified today', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'manual',
      verifiedAt: new Date('2026-03-20'),
    });
    expect(getPriceStatus(record, now)).toBe('manual');
  });
});

describe('getPriceStalenessLabel', () => {
  it('returns "Geverifieerd" for verified status', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'publication',
      verifiedAt: new Date('2026-03-20'),
    });
    expect(getPriceStalenessLabel(record, now)).toBe('Geverifieerd');
  });

  it('returns "Mogelijk verouderd" for stale status', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'publication',
      verifiedAt: new Date('2025-08-01'),
    });
    expect(getPriceStalenessLabel(record, now)).toBe('Mogelijk verouderd');
  });

  it('returns "Handmatig" for manual status', () => {
    const now = new Date('2026-03-20');
    const record = makePriceRecord({
      source: 'manual',
      verifiedAt: new Date('2026-03-20'),
    });
    expect(getPriceStalenessLabel(record, now)).toBe('Handmatig');
  });
});
