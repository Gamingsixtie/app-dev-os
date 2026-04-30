/**
 * Tijdswinst-taken voor de migratie van huidig naar nieuw Cito-platform.
 * defaultHoursPerYear is een startwaarde — de consultant past dit aan per schoolgesprek.
 * Uren kunnen null zijn als de consultant de tijdwinst niet kent of wil overslaan.
 */

export interface TimeSavingTask {
  id: string;
  label: string;
  oldMethodLabel: string;
  newMethodLabel: string;
  defaultHoursPerYear: number;
  description: string;
  benefit: string;
}

export const TIME_SAVING_TASKS: TimeSavingTask[] = [
  {
    id: 'rechten',
    label: 'Rechten docenten',
    oldMethodLabel: 'Handmatig',
    newMethodLabel: 'Automatisch',
    defaultHoursPerYear: 10,
    description: 'Docenten krijgen automatisch de juiste rechten via koppeling met Entree-federatie.',
    benefit: 'Geen handmatig beheer meer, minder fouten bij start schooljaar.',
  },
  {
    id: 'resetten',
    label: 'Toetsen resetten',
    oldMethodLabel: 'Klantenservice bellen',
    newMethodLabel: 'Zelf doen',
    defaultHoursPerYear: 12,
    description: 'Toetsen direct resetten vanuit het dashboard, zonder te wachten op klantenservice.',
    benefit: 'Directe actie mogelijk, geen wachttijd bij urgente situaties.',
  },
  {
    id: 'inloggen',
    label: 'Inlogmethode',
    oldMethodLabel: 'Startcodes',
    newMethodLabel: 'Entree-federatie',
    defaultHoursPerYear: 8,
    description: 'Leerlingen loggen in via Entree-federatie i.p.v. losse startcodes per toets.',
    benefit: 'Geen startcodes meer printen en uitdelen, minder uitval door inlogproblemen.',
  },
  {
    id: 'planning',
    label: 'Planning',
    oldMethodLabel: 'Handmatig',
    newMethodLabel: 'Automatisch voorstel',
    defaultHoursPerYear: 10,
    description: 'Het platform stelt automatisch een toetsplanning voor op basis van het jaarrooster.',
    benefit: 'Snellere planning, minder kans op roosterconflicten.',
  },
  {
    id: 'koppeling',
    label: 'Leerling-/docentkoppeling',
    oldMethodLabel: 'Handmatig EDEXML',
    newMethodLabel: 'Somtoday/Magister sync',
    defaultHoursPerYear: 8,
    description: 'Leerling- en docentgegevens worden automatisch gesynchroniseerd vanuit het LAS.',
    benefit: 'Altijd actuele gegevens, geen handmatige EDEXML-uploads meer.',
  },
];

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
