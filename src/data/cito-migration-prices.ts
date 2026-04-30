/**
 * Migratieprijzen: huidig Cito-platform vs. nieuw Cito-platform.
 *
 * Pas de waarden in CITO_MIGRATION_PRICES aan met de actuele tarieven.
 * Verander de structuur niet — alleen de getallen en verifiedAt.
 *
 * oldPricePerStudent = prijs huidig platform, per leerling per jaar (€)
 * newPricePerStudent = prijs nieuw platform, per leerling per jaar (€)
 * verifiedAt        = datum van laatste verificatie
 */

export interface CitoMigrationPriceRecord {
  moduleId: string;
  oldPricePerStudent: number;
  newPricePerStudent: number;
  verifiedAt: Date;
}

export const CITO_MIGRATION_PRICES: CitoMigrationPriceRecord[] = [
  // Prijzen per leerling per schooljaar, omgerekend van platformtarieven.
  // Oud = huidig platform 2025-2026, Nieuw = Woots 2026-2027 (Basis 1jr).
  // Kern: oud = (4 toetsen × €15,90 / 3 jr) / 3 vakken = €7,07.
  //       nieuw = €23,45 Basis 1jr / 3 vakken = €7,82.
  // Bron: intel-rapport 2026-03-23, secties 0 en B4.
  {
    moduleId: 'rekenwiskunde',
    oldPricePerStudent: 7.07,
    newPricePerStudent: 7.82,
    verifiedAt: new Date('2026-03-23'),
  },
  {
    moduleId: 'nederlands',
    oldPricePerStudent: 7.07,
    newPricePerStudent: 7.82,
    verifiedAt: new Date('2026-03-23'),
  },
  {
    moduleId: 'engels',
    oldPricePerStudent: 7.07,
    newPricePerStudent: 7.82,
    verifiedAt: new Date('2026-03-23'),
  },
  {
    // Oud: €1,60 per licentie (1 toets/jr). Nieuw: €3,75 per toets (1 toets/jr).
    moduleId: 'taalverzorging',
    oldPricePerStudent: 1.60,
    newPricePerStudent: 3.75,
    verifiedAt: new Date('2026-03-23'),
  },
  {
    // Oud: €4,15 BLB licentie (SEF + LWH samen). Nieuw: €3,00 SEF los (excl. LWH).
    moduleId: 'sociaal-emotioneel',
    oldPricePerStudent: 4.15,
    newPricePerStudent: 3.00,
    verifiedAt: new Date('2026-03-23'),
  },
  {
    // Apart product, prijs ongewijzigd.
    moduleId: 'cognitieve-capaciteiten',
    oldPricePerStudent: 6.50,
    newPricePerStudent: 6.50,
    verifiedAt: new Date('2026-03-23'),
  },
];

/**
 * Get the old platform price per student for a given module.
 * Returns null if the module has no known old-platform price.
 */
export function getOldPlatformPrice(moduleId: string): number | null {
  const record = CITO_MIGRATION_PRICES.find((r) => r.moduleId === moduleId);
  return record?.oldPricePerStudent ?? null;
}
