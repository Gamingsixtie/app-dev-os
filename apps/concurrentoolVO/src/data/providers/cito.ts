/**
 * Cito provider configuration — single source of truth for all Cito pricing data.
 *
 * Contains:
 * - Bundle definitions (Individual, Basis, Plus)
 * - Contract period configurations
 * - Default publication prices per module
 * - Pricing strategy (platform+module)
 * - Helper functions for bundle/contract lookups
 *
 * Pricing derived from:
 * - Cito Leerling in beeld VO — Prijzen losse modules 2026-2027
 * - Basistoets: 4 toetsen × €17,95 = €71,80 / 3 jr = €23,93/lln/jr
 * - SEF/LWH: 3 leerjaren × €6 = €18 / 3 jr = €6,00/lln/jr
 * - TVZ: 4 toetsen × €3,75 = €15 / 3 jr = €5,00/lln/jr
 * - Cognitieve capaciteiten: €19,90/lln
 */

import type { PriceRecord } from '@/models/pricing';
import type { PlatformModulePricing } from '@/models/pricing';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type CitoBundleType = 'individual' | 'basis' | 'plus';

export type ContractPeriod = 'annual' | 'three-year' | 'three-year-duo';

export interface CitoBundle {
  id: CitoBundleType;
  name: string;
  description: string;
  /** Module IDs included in this bundle. Empty = no bundle, use individual pricing. */
  includedModuleIds: string[];
  /** Total price per student per year for all included modules combined. null = use individual prices. */
  pricePerStudent: number | null;
  /**
   * Per-period annual price per student. When a contract period is selected,
   * this overrides the generic citoFactor from CONTRACT_PERIODS.
   * null entries fall back to factor-based calculation.
   */
  contractPrices?: Partial<Record<ContractPeriod, number>>;
}

export interface ContractPeriodConfig {
  id: ContractPeriod;
  label: string;
  shortLabel: string;
  years: number;
  citoFactor: number;
  otherFactor: number;
  note: string | null;
}

// ─── Bundle Data ────────────────────────────────────────────────────────────────

/**
 * Three purchasing options for Cito modules:
 * 1. Individual — per module at published list price
 * 2. Basis — kern modules bundled at a fixed per-student rate
 * 3. Plus — extended bundle including taalverzorging and sociaal-emotioneel
 */
export const CITO_BUNDLES: CitoBundle[] = [
  {
    id: 'individual',
    name: 'Per module',
    description: 'Standaard publicatieprijzen per module',
    includedModuleIds: [],
    pricePerStudent: null,
  },
  {
    id: 'basis',
    name: 'Basis',
    description: 'Kernpakket: Rekenwiskunde, Nederlands en Engels',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels'],
    pricePerStudent: 23.93,
    contractPrices: {
      annual: 23.93,
      'three-year': 22.05,
      'three-year-duo': 21.05,
    },
  },
  {
    id: 'plus',
    name: 'Plus',
    description: 'Kern + TVZ + SEF/LWH',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging', 'sociaal-emotioneel', 'leer-werkhouding'],
    pricePerStudent: 34.93,
    contractPrices: {
      annual: 34.93,
      'three-year': 28.30,
      'three-year-duo': 27.30,
    },
  },
];

// ─── Contract Periods ───────────────────────────────────────────────────────────

/**
 * Contract period configuration.
 *
 * The factor is a fallback multiplier for individual (non-bundle) pricing.
 * When a bundle is selected with contractPrices, those take precedence.
 * - Annual: 1x (one year)
 * - 3-year: 2.85x for Cito (5% annual discount), 3.00x for other providers
 * - 3-year + DUO: 2.70x for Cito (10% annual discount via DUO subsidy), 3.00x for others
 */
export const CONTRACT_PERIODS: ContractPeriodConfig[] = [
  {
    id: 'annual',
    label: 'Per jaar',
    shortLabel: '1 jr',
    years: 1,
    citoFactor: 1,
    otherFactor: 1,
    note: null,
  },
  {
    id: 'three-year',
    label: '3-jarig contract',
    shortLabel: '3 jr',
    years: 3,
    citoFactor: 2.85,
    otherFactor: 3,
    note: 'Cito 3-jarig contract: ~6% korting per jaar. DIA/JIJ/SAQI: 3x jaarprijs.',
  },
  {
    id: 'three-year-duo',
    label: '3-jarig + DUO-subsidie',
    shortLabel: '3 jr + DUO',
    years: 3,
    citoFactor: 2.70,
    otherFactor: 3,
    note: 'Cito 3-jarig + DUO: ~10% korting per jaar. DIA/JIJ/SAQI: 3x jaarprijs. DUO-subsidie onder voorbehoud van toekenning.',
  },
];

// ─── Helper Functions ───────────────────────────────────────────────────────────

export function getContractPeriodConfig(period: ContractPeriod): ContractPeriodConfig {
  return CONTRACT_PERIODS.find((p) => p.id === period) ?? CONTRACT_PERIODS[0];
}

export function getCitoBundle(bundleType: CitoBundleType): CitoBundle {
  return CITO_BUNDLES.find((b) => b.id === bundleType) ?? CITO_BUNDLES[0];
}

/**
 * Get the effective Cito factor for a bundle + contract period combo.
 * When the bundle has explicit contractPrices, compute the factor from those.
 * Otherwise fall back to the generic citoFactor.
 */
export function getCitoFactorForBundle(
  bundle: CitoBundle,
  period: ContractPeriod,
): number {
  const config = getContractPeriodConfig(period);
  if (config.years === 1) return 1;

  const annualPrice = bundle.pricePerStudent;
  const periodPrice = bundle.contractPrices?.[period];

  if (annualPrice && periodPrice) {
    // factor = (discounted annual price x years) / annual price
    return (periodPrice * config.years) / annualPrice;
  }

  return config.citoFactor;
}

// ─── Default Prices ─────────────────────────────────────────────────────────────

const CITO_DEFAULT_PRICES: PriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 7.98,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — Basis €23,93 ÷ 3 = €7,98/module',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
    note: 'Basistoets: 4 toetsen × €17,95 = €71,80 over 3 leerjaren = €23,93/lln/jr voor RE+NL+EN samen.',
  },
  {
    moduleId: 'nederlands',
    provider: 'cito',
    amountPerStudent: 7.98,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — Basis €23,93 ÷ 3 = €7,98/module',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
    note: 'Basistoets: 4 toetsen × €17,95 = €71,80 over 3 leerjaren = €23,93/lln/jr voor RE+NL+EN samen.',
  },
  {
    moduleId: 'engels',
    provider: 'cito',
    amountPerStudent: 7.98,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — Basis €23,93 ÷ 3 = €7,98/module',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
    note: 'Basistoets: 4 toetsen × €17,95 = €71,80 over 3 leerjaren = €23,93/lln/jr voor RE+NL+EN samen.',
  },
  {
    moduleId: 'taalverzorging',
    provider: 'cito',
    amountPerStudent: 5.00,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — TVZ 4 toetsen × €3,75 = €15 / 3 jr = €5,00/lln/jr',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'cito',
    amountPerStudent: 3.00,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — SEF/LWH €6/leerjaar, helft toegekend aan SEF',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
    note: 'SEF en LWH worden samen aangeboden voor €6/leerjaar (€18 totaal over 3 jr = €6/lln/jr).',
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'cito',
    amountPerStudent: 19.90,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — Cognitieve capaciteitentoets €19,90/lln',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'leer-werkhouding',
    provider: 'cito',
    amountPerStudent: 3.00,
    source: 'publication',
    sourceLabel: 'Leerling in beeld VO 2026-2027 — SEF/LWH €6/leerjaar, helft toegekend aan LWH',
    verifiedAt: new Date('2026-03-24'),
    isPublicationPrice: true,
    note: 'SEF en LWH worden samen aangeboden voor €6/leerjaar (€18 totaal over 3 jr = €6/lln/jr).',
  },
  // Phase 27 R6 — Extra modules (Burgerschap + Digitale geletterdheid).
  // Placeholder tarieven: €0,00. Data-correctheid is owner-verantwoordelijkheid
  // (SPEC R6 out-of-scope). Geforceerde €0,00 dwingt handmatige invoer af voor
  // publicatie.
  {
    moduleId: 'burgerschap',
    provider: 'cito',
    amountPerStudent: 0,
    source: 'manual',
    sourceLabel: 'Placeholder — Cito tarief Burgerschap nog niet gepubliceerd',
    verifiedAt: new Date('2026-05-15'),
    isPublicationPrice: false,
    note: 'Placeholder €0,00. Owner moet werkelijk tarief invullen via prijs-editor voor klantgesprekken.',
  },
  {
    moduleId: 'digitale-geletterdheid',
    provider: 'cito',
    amountPerStudent: 0,
    source: 'manual',
    sourceLabel: 'Placeholder — Cito tarief Digitale geletterdheid nog niet gepubliceerd',
    verifiedAt: new Date('2026-05-15'),
    isPublicationPrice: false,
    note: 'Placeholder €0,00. Owner moet werkelijk tarief invullen via prijs-editor voor klantgesprekken.',
  },
];

// ─── Provider Config ────────────────────────────────────────────────────────────

export interface CitoProviderConfig {
  key: 'cito';
  label: 'Cito';
  pricingStrategy: PlatformModulePricing;
  defaultPrices: PriceRecord[];
}

export const CITO_CONFIG: CitoProviderConfig = {
  key: 'cito',
  label: 'Cito',
  pricingStrategy: {
    type: 'platform+module',
    bundles: CITO_BUNDLES,
    contractPeriods: CONTRACT_PERIODS,
    individualPrices: {
      'rekenwiskunde': 7.98,
      'nederlands': 7.98,
      'engels': 7.98,
      'taalverzorging': 5.00,
      'sociaal-emotioneel': 3.00,
      'leer-werkhouding': 3.00,
      'cognitieve-capaciteiten': 19.90,
      // Phase 27 R6 — placeholder tarieven, owner-verantwoordelijkheid.
      'burgerschap': 0,
      'digitale-geletterdheid': 0,
    },
  },
  defaultPrices: CITO_DEFAULT_PRICES,
};
