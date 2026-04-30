import { describe, it, expect } from 'vitest';
import { PROVIDER_CONFIGS } from '../index';
import { CITO_CONFIG } from '../cito';
import { DIA_CONFIG } from '../dia';
import { JIJ_CONFIG } from '../jij';
import { SAQI_CONFIG } from '../saqi';

describe('Provider configs', () => {
  it('PROVIDER_CONFIGS has all 4 providers', () => {
    expect(Object.keys(PROVIDER_CONFIGS)).toEqual(['cito', 'dia', 'jij', 'saqi']);
  });

  it('each config has key, label, pricingStrategy, defaultPrices', () => {
    for (const [key, config] of Object.entries(PROVIDER_CONFIGS)) {
      expect(config.key).toBe(key);
      expect(config.label).toBeTruthy();
      expect(config.pricingStrategy).toBeDefined();
      expect(config.pricingStrategy.type).toBeTruthy();
      expect(config.defaultPrices).toBeInstanceOf(Array);
      expect(config.defaultPrices.length).toBeGreaterThan(0);
    }
  });

  it('Cito has platform+module strategy', () => {
    expect(CITO_CONFIG.pricingStrategy.type).toBe('platform+module');
  });

  it('DIA has package-bundle strategy', () => {
    expect(DIA_CONFIG.pricingStrategy.type).toBe('package-bundle');
  });

  it('JIJ has tiered-license strategy', () => {
    expect(JIJ_CONFIG.pricingStrategy.type).toBe('tiered-license');
  });

  it('SAQI has flat strategy', () => {
    expect(SAQI_CONFIG.pricingStrategy.type).toBe('flat');
  });

  it('Cito defaultPrices includes leer-werkhouding', () => {
    const lwh = CITO_CONFIG.defaultPrices.find(p => p.moduleId === 'leer-werkhouding');
    expect(lwh).toBeDefined();
    expect(lwh!.amountPerStudent).toBe(3.00);
  });

  it('JIJ defaultPrices includes MVT modules', () => {
    for (const mvt of ['frans', 'duits', 'spaans']) {
      const entry = JIJ_CONFIG.defaultPrices.find(p => p.moduleId === mvt);
      expect(entry).toBeDefined();
      expect(entry!.amountPerStudent).toBe(9.34);
    }
  });
});
