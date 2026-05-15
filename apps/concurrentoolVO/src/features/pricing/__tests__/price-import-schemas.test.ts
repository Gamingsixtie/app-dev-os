import { describe, it, expect } from 'vitest';
import {
  PROVIDER_IMPORT_SCHEMAS,
  CitoImportSchema,
  DiaImportSchema,
  JijImportSchema,
  SaqiImportSchema,
} from '../import/price-import-schemas';
import { CITO_CONFIG, DIA_CONFIG, JIJ_CONFIG, SAQI_CONFIG } from '@/data/providers/index';

describe('price-import-schemas', () => {
  it('PROVIDER_IMPORT_SCHEMAS heeft exact 4 keys: cito, dia, jij, saqi', () => {
    const keys = Object.keys(PROVIDER_IMPORT_SCHEMAS).sort();
    expect(keys).toEqual(['cito', 'dia', 'jij', 'saqi']);
  });

  it('CitoImportSchema valideert de live CITO_CONFIG.pricingStrategy', () => {
    const result = PROVIDER_IMPORT_SCHEMAS.cito.safeParse(CITO_CONFIG.pricingStrategy);
    expect(result.success).toBe(true);
  });

  it('DiaImportSchema valideert de live DIA_CONFIG.pricingStrategy', () => {
    const result = PROVIDER_IMPORT_SCHEMAS.dia.safeParse(DIA_CONFIG.pricingStrategy);
    expect(result.success).toBe(true);
  });

  it('JijImportSchema valideert de live JIJ_CONFIG.pricingStrategy', () => {
    const result = PROVIDER_IMPORT_SCHEMAS.jij.safeParse(JIJ_CONFIG.pricingStrategy);
    expect(result.success).toBe(true);
  });

  it('SaqiImportSchema valideert de live SAQI_CONFIG.pricingStrategy', () => {
    const result = PROVIDER_IMPORT_SCHEMAS.saqi.safeParse(SAQI_CONFIG.pricingStrategy);
    expect(result.success).toBe(true);
  });

  it('SaqiImportSchema verwerpt negatieve pricePerStudent (sanity-check)', () => {
    const invalid = { type: 'flat', pricePerStudent: -1 };
    const result = PROVIDER_IMPORT_SCHEMAS.saqi.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('named exports match map entries', () => {
    expect(PROVIDER_IMPORT_SCHEMAS.cito).toBe(CitoImportSchema);
    expect(PROVIDER_IMPORT_SCHEMAS.dia).toBe(DiaImportSchema);
    expect(PROVIDER_IMPORT_SCHEMAS.jij).toBe(JijImportSchema);
    expect(PROVIDER_IMPORT_SCHEMAS.saqi).toBe(SaqiImportSchema);
  });
});
