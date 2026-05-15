/**
 * Time-savings task definitions for the migration business case.
 *
 * Relocated from `src/models/migration.ts` and `src/engine/migration.ts`
 * during Phase 27 Wave 0 (Plan 27-01). Old locations now re-export from
 * here as backward-compat shims; Plan 27-10 removes them entirely.
 *
 * defaultHoursPerYear is a starting value — the consultant adjusts it
 * per school conversation. hoursPerYear can be null when the consultant
 * does not know the time saving or wants to skip the task.
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

/**
 * Engine output: computed time-saving result per task.
 *
 * hoursPerYear is null when the consultant explicitly skipped the task.
 * valuePerYear = hoursPerYear * hourlyRate (0 when hours is null).
 */
export interface TimeSavingResult {
  taskId: TimeSavingTask['id'];
  taskLabel: string;
  oldMethodLabel: string;
  newMethodLabel: string;
  /** null = unknown/skipped by consultant */
  hoursPerYear: number | null;
  valuePerYear: number;
}
