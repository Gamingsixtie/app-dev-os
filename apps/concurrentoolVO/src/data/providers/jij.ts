/**
 * JIJ! (Bureau ICE) provider configuration — single source of truth for all JIJ pricing data.
 *
 * Contains:
 * - License tier definitions (4 tiers)
 * - Default publication prices per module
 * - Pricing strategy (tiered-license)
 * - Cost estimation function
 *
 * JIJ! uses a fundamentally different pricing model than Cito and DIA:
 * a fixed annual license fee + a per-test-administration fee.
 *
 * Base data: deskresearch MediaTest juni 2024 (R-5043), in opdracht van Cito.
 * Bron: Concurrentieanalyse Leerling in beeld VO, tabel 3b (pagina 13).
 *
 * BELANGRIJK: Dit zijn 2024-tarieven. Werkelijke 2025-2026 tarieven kunnen
 * afwijken. Neem contact op met Bureau ICE voor actuele tarieven.
 */

import type { PriceRecord } from '@/models/pricing';
import type { TieredLicensePricing } from '@/models/pricing';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface JijLicenseTier {
  tier: 1 | 2 | 3 | 4;
  label: string;
  annualFee: number;
  pricePerTest: number;
  minAdministrations: number;
  maxAdministrations: number;
  schoolExamPrice: number;
  magisterSomtodayFee: number;
}

// ─── License Tiers ──────────────────────────────────────────────────────────────

export const JIJ_LICENSE_TIERS: JijLicenseTier[] = [
  {
    tier: 1,
    label: 'Licentie 1 (groot — 4.001+ afnames)',
    annualFee: 5330,
    pricePerTest: 2.40,
    minAdministrations: 4001,
    maxAdministrations: 13000,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 2,
    label: 'Licentie 2 (middelgroot — 2.501-4.000 afnames)',
    annualFee: 2815,
    pricePerTest: 3.05,
    minAdministrations: 2501,
    maxAdministrations: 4000,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 3,
    label: 'Licentie 3 (klein — 166-2.500 afnames)',
    annualFee: 975,
    pricePerTest: 3.75,
    minAdministrations: 166,
    maxAdministrations: 2500,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 500,
  },
  {
    tier: 4,
    label: 'Licentie 4 (zeer klein — 0-165 afnames)',
    annualFee: 290,
    pricePerTest: 7.90,
    minAdministrations: 0,
    maxAdministrations: 165,
    schoolExamPrice: 5.80,
    magisterSomtodayFee: 195,
  },
];

// ─── Cost Estimation ────────────────────────────────────────────────────────────

/**
 * Calculate estimated JIJ! cost per student per year for a given school size.
 *
 * Assumptions:
 * - 2 test administrations per student per year (nul- en volgmeting)
 * - License tier selected based on total administrations
 * - Excludes Magister/SomToday koppeling and school exams
 */
export function estimateJijCostPerStudent(
  totalStudents: number,
  testsPerStudent: number = 2,
): { costPerStudent: number; tier: JijLicenseTier } {
  const totalAdministrations = totalStudents * testsPerStudent;

  // Select the matching tier based on total administrations
  const tier =
    JIJ_LICENSE_TIERS.find(
      (t) =>
        totalAdministrations >= t.minAdministrations &&
        totalAdministrations <= t.maxAdministrations,
    ) ?? JIJ_LICENSE_TIERS[JIJ_LICENSE_TIERS.length - 1]; // fallback to smallest

  const licenseCostPerStudent = tier.annualFee / totalStudents;
  const testCostPerStudent = testsPerStudent * tier.pricePerTest;
  const costPerStudent = licenseCostPerStudent + testCostPerStudent;

  return { costPerStudent: Math.round(costPerStudent * 100) / 100, tier };
}

// ─── Default Prices ─────────────────────────────────────────────────────────────

const JIJ_NOTE =
  'JIJ! hanteert een licentie + toetsprijs-model. ' +
  'E\u00E9n jaarlijkse licentie dekt ALLE modules; tier op basis van totaal afnames over alle modules heen. ' +
  'Magister/SomToday-koppeling: \u20AC500 (L1-3) of \u20AC195 (L4) \u2014 betaald, dit is bij DIA gratis. ' +
  'Bron: deskresearch MediaTest 2024 (R-5043). Neem contact op met Bureau ICE voor actuele tarieven.';

const JIJ_DEFAULT_PRICES: PriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) \u2014 Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
  },
  {
    moduleId: 'nederlands',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) \u2014 Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE,
  },
  {
    moduleId: 'engels',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) \u2014 Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: JIJ_NOTE + ' JIJ! biedt Engels aan op ERK-niveaus A1-B2/C1 (lezen + luisteren).',
  },
  {
    moduleId: 'sociaal-emotioneel',
    provider: 'jij',
    amountPerStudent: 0,
    source: 'manual',
    sourceLabel: 'Bureau ICE \u2014 onderdeel van JIJ! LVS licentie (geen meerprijs)',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'JIJ! Hart & Handen zelfevaluaties (leerbenadering, creatief vermogen, sociale context) zitten in de basislicentie. Geen aparte kosten per leerling.',
  },
  // New MVT modules
  {
    moduleId: 'frans',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) -- Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'JIJ! MVT Frans is onderdeel van de JIJ! licentie. Prijs is gelijk aan andere JIJ! modules.',
  },
  {
    moduleId: 'duits',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) -- Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'JIJ! MVT Duits is onderdeel van de JIJ! licentie. Prijs is gelijk aan andere JIJ! modules.',
  },
  {
    moduleId: 'spaans',
    provider: 'jij',
    amountPerStudent: 9.34,
    source: 'manual',
    sourceLabel: 'Berekend o.b.v. deskresearch MediaTest 2024 (R-5043) -- Licentie 3, 800 lln, 2 afnames/lln',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'JIJ! MVT Spaans is onderdeel van de JIJ! licentie. Prijs is gelijk aan andere JIJ! modules.',
  },
];

// ─── Provider Config ────────────────────────────────────────────────────────────

export interface JijProviderConfig {
  key: 'jij';
  label: 'JIJ!';
  pricingStrategy: TieredLicensePricing;
  defaultPrices: PriceRecord[];
  licenseTiers: JijLicenseTier[];
}

export const JIJ_CONFIG: JijProviderConfig = {
  key: 'jij',
  label: 'JIJ!',
  pricingStrategy: {
    type: 'tiered-license',
    tiers: JIJ_LICENSE_TIERS,
    defaultTestsPerStudent: 2,
  },
  defaultPrices: JIJ_DEFAULT_PRICES,
  licenseTiers: JIJ_LICENSE_TIERS,
};
