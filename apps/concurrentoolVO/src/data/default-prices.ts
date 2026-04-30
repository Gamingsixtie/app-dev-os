/**
 * Default publication pricing data for all providers and modules.
 *
 * MIGRATED: Data now lives in src/data/providers/{cito,dia,jij,saqi}.ts
 * This file re-exports for backward compatibility with 18+ consumers.
 */
import type { PriceRecord } from '../models/pricing';
import { CITO_CONFIG } from './providers/cito';
import { DIA_CONFIG } from './providers/dia';
import { JIJ_CONFIG } from './providers/jij';
import { SAQI_CONFIG } from './providers/saqi';

export const DEFAULT_PRICES: PriceRecord[] = [
  ...CITO_CONFIG.defaultPrices,
  ...DIA_CONFIG.defaultPrices,
  ...JIJ_CONFIG.defaultPrices,
  ...SAQI_CONFIG.defaultPrices,
];
