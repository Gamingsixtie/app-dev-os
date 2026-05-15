/**
 * Backward-compat re-export shim (Phase 27 Wave 0).
 *
 * `TimeSavingTask` + `TIME_SAVING_TASKS` were relocated to
 * `@/models/time-savings`. This re-export keeps the old import path
 * working for now. Plan 27-10 removes this shim entirely — at that point
 * all consumers must import from `@/models/time-savings`.
 */
export { TIME_SAVING_TASKS } from '@/models/time-savings';
export type { TimeSavingTask } from '@/models/time-savings';

// ─── Migratie module voordelen ──────────────────────────────────────────────

export interface MigrationModuleBenefit {
  moduleId: string;
  toelichting: string;
  voordelen: string[];
}

export const MIGRATION_MODULE_BENEFITS: MigrationModuleBenefit[] = [
  {
    moduleId: 'rekenwiskunde',
    toelichting: 'Het nieuwe platform biedt adaptieve toetsing en directe koppeling met methodeaanbieders voor remediering.',
    voordelen: [
      'Adaptieve toetsafname op maat van de leerling',
      'Directe rapportage in het dashboard zonder wachttijd',
      'Gratis remediering via samenwerking met methodeaanbieders',
      'Automatische leerlingimport via Somtoday/Magister',
    ],
  },
  {
    moduleId: 'nederlands',
    toelichting: 'Nederlands profiteert van hetzelfde verbeterde platform met adaptieve afname en geïntegreerde rapportage.',
    voordelen: [
      'Adaptieve toetsafname afgestemd op het niveau van de leerling',
      'Geïntegreerd dashboard met trendanalyses over meerdere jaren',
      'Remediering in samenwerking met methodeaanbieders',
    ],
  },
  {
    moduleId: 'engels',
    toelichting: 'Engels is exclusief beschikbaar via Cito — geen concurrenten bieden een vergelijkbaar LVS-instrument.',
    voordelen: [
      'Uniek aanbod: alleen Cito biedt een LVS-instrument Engels voor het VO',
      'ERK-geijkte niveaubepaling voor alle vaardigheden',
      'Adaptieve afname voor nauwkeurigere resultaten',
    ],
  },
  {
    moduleId: 'taalverzorging',
    toelichting: 'Taalverzorging meet spelling en grammatica en is op het nieuwe platform geïntegreerd in het totaaloverzicht.',
    voordelen: [
      'Volledig geïntegreerd in het leerlingdashboard',
      'Gecombineerde rapportage met Nederlands voor totaalbeeld taalvaardigheid',
    ],
  },
  {
    moduleId: 'sociaal-emotioneel',
    toelichting: 'Het sociaal-emotioneel instrument verhuist naar een moderner platform met betere privacy en rapportage.',
    voordelen: [
      'Verbeterde privacy-instellingen conform AVG',
      'Overzichtelijke rapportage per klas en per leerling',
      'Lagere prijs per leerling op het nieuwe platform',
    ],
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    toelichting: 'De Cognitieve Capaciteitentoets blijft beschikbaar als apart instrument met ongewijzigde prijs.',
    voordelen: [
      'Naadloze integratie met het nieuwe dashboard',
      'Resultaten direct beschikbaar naast LVS-gegevens',
    ],
  },
  {
    moduleId: 'leer-werkhouding',
    toelichting: 'Leer-werkhouding is exclusief bij Cito en biedt inzicht in de werkhouding naast cognitieve prestaties.',
    voordelen: [
      'Uniek instrument — niet beschikbaar bij concurrenten',
      'Gecombineerd inzicht met cognitieve toetsresultaten',
    ],
  },
];
