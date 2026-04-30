/**
 * Provider configurations index — aggregates all provider configs.
 *
 * Import individual configs from their files, or use PROVIDER_CONFIGS
 * for a map of all providers keyed by ProviderKey.
 */

import { CITO_CONFIG } from './cito';
import { DIA_CONFIG } from './dia';
import { JIJ_CONFIG } from './jij';
import { SAQI_CONFIG } from './saqi';
import type { ProviderKey } from '@/engine/price-comparison';

export type ProviderConfig = typeof CITO_CONFIG | typeof DIA_CONFIG | typeof JIJ_CONFIG | typeof SAQI_CONFIG;

export const PROVIDER_CONFIGS: Record<ProviderKey, ProviderConfig> = {
  cito: CITO_CONFIG,
  dia: DIA_CONFIG,
  jij: JIJ_CONFIG,
  saqi: SAQI_CONFIG,
};

export { CITO_CONFIG, DIA_CONFIG, JIJ_CONFIG, SAQI_CONFIG };
