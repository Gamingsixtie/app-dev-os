import { describe, it, expect } from 'vitest';
import { isPriceStale } from '../date-utils';

describe('isPriceStale', () => {
  it('returns true for date older than 6 months', () => {
    const now = new Date('2026-03-20');
    const verifiedAt = new Date('2025-08-01');
    expect(isPriceStale(verifiedAt, 6, now)).toBe(true);
  });

  it('returns false for date within 6 months', () => {
    const now = new Date('2026-03-20');
    const verifiedAt = new Date('2026-01-01');
    expect(isPriceStale(verifiedAt, 6, now)).toBe(false);
  });
});
