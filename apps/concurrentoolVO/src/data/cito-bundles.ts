/**
 * Cito bundle pricing definitions.
 *
 * MIGRATED: Data now lives in src/data/providers/cito.ts
 * This file re-exports for backward compatibility.
 */
export {
  CITO_BUNDLES,
  CONTRACT_PERIODS,
  getContractPeriodConfig,
  getCitoBundle,
  getCitoFactorForBundle,
} from './providers/cito';
export type {
  CitoBundleType,
  ContractPeriod,
  CitoBundle,
  ContractPeriodConfig,
} from './providers/cito';
