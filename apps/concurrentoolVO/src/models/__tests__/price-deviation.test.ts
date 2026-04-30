import { describe, it, expect } from 'vitest';
import {
  checkPriceDeviation,
  getSchoolPriceStatus,
} from '../pricing';
import type { SchoolPriceEntry } from '@/db/types';

// Helper to create a minimal SchoolPriceEntry for testing
function makeEntry(overrides: Partial<SchoolPriceEntry> = {}): SchoolPriceEntry {
  return {
    id: 'test-id',
    schoolId: 'school-1',
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amount: 4.5,
    priceType: 'publication',
    discountPercentage: 0,
    source: 'publication',
    verifiedAt: new Date().toISOString(),
    note: '',
    isActive: true,
    activationReason: null,
    activatedAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('checkPriceDeviation', () => {
  it('returns no deviation when amount matches publication price', () => {
    const result = checkPriceDeviation('rekenwiskunde', 'cito', 7.98);
    expect(result).toEqual({ hasDeviation: false, publicationPrice: 7.98, percentDiff: 0 });
  });

  it('returns deviation when amount >50% above publication price', () => {
    const result = checkPriceDeviation('rekenwiskunde', 'cito', 12.0);
    expect(result.hasDeviation).toBe(true);
    expect(result.publicationPrice).toBe(7.98);
    expect(result.percentDiff).toBeGreaterThan(0.5);
  });

  it('returns no deviation and null publicationPrice when no pub price exists', () => {
    const result = checkPriceDeviation('onbekend-module', 'onbekend-provider', 10);
    expect(result).toEqual({ hasDeviation: false, publicationPrice: null, percentDiff: 0 });
  });

  it('returns correct percentDiff for partial deviation under threshold', () => {
    // 6.3 vs 7.98 => ~19.4% under, should NOT flag
    const result = checkPriceDeviation('rekenwiskunde', 'cito', 6.3);
    expect(result.hasDeviation).toBe(false);
    expect(result.publicationPrice).toBe(7.98);
    expect(result.percentDiff).toBeLessThanOrEqual(0.5);
  });
});

describe('getSchoolPriceStatus', () => {
  it('returns stale when verifiedAt is >6 months ago', () => {
    const now = new Date('2026-03-22');
    const eightMonthsAgo = new Date('2025-07-22');
    const entry = makeEntry({ verifiedAt: eightMonthsAgo.toISOString(), source: 'publication' });
    expect(getSchoolPriceStatus(entry, now)).toBe('stale');
  });

  it('returns manual when priceType is agreed and recently verified', () => {
    const now = new Date('2026-03-22');
    const entry = makeEntry({
      priceType: 'agreed',
      verifiedAt: new Date('2026-03-01').toISOString(),
      source: 'manual',
    });
    expect(getSchoolPriceStatus(entry, now)).toBe('manual');
  });

  it('returns verified when priceType is publication and recently verified', () => {
    const now = new Date('2026-03-22');
    const entry = makeEntry({
      priceType: 'publication',
      verifiedAt: new Date('2026-03-01').toISOString(),
      source: 'publication',
    });
    expect(getSchoolPriceStatus(entry, now)).toBe('verified');
  });

  it('returns unknown when source is empty or verifiedAt is null', () => {
    const entry1 = makeEntry({ source: '', verifiedAt: new Date().toISOString() });
    expect(getSchoolPriceStatus(entry1)).toBe('unknown');

    const entry2 = makeEntry({ verifiedAt: null, source: 'publication' });
    expect(getSchoolPriceStatus(entry2)).toBe('unknown');
  });
});
