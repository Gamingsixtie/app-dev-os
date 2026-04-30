import { describe, it, expect } from 'vitest';
import { selectOptimalDiaPackage, calculateDiaModuleCosts } from '../dia-packages';
import { DIA_PACKAGES } from '../../data/dia-packages';

describe('selectOptimalDiaPackage', () => {
  // Individual prices from default-prices.ts (updated 2026-03-23)
  const perModulePrices = new Map<string, number>([
    ['rekenwiskunde', 3.36],
    ['nederlands', 3.36],
    ['engels', 5.84],
    ['taalverzorging', 3.36],
  ]);

  it('Test 1: 2 DIA modules -> no package qualifies, individual pricing', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands'],
      DIA_PACKAGES,
      perModulePrices,
    );

    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBe(3.36 + 3.36); // 6.72 per student
    expect(result.individualTotal).toBe(3.36 + 3.36);
    expect(result.savings).toBe(0);
    expect(result.coveredModuleIds).toEqual([]);
  });

  it('Test 2: 3 DIA modules -> individual cheaper than any package', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels'],
      DIA_PACKAGES,
      perModulePrices,
    );

    // Individual: 3.36 + 3.36 + 5.84 = 12.56
    // pakket-compleet covers all 3 at 18.13 -> more expensive
    // No package is cheaper -> individual pricing
    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBeCloseTo(12.56);
    expect(result.individualTotal).toBeCloseTo(12.56);
    expect(result.savings).toBe(0);
  });

  it('Test 3: 4 DIA modules -> pakket-compleet selected when cheaper than individual', () => {
    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
      DIA_PACKAGES,
      perModulePrices,
    );

    // Individual: 3.36 + 3.36 + 5.84 + 3.36 = 15.92
    // pakket-compleet covers all 4 at 18.13 -> more expensive
    // pakket-ne-compleet covers ne + taalverzorging at 8.58, rek + en individual = 9.20, total 17.78 -> more expensive
    // No package cheaper -> individual
    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBeCloseTo(15.92);
    expect(result.individualTotal).toBeCloseTo(15.92);
    expect(result.savings).toBe(0);
  });

  it('Test 4: With higher overridden prices, package becomes cheaper', () => {
    // Simulate school-specific higher prices where packages ARE worthwhile
    const highPrices = new Map<string, number>([
      ['rekenwiskunde', 5.50],
      ['nederlands', 5.50],
      ['engels', 6.50],
      ['taalverzorging', 5.50],
    ]);

    const result = selectOptimalDiaPackage(
      ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
      DIA_PACKAGES,
      highPrices,
    );

    // Individual: 5.50 + 5.50 + 6.50 + 5.50 = 23.00
    // pakket-compleet covers all 4 at 18.13 -> cheaper!
    expect(result.selectedPackage).not.toBeNull();
    expect(result.selectedPackage!.id).toBe('pakket-compleet');
    expect(result.totalCost).toBe(18.13);
    expect(result.individualTotal).toBeCloseTo(23.00);
    expect(result.savings).toBeCloseTo(4.87);
  });

  it('Test 5: Empty DIA modules -> null package, 0 total', () => {
    const result = selectOptimalDiaPackage(
      [],
      DIA_PACKAGES,
      perModulePrices,
    );

    expect(result.selectedPackage).toBeNull();
    expect(result.totalCost).toBe(0);
    expect(result.individualTotal).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.coveredModuleIds).toEqual([]);
  });

  it('Test 6: pakket-ne-compleet selected when it covers subset cheaper', () => {
    // Use prices where the NE-compleet package is worthwhile
    const highNePrices = new Map<string, number>([
      ['nederlands', 5.00],
      ['taalverzorging', 5.00],
    ]);

    const result = selectOptimalDiaPackage(
      ['nederlands', 'taalverzorging'],
      DIA_PACKAGES,
      highNePrices,
    );

    // Individual: 5.00 + 5.00 = 10.00
    // pakket-ne-compleet covers both at 8.58 -> cheaper!
    expect(result.selectedPackage).not.toBeNull();
    expect(result.selectedPackage!.id).toBe('pakket-ne-compleet');
    expect(result.totalCost).toBe(8.58);
    expect(result.savings).toBeCloseTo(1.42);
  });
});

describe('calculateDiaModuleCosts', () => {
  it('returns per-module cost map with individual prices when no package qualifies', () => {
    const diaPerModulePrices = new Map<string, number>([
      ['rekenwiskunde', 3.36],
      ['nederlands', 3.36],
      ['engels', 5.84],
    ]);

    const result = calculateDiaModuleCosts(
      ['rekenwiskunde', 'nederlands', 'engels'],
      100,
      diaPerModulePrices,
      DIA_PACKAGES,
    );

    // No package cheaper than individual (12.56 < 18.13)
    expect(result.packageResult.selectedPackage).toBeNull();
    expect(result.total).toBeCloseTo(12.56 * 100);

    const rw = result.perModule.get('rekenwiskunde');
    expect(rw).toBeDefined();
    expect(rw!.isPackagePrice).toBe(false);
    expect(rw!.cost).toBeCloseTo(3.36 * 100);
  });

  it('returns package pricing when package is cheaper', () => {
    const highPrices = new Map<string, number>([
      ['rekenwiskunde', 5.50],
      ['nederlands', 5.50],
      ['engels', 6.50],
      ['taalverzorging', 5.50],
    ]);

    const result = calculateDiaModuleCosts(
      ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
      100,
      highPrices,
      DIA_PACKAGES,
    );

    expect(result.packageResult.selectedPackage!.id).toBe('pakket-compleet');
    expect(result.total).toBe(18.13 * 100);

    const rw = result.perModule.get('rekenwiskunde');
    expect(rw).toBeDefined();
    expect(rw!.isPackagePrice).toBe(true);
    expect(rw!.packageId).toBe('pakket-compleet');
  });
});
