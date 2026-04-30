/**
 * SAQI provider configuration — single source of truth for all SAQI pricing data.
 *
 * SAQI: School Attitude Questionnaire Internet.
 * COTAN-gecertificeerd, adaptief.
 * Directe concurrent van Cito SEF voor sociaal-emotioneel functioneren.
 *
 * Bron: SAQI website, maart 2026.
 */

import type { PriceRecord } from '@/models/pricing';
import type { FlatPricing } from '@/models/pricing';

// ─── Default Prices ─────────────────────────────────────────────────────────────

const SAQI_DEFAULT_PRICES: PriceRecord[] = [
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'saqi',
    amountPerStudent: 3.50,
    source: 'publication',
    sourceLabel: 'SAQI website \u2014 \u20AC3,50/lln/jaar, maart 2026',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'SAQI: School Attitude Questionnaire Internet. COTAN-gecertificeerd, adaptief. Directe concurrent van Cito SEF voor sociaal-emotioneel functioneren.',
  },
];

// ─── Provider Config ────────────────────────────────────────────────────────────

export interface SaqiProviderConfig {
  key: 'saqi';
  label: 'SAQI';
  pricingStrategy: FlatPricing;
  defaultPrices: PriceRecord[];
}

export const SAQI_CONFIG: SaqiProviderConfig = {
  key: 'saqi',
  label: 'SAQI',
  pricingStrategy: {
    type: 'flat',
    pricePerStudent: 3.50,
  },
  defaultPrices: SAQI_DEFAULT_PRICES,
};
