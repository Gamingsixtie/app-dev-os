import { isPriceStale } from '../lib/date-utils';
import { DEFAULT_PRICES } from '../data/default-prices';
import type { SchoolPriceEntry } from '../db/types';

export type PriceSource = 'publication' | 'manual' | 'ai-lookup';

export interface PriceRecord {
  moduleId: string;
  provider: 'cito' | 'dia' | 'jij' | 'saqi';
  amountPerStudent: number;
  source: PriceSource;
  sourceLabel: string;
  verifiedAt: Date;
  isPublicationPrice: boolean;
  /** Optional note shown in the UI, e.g. pricing model caveats */
  note?: string;
}

export type PriceStatus = 'verified' | 'manual' | 'stale';

/**
 * Determine the status of a price record.
 * Returns 'stale' if verified more than 6 months ago,
 * 'manual' if source is manual, otherwise 'verified'.
 */
export function getPriceStatus(record: PriceRecord, now: Date = new Date()): PriceStatus {
  if (isPriceStale(record.verifiedAt, 6, now)) return 'stale';
  if (record.source === 'manual') return 'manual';
  return 'verified';
}

/**
 * Get the Dutch display label for a price record's staleness status.
 */
export function getPriceStalenessLabel(record: PriceRecord, now: Date = new Date()): string {
  const status = getPriceStatus(record, now);
  switch (status) {
    case 'verified': return 'Geverifieerd';
    case 'manual': return 'Handmatig';
    case 'stale': return 'Mogelijk verouderd';
  }
}

// ─── School Price Status (for SchoolPriceEntry from school_prices table) ─────

export type SchoolPriceStatus = 'verified' | 'manual' | 'stale' | 'unknown';

/**
 * Determine the status of a school-specific price entry.
 * - 'unknown' if no verifiedAt or empty source
 * - 'stale' if verified more than 6 months ago
 * - 'manual' if priceType is 'agreed'
 * - 'verified' otherwise
 */
export function getSchoolPriceStatus(
  entry: SchoolPriceEntry,
  now: Date = new Date(),
): SchoolPriceStatus {
  if (!entry.verifiedAt || !entry.source) return 'unknown';
  if (isPriceStale(new Date(entry.verifiedAt), 6, now)) return 'stale';
  if (entry.priceType === 'agreed') return 'manual';
  return 'verified';
}

/**
 * Dutch display label for a SchoolPriceStatus.
 */
export function getSchoolPriceStalenessLabel(status: SchoolPriceStatus): string {
  switch (status) {
    case 'verified': return 'Geverifieerd';
    case 'manual': return 'Handmatig';
    case 'stale': return 'Mogelijk verouderd';
    case 'unknown': return 'Onbekend';
  }
}

// ─── Price Deviation Detection ───────────────────────────────────────────────

export interface PriceDeviationResult {
  hasDeviation: boolean;
  publicationPrice: number | null;
  percentDiff: number;
}

/**
 * Check if a school price deviates more than 50% from the publication price.
 * Looks up the publication price in DEFAULT_PRICES by moduleId and provider.
 */
export function checkPriceDeviation(
  moduleId: string,
  provider: string,
  amount: number,
): PriceDeviationResult {
  const pubPrice = DEFAULT_PRICES.find(
    (p) => p.moduleId === moduleId && p.provider === provider,
  );

  if (!pubPrice) {
    return { hasDeviation: false, publicationPrice: null, percentDiff: 0 };
  }

  const percentDiff = Math.abs(amount - pubPrice.amountPerStudent) / pubPrice.amountPerStudent;

  return {
    hasDeviation: percentDiff > 0.5,
    publicationPrice: pubPrice.amountPerStudent,
    percentDiff,
  };
}

// ---- Pricing Strategy (discriminated union) ----

export interface FlatPricing {
  type: 'flat';
  pricePerStudent: number;
}

export interface TieredLicensePricing {
  type: 'tiered-license';
  tiers: import('../data/jij-license-tiers').JijLicenseTier[];
  defaultTestsPerStudent: number;
}

export interface PackageBundlePricing {
  type: 'package-bundle';
  packages: import('../models/dia-packages').DiaPackage[];
  individualPrices: Record<string, number>;
}

export interface PlatformModulePricing {
  type: 'platform+module';
  bundles: import('../data/cito-bundles').CitoBundle[];
  contractPeriods: import('../data/cito-bundles').ContractPeriodConfig[];
  individualPrices: Record<string, number>;
}

export type PricingStrategy =
  | FlatPricing
  | TieredLicensePricing
  | PackageBundlePricing
  | PlatformModulePricing;
