export const SCHOOL_LEVELS = ['vmbo-b', 'vmbo-k', 'vmbo-gt', 'havo', 'vwo'] as const;
export type SchoolLevel = typeof SCHOOL_LEVELS[number];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  'vmbo-b': 'VMBO Basis',
  'vmbo-k': 'VMBO Kader',
  'vmbo-gt': 'VMBO GT',
  'havo': 'HAVO',
  'vwo': 'VWO',
};

// --- Phase 27 R3: Customer type (Cito-klant onderscheid in WizardStep1) ---

export const CUSTOMER_TYPES = ['huidige-cito', 'nieuwe-prospect', 'gedeeltelijk'] as const;
export type CustomerType = typeof CUSTOMER_TYPES[number];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  'huidige-cito': 'Huidige Cito-klant',
  'nieuwe-prospect': 'Nieuwe prospect',
  'gedeeltelijk': 'Gedeeltelijk',
};

// --- Phase 27 R4: Schoolsoort-varianten + groei-trajectorie ---

export const SCHOOL_TYPES = ['regulier', 'dakpanklas', 'dalton', 'montessori', 'vrije-school', 'overig'] as const;
export type SchoolType = typeof SCHOOL_TYPES[number];

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  regulier: 'Regulier',
  dakpanklas: 'Dakpanklas',
  dalton: 'Daltonschool',
  montessori: 'Montessorischool',
  'vrije-school': 'Vrije school',
  overig: 'Anders, namelijk:',
};

export const GROWTH_TRAJECTORIES = ['groei', 'krimp', 'stabiel', 'loting'] as const;
export type GrowthTrajectory = typeof GROWTH_TRAJECTORIES[number];

export const GROWTH_TRAJECTORY_LABELS: Record<GrowthTrajectory, string> = {
  groei: 'Groeit',
  krimp: 'Krimpt',
  stabiel: 'Stabiel',
  loting: 'Loting (mogelijke daling)',
};

// --- Phase 27 R5: Current tool usage per niveau (WizardStep2) ---

/**
 * Welk toets-pakket gebruikt een school op dit moment op één specifiek
 * onderwijsniveau. Wordt per niveau gevraagd in WizardStep2 en aggregeert
 * op stichtings-niveau naar `UsageMix` (zie `src/models/stichting.ts`).
 *
 * - `cito` — al volledig op Cito (huidige klant).
 * - `dia`  — DIA-gebruiker (concurrent).
 * - `jij`  — JIJ! / IEP-gebruiker (concurrent).
 * - `mix`  — gebruikt meerdere aanbieders binnen dit niveau.
 * - `geen` — gebruikt nu nog niets (nieuwe markt).
 */
export const CURRENT_TOOL_USAGE_VALUES = ['cito', 'dia', 'jij', 'mix', 'geen'] as const;
export type CurrentToolUsage = typeof CURRENT_TOOL_USAGE_VALUES[number];

/** Per-niveau mapping; missing keys = "nog geen keuze". Optioneel veld. */
export type CurrentToolUsageMap = Partial<Record<SchoolLevel, CurrentToolUsage>>;

/** Dutch UI labels — locked per Plan 27-05 interfaces-block. */
export const CURRENT_TOOL_USAGE_LABELS: Record<CurrentToolUsage, string> = {
  cito: 'Cito',
  dia: 'DIA',
  jij: 'JIJ!',
  mix: 'Mix (meerdere aanbieders)',
  geen: 'Geen (nieuwe markt)',
};

/** Leerjaren per niveau */
export const YEARS_PER_LEVEL: Record<SchoolLevel, number[]> = {
  'vmbo-b': [1, 2, 3, 4],
  'vmbo-k': [1, 2, 3, 4],
  'vmbo-gt': [1, 2, 3, 4],
  'havo': [1, 2, 3, 4, 5],
  'vwo': [1, 2, 3, 4, 5, 6],
};

export type CurrentProvider =
  | 'cito-oud'   // huidig Cito platform
  | 'cito-nieuw' // nieuw Cito platform (al klant)
  | 'dia'
  | 'jij'
  | 'saqi'       // SAQI — alleen sociaal-emotioneel instrument
  | 'overig'     // andere aanbieder (naam invulbaar)
  | 'geen';      // module niet in gebruik

export type PriceAdjustmentType = 'prijswijziging' | 'korting';

export interface ModuleCurrentSetup {
  moduleId: string;
  currentProvider: CurrentProvider;
  pricePerStudent: number | null; // null = gebruik publicatieprijs van die aanbieder
  customProviderName?: string;    // alleen bij currentProvider === 'overig'
  priceAdjustmentType?: PriceAdjustmentType; // 'prijswijziging' = absoluut tarief, 'korting' = % op publicatieprijs
  discountPercentage?: number;    // 0-100, alleen bij priceAdjustmentType === 'korting'
}

export type Scenario = 'A' | 'B' | 'C';

/**
 * Maps a CurrentProvider value to the provider key used in DEFAULT_PRICES.
 * Returns null for providers without publication pricing ('geen', 'overig').
 */
export function toPriceProvider(provider: CurrentProvider): string | null {
  switch (provider) {
    case 'cito-oud':
    case 'cito-nieuw':
      return 'cito';
    case 'dia':
      return 'dia';
    case 'jij':
      return 'jij';
    case 'saqi':
      return 'saqi';
    case 'geen':
    case 'overig':
      return null;
  }
}

export const CURRENT_PROVIDER_LABELS: Record<CurrentProvider, string> = {
  'cito-oud':   'Cito (huidig platform)',
  'cito-nieuw': 'Cito (nieuw platform)',
  'dia':        'DIA',
  'jij':        'JIJ (IEP)',
  'saqi':       'SAQI',
  'overig':     'Andere aanbieder',
  'geen':       'Geen / nog niet bepaald',
};

export const SCENARIO_LABELS: Record<Scenario, { title: string; description: string }> = {
  A: {
    title: 'Cito vs. concurrentie',
    description: 'Vergelijk de kosten van Cito met DIA en JIJ (IEP) op basis van publicatieprijzen',
  },
  B: {
    title: 'Huidig naar nieuw Cito-platform',
    description: 'Bereken de business case voor de overstap naar het nieuwe Cito-platform',
  },
  C: {
    title: 'Huidig Cito vs. concurrentie',
    description: 'Vergelijk de huidige Cito-kosten met een concurrent (retentie-perspectief)',
  },
};

// --- CRM-lite types ---

export const PIPELINE_STATUSES = ['prospect', 'contact-gelegd', 'demo-presentatie', 'offerte', 'gewonnen', 'verloren'] as const;
export type PipelineStatus = typeof PIPELINE_STATUSES[number];

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  'prospect': 'Prospect',
  'contact-gelegd': 'Contact gelegd',
  'demo-presentatie': 'Demo/Presentatie',
  'offerte': 'Offerte',
  'gewonnen': 'Gewonnen',
  'verloren': 'Verloren',
};

export const PIPELINE_STATUS_ORDER: Record<PipelineStatus, number> = {
  'prospect': 0,
  'contact-gelegd': 1,
  'demo-presentatie': 2,
  'offerte': 3,
  'gewonnen': 4,
  'verloren': 5,
};

export const DMU_POSITIONS = ['beslisser', 'inkoper', 'adviseur', 'gebruiker', 'beinvloeder', 'overig'] as const;
export type DMUPosition = typeof DMU_POSITIONS[number];

export const DMU_POSITION_LABELS: Record<DMUPosition, string> = {
  beslisser: 'Beslisser',
  inkoper: 'Inkoper',
  adviseur: 'Adviseur',
  gebruiker: 'Gebruiker',
  beinvloeder: 'Beinvloeder',
  overig: 'Overig',
};

/** Hierarchy order for display sorting (beslisser first) */
export const DMU_POSITION_ORDER: Record<DMUPosition, number> = {
  beslisser: 0,
  inkoper: 1,
  adviseur: 2,
  gebruiker: 3,
  beinvloeder: 4,
  overig: 5,
};

/** Migration mapping from old DMU positions to new ones */
export const DMU_MIGRATION_MAP: Record<string, DMUPosition> = {
  coordinator: 'gebruiker',
  mt: 'beslisser',
  finance: 'inkoper',
  overig: 'overig',
};

export const PREFERRED_CHANNELS = ['email', 'telefoon', 'teams', 'overig'] as const;
export type PreferredChannel = typeof PREFERRED_CHANNELS[number];

export const AUTHORITY_LEVELS = ['adviserend', 'beslissend', 'budgethouder'] as const;
export type AuthorityLevel = typeof AUTHORITY_LEVELS[number];

// --- Engagement status (DMU klantreis) ---

export const ENGAGEMENT_STATUSES = [
  'nog-niet-benaderd',
  'in-gesprek',
  'positief',
  'wacht-op-intern',
  'akkoord',
  'afgehaakt',
] as const;
export type EngagementStatus = typeof ENGAGEMENT_STATUSES[number];

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  'nog-niet-benaderd': 'Nog niet benaderd',
  'in-gesprek': 'In gesprek',
  'positief': 'Positief',
  'wacht-op-intern': 'Wacht op intern',
  'akkoord': 'Akkoord',
  'afgehaakt': 'Afgehaakt',
};

/** Stagnation threshold in days */
export const STAGNATION_THRESHOLD_DAYS = 30;

// --- Schooljaar (school year) ---

export const SCHOOL_YEAR_MONTHS = [
  'sep', 'okt', 'nov', 'dec', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug',
] as const;
export type SchoolYearMonth = typeof SCHOOL_YEAR_MONTHS[number];

export const SCHOOL_YEAR_MONTH_LABELS: Record<SchoolYearMonth, string> = {
  sep: 'September', okt: 'Oktober', nov: 'November', dec: 'December',
  jan: 'Januari', feb: 'Februari', mrt: 'Maart', apr: 'April',
  mei: 'Mei', jun: 'Juni', jul: 'Juli', aug: 'Augustus',
};

export const SCHOOL_YEAR_MONTH_SHORT: Record<SchoolYearMonth, string> = {
  sep: 'Sep', okt: 'Okt', nov: 'Nov', dec: 'Dec',
  jan: 'Jan', feb: 'Feb', mrt: 'Mrt', apr: 'Apr',
  mei: 'Mei', jun: 'Jun', jul: 'Jul', aug: 'Aug',
};

/** Get the school year label (e.g. "2025-2026") for a given date. School year starts September. */
export function getSchoolYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0=Jan
  if (month >= 8) return `${year}-${year + 1}`; // Sep-Dec = start year
  return `${year - 1}-${year}`; // Jan-Aug = end year
}

/** Get the start year of the school year for a given date */
export function getSchoolYearStartYear(date: Date): number {
  const month = date.getMonth();
  return month >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

/** Get the school year month index (0=Sep, 11=Aug) for a JS Date */
export function getSchoolYearMonthIndex(date: Date): number {
  const m = date.getMonth(); // 0=Jan
  return m >= 8 ? m - 8 : m + 4;
}

/** Convert a school year month index + start year to a JS month (0-11) and calendar year */
export function schoolYearMonthToCalendar(monthIndex: number, startYear: number): { jsMonth: number; year: number } {
  // monthIndex 0=Sep, 1=Oct, ..., 4=Jan, ..., 11=Aug
  const jsMonth = monthIndex < 4 ? monthIndex + 8 : monthIndex - 4;
  const year = monthIndex < 4 ? startYear : startYear + 1;
  return { jsMonth, year };
}
