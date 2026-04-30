/**
 * DIA provider configuration — single source of truth for all DIA pricing data.
 *
 * Contains:
 * - DIA package definitions (6 packages)
 * - Default publication prices per module
 * - Pricing strategy (package-bundle)
 *
 * Bron: DIA Webshop (shop.dia.nl), schooljaar 2025-2026.
 * Geverifieerd: maart 2026.
 */

import type { PriceRecord } from '@/models/pricing';
import type { PackageBundlePricing } from '@/models/pricing';
import type { DiaPackage } from '@/models/dia-packages';

// ─── Package Data ───────────────────────────────────────────────────────────────

export const DIA_PACKAGES: DiaPackage[] = [
  // -- Taalpakketten --
  {
    id: 'pakket-ne',
    name: 'VO Pakket NE',
    includedModuleIds: ['nederlands'],
    pricePerStudent: 5.84,
    minModules: 2,
    description: 'Diatekst NE (lezen) + Diawoord NE (woordenschat). Alleen LVS-toetsen.',
  },
  {
    id: 'pakket-ne-compleet',
    name: 'VO Pakket NE compleet',
    includedModuleIds: ['nederlands', 'taalverzorging'],
    pricePerStudent: 8.58,
    minModules: 2,
    description: 'Diatekst NE + Diawoord NE + Diaspel (spelling). Alleen LVS-toetsen.',
  },
  {
    id: 'pakket-en',
    name: 'VO Pakket EN compleet',
    includedModuleIds: ['engels'],
    pricePerStudent: 5.84,
    minModules: 2,
    description: 'Diatekst EN (lezen) + Diawoord EN (woordenschat). Alleen LVS-toetsen.',
  },

  // -- Combinatiepakketten --
  {
    id: 'pakket-compleet',
    name: 'VO Pakket compleet',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 18.13,
    minModules: 3,
    description: 'Alle 7 DIA LVS-modules (Diacijfer, Diawisk, Diatekst NE/EN, Diawoord NE/EN, Diaspel). Geen oefenmateriaal.',
  },

  // -- Basisvaardigheden pakketten (inclusief oefenmateriaal) --
  {
    id: 'basisvaardigheden-2',
    name: 'VO Basisvaardigheden 2',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 21.10,
    minModules: 3,
    description: 'Alle 7 LVS-modules + Diaplus Burgerschap (oefenmateriaal). Inclusief oefenen.',
  },
  {
    id: 'basisvaardigheden-1-plus',
    name: 'VO Basisvaardigheden 1+',
    includedModuleIds: ['rekenwiskunde', 'nederlands', 'engels', 'taalverzorging'],
    pricePerStudent: 35.58,
    minModules: 3,
    description: 'Alle 7 LVS-modules + alle oefenmateriaal (Tekstenlab, Spellab, Burgerschap). Meest uitgebreid.',
  },
];

// ─── Default Prices ─────────────────────────────────────────────────────────────

/**
 * DIA (2025-2026):
 * Bron: DIA Webshop (shop.dia.nl), geverifieerd maart 2026.
 * Per leerling per schooljaar (excl. btw), inclusief nul- en volgmeting.
 * Staffelkorting: 500+ = 5%, 1000+ = 10% (niet meegenomen in basisprijzen).
 */
const DIA_DEFAULT_PRICES: PriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diacijfer 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Diacijfer (rekenniveau) los. Diawisk (wiskundig redeneren) apart beschikbaar voor \u20AC3,36.',
  },
  {
    moduleId: 'nederlands',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diatekst NE 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Let op: dit is alleen Diatekst NE (begrijpend lezen). Diawoord NE (woordenschat) kost apart \u20AC3,36. Pakket NE (lezen + woordenschat samen): \u20AC5,84/lln. De meeste DIA-scholen nemen het pakket af.',
  },
  {
    moduleId: 'engels',
    provider: 'dia',
    amountPerStudent: 5.84,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO pakket EN compleet 2025-2026',
    verifiedAt: new Date('2026-03-21'),
    isPublicationPrice: true,
    note: 'Pakket EN compleet (Diatekst EN + Diawoord EN). Individueel: Diatekst EN \u20AC3,36, Diawoord EN \u20AC3,36.',
  },
  {
    moduleId: 'taalverzorging',
    provider: 'dia',
    amountPerStudent: 3.36,
    source: 'publication',
    sourceLabel: 'DIA Webshop — VO Diaspel 2025-2026 (individuele prijs)',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: true,
    note: 'Diaspel (digitaal dictee voor spelling). Ook in Pakket NE compleet (Diatekst + Diawoord + Diaspel): \u20AC8,58.',
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'dia',
    amountPerStudent: 9.75,
    source: 'manual',
    sourceLabel: 'Deskresearch MediaTest juni 2024 (R-5043) — Dia NSCCT digitaal',
    verifiedAt: new Date('2026-03-23'),
    isPublicationPrice: false,
    note: 'Dia NSCCT (Niet-Schoolse Cognitieve Capaciteitentoets). Digitaal: \u20AC9,75/leerling. Papier: \u20AC4,50/leerling. Prijs uit 2024.',
  },
];

// ─── Provider Config ────────────────────────────────────────────────────────────

export interface DiaProviderConfig {
  key: 'dia';
  label: 'DIA';
  pricingStrategy: PackageBundlePricing;
  defaultPrices: PriceRecord[];
  packages: DiaPackage[];
}

// ─── Basisvaardigheden Helpers ──────────────────────────────────────────────────

export const BASISVAARDIGHEDEN_MODULE_IDS = ['rekenwiskunde', 'nederlands', 'engels'] as const;

/** DIA packages that cover ALL given basisvaardigheden modules (group-level). */
export function getDiaGroupPackages(activeModuleIds: string[]): DiaPackage[] {
  const basisIds = activeModuleIds.filter((id) =>
    (BASISVAARDIGHEDEN_MODULE_IDS as readonly string[]).includes(id),
  );
  if (basisIds.length < 2) return [];

  return DIA_PACKAGES.filter(
    (pkg) =>
      basisIds.every((id) => pkg.includedModuleIds.includes(id)) &&
      basisIds.length >= pkg.minModules,
  );
}

/** DIA packages for a single module, excluding group packages that cover all basisvaardigheden. */
export function getDiaModulePackages(moduleId: string): DiaPackage[] {
  return DIA_PACKAGES.filter(
    (pkg) =>
      pkg.includedModuleIds.includes(moduleId) &&
      !BASISVAARDIGHEDEN_MODULE_IDS.every((id) => pkg.includedModuleIds.includes(id)),
  );
}

export const DIA_CONFIG: DiaProviderConfig = {
  key: 'dia',
  label: 'DIA',
  pricingStrategy: {
    type: 'package-bundle',
    packages: DIA_PACKAGES,
    individualPrices: {
      'rekenwiskunde': 3.36,
      'nederlands': 3.36,
      'engels': 5.84,
      'taalverzorging': 3.36,
      'cognitieve-capaciteiten': 9.75,
    },
  },
  defaultPrices: DIA_DEFAULT_PRICES,
  packages: DIA_PACKAGES,
};
