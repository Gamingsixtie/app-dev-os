import type { ProviderKey } from '../engine/price-comparison';

export type ModuleCategory = 'leerlingvolgsysteem' | 'overige-instrumenten';

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
];

export const MODULE_CATEGORIES: Record<ModuleCategory, string> = {
  'leerlingvolgsysteem': 'Leerlingvolgsysteem',
  'overige-instrumenten': 'Overige instrumenten',
};
