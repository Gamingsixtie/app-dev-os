import { describe, it, expect } from 'vitest';
import {
  pricingConfigSchema,
  validatePricingConfig,
} from '../schemas/pricing-config.schema';
import type { PricingStrategy } from '@/models/pricing';
import { CITO_CONFIG } from '@/data/providers/cito';
import { DIA_CONFIG } from '@/data/providers/dia';
import { JIJ_CONFIG } from '@/data/providers/jij';
import { SAQI_CONFIG } from '@/data/providers/saqi';

describe('pricingConfigSchema', () => {
  it('validates a valid Cito config (platform+module)', () => {
    const config: PricingStrategy = CITO_CONFIG.pricingStrategy;
    const result = pricingConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('validates a valid DIA config (package-bundle)', () => {
    const config: PricingStrategy = DIA_CONFIG.pricingStrategy;
    const result = pricingConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('validates a valid JIJ config (tiered-license)', () => {
    const config: PricingStrategy = JIJ_CONFIG.pricingStrategy;
    const result = pricingConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('validates a valid SAQI config (flat)', () => {
    const config: PricingStrategy = SAQI_CONFIG.pricingStrategy;
    const result = pricingConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects tier with maxStudents <= minStudents', () => {
    const invalidConfig = {
      type: 'tiered-license' as const,
      tiers: [
        {
          tier: 1,
          label: 'Test',
          annualFee: 100,
          pricePerTest: 1,
          minAdministrations: 100,
          maxAdministrations: 50, // maxAdministrations < minAdministrations
          schoolExamPrice: 5,
          magisterSomtodayFee: 100,
        },
      ],
      defaultTestsPerStudent: 2,
    };
    const result = pricingConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('groter'))).toBe(true);
    }
  });

  it('rejects package with empty modules array', () => {
    const invalidConfig = {
      type: 'package-bundle' as const,
      packages: [
        {
          id: 'empty-pkg',
          name: 'Empty',
          includedModuleIds: [], // empty modules
          pricePerStudent: 10,
          minModules: 1,
          description: 'Test',
        },
      ],
      individualPrices: {},
    };
    const result = pricingConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes('module'))).toBe(true);
    }
  });
});

describe('validatePricingConfig', () => {
  it('returns valid for real Cito provider config', () => {
    const result = validatePricingConfig('cito', CITO_CONFIG.pricingStrategy);
    expect(result.valid).toBe(true);
  });

  it('returns valid for real DIA provider config', () => {
    const result = validatePricingConfig('dia', DIA_CONFIG.pricingStrategy);
    expect(result.valid).toBe(true);
  });

  it('catches invalid config structure with error message', () => {
    // A tiered-license config with invalid tier boundaries
    const badConfig = {
      type: 'tiered-license' as const,
      tiers: [
        {
          tier: 1,
          label: 'Bad',
          annualFee: -100, // negative fee
          pricePerTest: 1,
          minAdministrations: 100,
          maxAdministrations: 50, // invalid: max < min
          schoolExamPrice: 5,
          magisterSomtodayFee: 100,
        },
      ],
      defaultTestsPerStudent: 2,
    } as PricingStrategy;
    const result = validatePricingConfig('jij', badConfig);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
