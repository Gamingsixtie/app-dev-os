import type { ProviderKey } from '../engine/price-comparison';

export type ModuleCategory =
  | 'leerlingvolgsysteem'
  | 'overige-instrumenten'
  | 'extra-modules';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  separateLicense: boolean;
  differentiator?: string;
  /** Alternative names for AI intake fuzzy matching */
  aliases: string[];
  /** Which providers offer this module */
  availableFrom: ProviderKey[];
}

export const MODULE_CATALOG: ModuleDefinition[] = [
  // Leerlingvolgsysteem
  {
    id: 'rekenwiskunde',
    name: 'Reken-Wiskunde',
    description: 'Volg de reken- en wiskundevaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
    aliases: ['Reken-Wiskunde', 'rekenen', 'wiskunde', 'Diacijfer', 'Diawisk'],
    availableFrom: ['cito', 'dia', 'jij'],
  },
  {
    id: 'nederlands',
    name: 'Nederlands',
    description: 'Volg de taalvaardigheden Nederlands van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    differentiator: 'Remediering in samenwerking met methodeaanbieders: gratis en legt de expertise neer waar het hoort',
    aliases: ['Nederlands', 'NE', 'Diatekst NE', 'Diawoord NE', 'begrijpend lezen'],
    availableFrom: ['cito', 'dia', 'jij'],
  },
  {
    id: 'engels',
    name: 'Engels',
    description: 'Volg de Engelse taalvaardigheden van leerlingen',
    category: 'leerlingvolgsysteem',
    separateLicense: false,
    aliases: ['Engels', 'EN', 'Diatekst EN', 'Diawoord EN', 'English'],
    availableFrom: ['cito', 'dia', 'jij'],
  },
  // Overige instrumenten
  {
    id: 'taalverzorging',
    name: 'Taalverzorging Nederlands',
    description: 'Toets spelling en grammatica',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['Taalverzorging', 'spelling', 'grammatica', 'Diaspel'],
    availableFrom: ['cito', 'dia'],
  },
  {
    id: 'sociaal-emotioneel',
    name: 'Sociaal-emotioneel functioneren',
    description: 'Breng het sociaal-emotioneel functioneren van leerlingen in kaart',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['SEF', 'sociaal-emotioneel functioneren', 'SAQI', 'Hart & Handen'],
    availableFrom: ['cito', 'jij', 'saqi'],
  },
  {
    id: 'cognitieve-capaciteiten',
    name: 'Cognitieve capaciteitentoets',
    description: 'Meet cognitieve capaciteiten van leerlingen (losse licentie)',
    category: 'overige-instrumenten',
    separateLicense: true,
    aliases: ['CCTT', 'cognitieve capaciteiten', 'NSCCT', 'intelligentie'],
    availableFrom: ['cito', 'dia'],
  },
  {
    id: 'leer-werkhouding',
    name: 'Leer-werkhouding',
    description: 'Breng de leer- en werkhouding van leerlingen in kaart',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['LWH', 'leer-werkhouding', 'werkhouding'],
    availableFrom: ['cito'],
  },
  {
    id: 'frans',
    name: 'Frans',
    description: 'ERK-geijkte toetsing Franse taalvaardigheid',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['Frans', 'French', 'MVT Frans'],
    availableFrom: ['jij'],
  },
  {
    id: 'duits',
    name: 'Duits',
    description: 'ERK-geijkte toetsing Duitse taalvaardigheid',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['Duits', 'German', 'MVT Duits'],
    availableFrom: ['jij'],
  },
  {
    id: 'spaans',
    name: 'Spaans',
    description: 'ERK-geijkte toetsing Spaanse taalvaardigheid',
    category: 'overige-instrumenten',
    separateLicense: false,
    aliases: ['Spaans', 'Spanish', 'MVT Spaans'],
    availableFrom: ['jij'],
  },
  // Extra modules (Phase 27 R6) — wettelijk verplicht in VO per SLO kerndoelen
  // 2025-2026 (definitief 1-8-2027), alle niveaus (VMBO B/K/GT, HAVO, VWO).
  // Cito-only schijnvoordeel: DIA/JIJ/SAQI bieden deze modules niet aan.
  // Niveau-onafhankelijk in dit model — alle niveaus worden bereikt omdat geen
  // niveau-restrictie bestaat in MODULE_CATALOG en WizardStep3 geen niveau-filter
  // toepast.
  {
    id: 'burgerschap',
    name: 'Burgerschap',
    description: 'Aansluitend op SLO kerndoelen burgerschap 2025-2026 (wettelijk verplicht VO)',
    category: 'extra-modules',
    separateLicense: false,
    aliases: [
      'Burgerschap',
      'burgerschapsonderwijs',
      'burgerschap-onderwijs',
      'maatschappijleer-aanvullend',
      'wereldburgerschap',
    ],
    availableFrom: ['cito'],
  },
  {
    id: 'digitale-geletterdheid',
    name: 'Digitale geletterdheid',
    description: 'SLO-kerndoelen digitale geletterdheid + AI-geletterdheid (wettelijk verplicht VO)',
    category: 'extra-modules',
    separateLicense: false,
    aliases: [
      'Digitale geletterdheid',
      'digitale-vaardigheden',
      'AI-geletterdheid',
      'mediawijsheid',
      'computational-thinking',
      'ICT-basisvaardigheden',
    ],
    availableFrom: ['cito'],
  },
];

export const MODULE_CATEGORIES: Record<ModuleCategory, string> = {
  'leerlingvolgsysteem': 'Leerlingvolgsysteem',
  'overige-instrumenten': 'Overige instrumenten',
  'extra-modules': 'Extra Modules',
};
