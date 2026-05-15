/**
 * Tests for the pure TXT renderer.
 * Verifies tab-separated layout + title + date + disclaimer + all 4 providers.
 */
import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import { buildPriceListSnapshot } from '../export/price-list-snapshot';
import { renderPriceListTxt } from '../export/price-list-txt';

describe('renderPriceListTxt', () => {
  const snapshot = buildPriceListSnapshot(PROVIDER_CONFIGS, new Date('2026-05-14T10:00:00Z'));
  const txt = renderPriceListTxt(snapshot);

  it('contains the title', () => {
    expect(txt).toContain('Cito Rekentool — Prijslijst');
  });

  it('contains the dateLabel', () => {
    expect(txt).toContain('14 mei 2026');
  });

  it('contains the disclaimer', () => {
    expect(txt).toContain('Prijzen zijn indicatief');
  });

  it('uses tab characters (tab-separated layout)', () => {
    expect(txt).toContain('\t');
  });

  it('mentions all 4 provider labels', () => {
    expect(txt).toContain('Cito');
    expect(txt).toContain('DIA');
    expect(txt).toContain('JIJ!');
    expect(txt).toContain('SAQI');
  });

  it('renders as a single multi-line string (>= 6 lines)', () => {
    expect(txt.split('\n').length).toBeGreaterThanOrEqual(6);
  });
});
