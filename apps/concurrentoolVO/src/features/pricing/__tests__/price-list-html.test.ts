/**
 * Tests for the pure HTML renderer.
 * Verifies DOCTYPE, Cito branding color, title/date/disclaimer, table + 4 providers.
 */
import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { buildPriceListSnapshot } from '../export/price-list-snapshot';
import { renderPriceListHtml } from '../export/price-list-html';

describe('renderPriceListHtml', () => {
  const snapshot = buildPriceListSnapshot(PROVIDER_CONFIGS, new Date('2026-05-14T10:00:00Z'));
  const html = renderPriceListHtml(snapshot);

  it('starts with <!DOCTYPE html>', () => {
    expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('contains the Cito-primary color #003082 (branding)', () => {
    expect(html).toContain('#003082');
  });

  it('contains the title', () => {
    expect(html).toContain('Cito Rekentool — Prijslijst');
  });

  it('contains the dateLabel', () => {
    expect(html).toContain('14 mei 2026');
  });

  it('contains the disclaimer', () => {
    expect(html).toContain('Prijzen zijn indicatief');
  });

  it('contains a <table> element', () => {
    expect(html).toContain('<table');
  });

  it('mentions all 4 provider labels', () => {
    expect(html).toContain('Cito');
    expect(html).toContain('DIA');
    expect(html).toContain('JIJ!');
    expect(html).toContain('SAQI');
  });

  it('escapes ampersand in any user-derived strings', () => {
    // Inject a provider-derived label with & to test the escapeHtml path.
    // Build a fake snapshot with an XSS-shaped description to assert escaping.
    const malicious = {
      ...snapshot,
      rows: snapshot.rows.map((r, i) =>
        i === 0 ? { ...r, description: '<script>alert(1)</script>' } : r,
      ),
    };
    const out = renderPriceListHtml(malicious);
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('declares lang="nl"', () => {
    expect(html).toContain('lang="nl"');
  });
});
