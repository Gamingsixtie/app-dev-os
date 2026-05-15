/**
 * Tests for the pure snapshot builder used by all 4 price-list export formats.
 * Verifies: NL date formatting, snapshot shape, disclaimer wiring, and per-provider
 * pricing-type discrimination.
 */
import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import {
  buildPriceListSnapshot,
  formatDateNL,
  PRICE_LIST_DISCLAIMER,
} from '../export/price-list-snapshot';

describe('formatDateNL', () => {
  it('formats 14 May 2026 as "14 mei 2026"', () => {
    expect(formatDateNL(new Date('2026-05-14T10:00:00Z'))).toBe('14 mei 2026');
  });

  it('formats 3 January 2026 as "3 januari 2026"', () => {
    expect(formatDateNL(new Date('2026-01-03T10:00:00Z'))).toBe('3 januari 2026');
  });

  it('uses NL month names — covers all 12 months', () => {
    const months = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december',
    ];
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, m, 15, 10, 0, 0);
      expect(formatDateNL(d)).toBe(`15 ${months[m]} 2026`);
    }
  });
});

describe('PRICE_LIST_DISCLAIMER', () => {
  it('contains "Prijzen zijn indicatief"', () => {
    expect(PRICE_LIST_DISCLAIMER).toContain('Prijzen zijn indicatief');
  });
});

describe('buildPriceListSnapshot', () => {
  const snapshot = buildPriceListSnapshot(PROVIDER_CONFIGS, new Date('2026-05-14T10:00:00Z'));

  it('returns the canonical Dutch title', () => {
    expect(snapshot.title).toBe('Cito Rekentool — Prijslijst');
  });

  it('returns dateLabel in NL format', () => {
    expect(snapshot.dateLabel).toBe('14 mei 2026');
  });

  it('returns exactly 4 rows (cito, dia, jij, saqi)', () => {
    expect(snapshot.rows).toHaveLength(4);
    const providers = snapshot.rows.map((r) => r.provider);
    expect(providers).toEqual(['cito', 'dia', 'jij', 'saqi']);
  });

  it('returns a cito row with pricingType "platform+module"', () => {
    const cito = snapshot.rows.find((r) => r.provider === 'cito');
    expect(cito).toBeDefined();
    expect(cito?.pricingType).toBe('platform+module');
    expect(cito?.providerLabel).toBe('Cito');
  });

  it('returns a dia row with pricingType "package-bundle"', () => {
    const dia = snapshot.rows.find((r) => r.provider === 'dia');
    expect(dia?.pricingType).toBe('package-bundle');
    expect(dia?.providerLabel).toBe('DIA');
  });

  it('returns a jij row with pricingType "tiered-license"', () => {
    const jij = snapshot.rows.find((r) => r.provider === 'jij');
    expect(jij?.pricingType).toBe('tiered-license');
    expect(jij?.providerLabel).toBe('JIJ!');
  });

  it('returns a saqi row with pricingType "flat"', () => {
    const saqi = snapshot.rows.find((r) => r.provider === 'saqi');
    expect(saqi?.pricingType).toBe('flat');
    expect(saqi?.providerLabel).toBe('SAQI');
  });

  it('every row has a non-empty description', () => {
    for (const row of snapshot.rows) {
      expect(row.description.length).toBeGreaterThan(0);
    }
  });

  it('exposes the disclaimer equal to PRICE_LIST_DISCLAIMER', () => {
    expect(snapshot.disclaimer).toBe(PRICE_LIST_DISCLAIMER);
  });

  it('defaults `now` to current Date when omitted', () => {
    const today = buildPriceListSnapshot(PROVIDER_CONFIGS);
    // Just verify the dateLabel is a non-empty NL-formatted string.
    expect(today.dateLabel).toMatch(/^\d{1,2} [a-z]+ \d{4}$/);
  });
});
