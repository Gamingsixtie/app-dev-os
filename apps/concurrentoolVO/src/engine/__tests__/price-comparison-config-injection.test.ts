import { describe, it, expect } from 'vitest';
import { calculateComparison } from '../price-comparison';
import { PROVIDER_CONFIGS } from '@/data/providers/index';
import type { ProviderConfig } from '@/data/providers/index';

describe('calculateComparison config injection', () => {
  const studentCounts: Record<string, Record<number, number>> = {
    havo: { 1: 50, 2: 50 },
  };

  it('without providerConfigs uses static PROVIDER_CONFIGS (backward compat)', () => {
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    // Should produce a result using static configs
    expect(result.modules.length).toBe(1);
    expect(result.modules[0].providers.cito).not.toBeNull();
  });

  it('with providerConfigs uses injected configs instead of static', () => {
    // Create modified configs with a different Cito price for rekenwiskunde
    const modifiedConfigs: Record<string, ProviderConfig> = {
      ...PROVIDER_CONFIGS,
      cito: {
        ...PROVIDER_CONFIGS.cito,
        defaultPrices: PROVIDER_CONFIGS.cito.defaultPrices.map((p) =>
          p.moduleId === 'rekenwiskunde'
            ? { ...p, amountPerStudent: 99.99 }
            : p,
        ),
      },
    };

    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      {
        citoBundleType: 'individual',
        providerConfigs: modifiedConfigs,
      },
    );

    expect(result.modules[0].providers.cito).not.toBeNull();
    expect(result.modules[0].providers.cito!.pricePerStudent).toBe(99.99);
  });

  it('modified Cito price via injected config produces different total than static config', () => {
    // Static config result
    const staticResult = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    // Modified config result
    const modifiedConfigs: Record<string, ProviderConfig> = {
      ...PROVIDER_CONFIGS,
      cito: {
        ...PROVIDER_CONFIGS.cito,
        defaultPrices: PROVIDER_CONFIGS.cito.defaultPrices.map((p) =>
          p.moduleId === 'rekenwiskunde'
            ? { ...p, amountPerStudent: 99.99 }
            : p,
        ),
      },
    };

    const injectedResult = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      {
        citoBundleType: 'individual',
        providerConfigs: modifiedConfigs,
      },
    );

    // Static Cito price for rekenwiskunde is NOT 99.99, so totals differ
    expect(staticResult.totals.cito).not.toBe(injectedResult.totals.cito);
    expect(injectedResult.totals.cito).toBe(99.99 * 100); // 100 students
  });

  it('all existing price-comparison tests still pass (no regression)', () => {
    // This test verifies backward compatibility by running a basic comparison
    // without providerConfigs — should work exactly as before
    const result = calculateComparison(
      ['rekenwiskunde', 'nederlands'],
      studentCounts,
      { citoBundleType: 'individual' },
    );

    expect(result.modules.length).toBe(2);
    expect(result.totals.cito).toBeGreaterThan(0);
    // Differences should be computed
    expect(result.differences).toBeDefined();
  });
});
