/**
 * Detailed content mapping: what each provider actually offers per module.
 *
 * This enables the tool to show consultants exactly what sub-products,
 * measurement types, and features each provider includes — so they can
 * make apples-to-apples comparisons in school conversations.
 *
 * Bron: Intel-rapport 23-03-2026, DIA webshop, Bureau ICE website, saqi.nl
 */

import type { ProviderKey } from '../engine/price-comparison';

export interface SubProduct {
  name: string;
  /** Short description of what it measures */
  description: string;
  /** Price if sold separately (null = not sold separately or included in bundle) */
  separatePrice: number | null;
}

export interface ProviderModuleContent {
  /** What the provider calls this product */
  productName: string;
  /** Sub-products / sub-tests included */
  subProducts: SubProduct[];
  /** How tests are administered */
  testFormat: string;
  /** How many measurements per year */
  measurementFrequency: string;
  /** Target group (leerjaren) */
  targetGroup: string;
  /** LAS integrations */
  integrations: string[];
  /** Key differentiating features */
  keyFeatures: string[];
  /** Constructs/skills measured */
  constructs: string[];
}

export interface ModuleContentMap {
  moduleId: string;
  providers: Partial<Record<ProviderKey, ProviderModuleContent>>;
}

export const PROVIDER_MODULE_CONTENT: ModuleContentMap[] = [
  // ═══════════════════════════════════════════════════════════════════
  // REKENWISKUNDE
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'rekenwiskunde',
    providers: {
      cito: {
        productName: 'Leerling in beeld — Kernvaardigheden (rekendeel)',
        subProducts: [
          { name: 'Kernvaardighedentoets T0', description: 'Instaptoets begin klas 1', separatePrice: null },
          { name: 'Kernvaardighedentoets T1', description: 'Eind klas 1', separatePrice: null },
          { name: 'Kernvaardighedentoets T2', description: 'Eind klas 2', separatePrice: null },
          { name: 'Kernvaardighedentoets T3', description: 'Eind klas 3', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '4 toetsmomenten over 3 leerjaren (T0-T3)',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Gebundeld met Nederlands en Engels (kernvaardigheden)',
          'Remediëring via methodeaanbieders',
          'Adaptieve toetsafname',
        ],
        constructs: ['Rekenvaardigheid', 'Wiskundig denken', 'Referentieniveaus 1F-3F'],
      },
      dia: {
        productName: 'Diacijfer',
        subProducts: [
          { name: 'Diacijfer', description: 'Rekenniveau meten', separatePrice: 3.36 },
          { name: 'Diawisk', description: 'Wiskundig redeneren en probleemoplossen', separatePrice: 3.36 },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar (nul- en volgmeting)',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday', 'Entree Federatie', 'NUMO', 'Readspeaker'],
        keyFeatures: [
          'Adaptief toetsen (past zich aan aan niveau)',
          'Koppeling met NUMO voor remediëring',
          'Diawisk apart beschikbaar voor wiskundig redeneren',
          'Groeiwijzer rapportagetool',
        ],
        constructs: ['Rekenniveau', 'Wiskundig redeneren', 'Probleemoplossen'],
      },
      jij: {
        productName: 'JIJ! Rekenen-Wiskunde',
        subProducts: [
          { name: 'Rekenen-Wiskunde', description: 'Referentieniveaus 0F-4F', separatePrice: null },
          { name: 'Woordeloze Rekentoets', description: 'ISK-variant zonder talige component', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptieve toetsroutes',
        measurementFrequency: 'Vrij inplanbaar (geen vast afnamemoment)',
        targetGroup: 'VO klas 1-4 + praktijkonderwijs',
        integrations: ['Magister (betaald)', 'Somtoday (betaald)', 'Presentis', 'NUMO'],
        keyFeatures: [
          'Adaptieve toetsroutes (ook praktijkonderwijs)',
          'Woordeloze rekentoets voor ISK-leerlingen',
          'Vrij afnamemoment',
          'Beveiligd toetsen via Schoolyear',
        ],
        constructs: ['Rekenvaardigheid', 'Referentieniveaus 0F-4F'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // NEDERLANDS
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'nederlands',
    providers: {
      cito: {
        productName: 'Leerling in beeld — Kernvaardigheden (Nederlandsdeel)',
        subProducts: [
          { name: 'Kernvaardighedentoets T0-T3', description: 'Nederlands (begrijpend lezen)', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '4 toetsmomenten over 3 leerjaren',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Gebundeld met Rekenwiskunde en Engels',
          'Remediëring via methodeaanbieders',
        ],
        constructs: ['Begrijpend lezen', 'Taalvaardigheid', 'Referentieniveaus 1F-3F'],
      },
      dia: {
        productName: 'DIA Nederlands (losse modules of pakket)',
        subProducts: [
          { name: 'Diatekst NE', description: 'Begrijpend lezen Nederlands', separatePrice: 3.36 },
          { name: 'Diawoord NE', description: 'Woordenschat Nederlands', separatePrice: 3.36 },
          { name: 'Pakket NE', description: 'Diatekst + Diawoord samen', separatePrice: 5.84 },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday', 'Entree Federatie', 'NUMO'],
        keyFeatures: [
          'Lezen en woordenschat apart toetsbaar',
          'Tekstenlab NE oefenmateriaal (€530/jaar/school)',
          'Koppeling met NUMO voor remediëring',
        ],
        constructs: ['Begrijpend lezen', 'Woordenschat'],
      },
      jij: {
        productName: 'JIJ! Nederlands',
        subProducts: [
          { name: 'Nederlands Lezen', description: 'Referentieniveaus 0F-4F', separatePrice: null },
          { name: 'Nederlands Schrijven', description: 'Referentieniveaus 1F-4F', separatePrice: null },
          { name: 'Nederlands Taalvaardigheid', description: 'Taalgebruik en woordenschat', separatePrice: null },
          { name: 'NT2 Toetsen', description: 'Nederlands als tweede taal (ISK)', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptieve toetsroutes',
        measurementFrequency: 'Vrij inplanbaar',
        targetGroup: 'VO klas 1-4 + ISK',
        integrations: ['Magister (betaald)', 'Somtoday (betaald)', 'Presentis'],
        keyFeatures: [
          'Meest uitgebreid: lezen + schrijven + taalvaardigheid',
          'NT2-toetsen voor ISK-leerlingen (uniek)',
          'Referentieniveaus 0F-4F',
        ],
        constructs: ['Begrijpend lezen', 'Schrijfvaardigheid', 'Taalvaardigheid', 'Woordenschat'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENGELS
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'engels',
    providers: {
      cito: {
        productName: 'Leerling in beeld — Kernvaardigheden (Engelsdeel)',
        subProducts: [
          { name: 'Kernvaardighedentoets T0-T3', description: 'Engels (begrijpend lezen)', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '4 toetsmomenten over 3 leerjaren',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Gebundeld met Rekenwiskunde en Nederlands',
          'Enige aanbieder met gevalideerde VO-toets Engels in LVS',
        ],
        constructs: ['Begrijpend lezen Engels', 'ERK-niveaus'],
      },
      dia: {
        productName: 'DIA Engels (pakket)',
        subProducts: [
          { name: 'Diatekst EN', description: 'Begrijpend lezen Engels', separatePrice: 3.36 },
          { name: 'Diawoord EN', description: 'Woordenschat Engels', separatePrice: 3.36 },
          { name: 'Pakket EN compleet', description: 'Diatekst + Diawoord samen', separatePrice: 5.84 },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday', 'Entree Federatie'],
        keyFeatures: [
          'Lezen en woordenschat apart toetsbaar',
          'Tekstenlab EN oefenmateriaal (€315/jaar/school)',
        ],
        constructs: ['Begrijpend lezen Engels', 'Woordenschat Engels'],
      },
      jij: {
        productName: 'JIJ! Engels (+ andere MVT)',
        subProducts: [
          { name: 'Engels Lezen', description: 'ERK A1-B2/C1', separatePrice: null },
          { name: 'Engels Luisteren', description: 'ERK A1-B2/C1', separatePrice: null },
          { name: 'Frans Lezen + Luisteren', description: 'ERK A1-B2', separatePrice: null },
          { name: 'Duits Lezen + Luisteren', description: 'ERK A1-B2', separatePrice: null },
          { name: 'Spaans Lezen + Luisteren', description: 'ERK A1-B2', separatePrice: null },
        ],
        testFormat: 'Digitaal + kijk-/luistertoetsen',
        measurementFrequency: 'Vrij inplanbaar',
        targetGroup: 'VO klas 1-4',
        integrations: ['Magister (betaald)', 'Somtoday (betaald)'],
        keyFeatures: [
          'Breedste MVT-aanbod: Engels + Frans + Duits + Spaans',
          'Lezen én luisteren (Cito/DIA: alleen lezen)',
          'ERK-geijkt',
          'Kijk-/luistertoetsen als schoolexamen beschikbaar',
        ],
        constructs: ['Begrijpend lezen', 'Luistervaardigheid', 'ERK-niveaus A1-C1'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // TAALVERZORGING
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'taalverzorging',
    providers: {
      cito: {
        productName: 'Leerling in beeld — Taalverzorging',
        subProducts: [
          { name: 'Taalverzorging T0-T3', description: 'Spelling en grammatica', separatePrice: 3.75 },
        ],
        testFormat: 'Digitaal',
        measurementFrequency: '4 toetsmomenten over 3 leerjaren',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Los beschikbaar of in Plus-bundel',
          'Specifieke toets voor spelling en grammatica',
        ],
        constructs: ['Spelling', 'Grammatica'],
      },
      dia: {
        productName: 'Diaspel',
        subProducts: [
          { name: 'Diaspel', description: 'Digitaal dictee voor spelling', separatePrice: 3.36 },
          { name: 'Diaplus Spellab', description: 'Oefenplatform voor spelling (apart product)', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief dictee',
        measurementFrequency: '2x per jaar',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Adaptief digitaal dictee',
          'Spellab: innovatief oefenplatform (apart product)',
          'Ook in Pakket NE compleet (€8,58)',
        ],
        constructs: ['Spelling via digitaal dictee'],
      },
      // JIJ! biedt geen apart taalverzorgingsproduct
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SOCIAAL-EMOTIONEEL
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'sociaal-emotioneel',
    providers: {
      cito: {
        productName: 'Leerling in beeld — SEF + Leer-werkhouding',
        subProducts: [
          { name: 'SEF (Sociaal-emotioneel functioneren)', description: '50 items, 6 schalen', separatePrice: 3.00 },
          { name: 'Leer-werkhouding (LWH)', description: '36 items, 14 schalen', separatePrice: 3.00 },
        ],
        testFormat: 'Digitaal, leerlingvragenlijst',
        measurementFrequency: '2x per jaar (najaar + voorjaar)',
        targetGroup: 'VO klas 1-3',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Breedste constructen: 6 SEF + 14 LWH-schalen',
          'Signalering op 3 niveaus (goed/let op/let extra op)',
          'Handreiking SEF voor begeleiding',
          'Deelbaar met Inspectie (sociale veiligheid)',
          'Onderdeel van breder LVS (één platform)',
        ],
        constructs: [
          'Sociaal zelfbeeld', 'Cognitief zelfbeeld', 'Schoolbeleving',
          'Veiligheid', 'Prosociaal gedrag', 'Zelfvertrouwen',
          'Emotieregulatie', 'Werkgeheugen', 'Luister-/werkhouding',
          'Flexibiliteit', 'Plannen', 'Organiseren', 'Metacognitie',
        ],
      },
      jij: {
        productName: 'JIJ! Hart & Handen (zelfevaluaties)',
        subProducts: [
          { name: 'Creatief Vermogen', description: 'Zelfevaluatie 21e-eeuwse vaardigheid', separatePrice: null },
          { name: 'Leerbenadering', description: 'Zelfevaluatie leeraanpak', separatePrice: null },
          { name: 'Sociale Context', description: 'Zelfevaluatie sociaal functioneren', separatePrice: null },
        ],
        testFormat: 'Digitaal, zelfevaluatie',
        measurementFrequency: 'Vrij inplanbaar',
        targetGroup: 'VO klas 1-4',
        integrations: ['Magister (betaald)', 'Somtoday (betaald)'],
        keyFeatures: [
          'Geen meerprijs (onderdeel basislicentie)',
          '21e-eeuwse vaardigheden',
          'Zelfevaluatie (geen extern gevalideerd instrument)',
        ],
        constructs: [
          'Trots op werk', 'Nieuwsgierigheid', 'Vindingrijkheid', 'Volharding',
          'Doorzettingsvermogen', 'Organiserend vermogen', 'Plannen',
          'Leerplek thuis', 'Ouders/verzorgers', 'Vrienden',
        ],
      },
      saqi: {
        productName: 'SAQI — School Attitude Questionnaire Internet',
        subProducts: [
          { name: 'Leerlingvragenlijst', description: 'Gem. 87 items (adaptief)', separatePrice: 3.50 },
          { name: 'Docentvragenlijst', description: '18 vragen (optioneel)', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief (gem. 87 i.p.v. 144 items)',
        measurementFrequency: 'Vrij inplanbaar',
        targetGroup: 'VO klas 1-4 + SO/PRO',
        integrations: [],
        keyFeatures: [
          'COTAN-gecertificeerd',
          'Adaptief: kortere afname (~20 min)',
          'Deelbaar met Inspectie (sociale veiligheid)',
          'Docentenbeoordeling beschikbaar',
          'SAQI OpMaat voor SO/PRO',
          'Onafhankelijk van LVS-aanbieder',
        ],
        constructs: [
          'Welbevinden', 'Plezier op school', 'Relatie leerkrachten',
          'Schoolveiligheid', 'Zelfvertrouwen', 'Sociale vaardigheid',
          'Motivatie', 'Concentratie', 'Huiswerkhouding',
          'Pestgedrag', 'Betrouwbaarheid', 'Antwoordneigingen',
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // COGNITIEVE CAPACITEITEN
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'cognitieve-capaciteiten',
    providers: {
      cito: {
        productName: 'Cognitieve capaciteitentoets (CCT)',
        subProducts: [
          { name: 'CCT', description: 'Cognitieve capaciteiten meten', separatePrice: 6.50 },
        ],
        testFormat: 'Digitaal',
        measurementFrequency: '1x (bij instroom of jaarlijks)',
        targetGroup: 'VO',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Marktleider in VO-markt',
          'Losse licentie (apart van LVS)',
        ],
        constructs: ['Cognitieve capaciteiten', 'Leerpotentieel'],
      },
      dia: {
        productName: 'Dia NSCCT',
        subProducts: [
          { name: 'NSCCT digitaal', description: 'Niet-schoolse cognitieve capaciteitentoets (digitaal)', separatePrice: 9.75 },
          { name: 'NSCCT papier', description: 'Niet-schoolse cognitieve capaciteitentoets (papier)', separatePrice: 4.50 },
        ],
        testFormat: 'Digitaal of papier',
        measurementFrequency: '1x',
        targetGroup: 'VO',
        integrations: ['Magister', 'Somtoday'],
        keyFeatures: [
          'Digitaal én papier beschikbaar',
          'Papierversie significant goedkoper (€4,50 vs €9,75)',
          'Niet-schoolse benadering',
        ],
        constructs: ['Niet-schoolse cognitieve capaciteiten'],
      },
      // JIJ! biedt geen cognitieve capaciteitentoets
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // LEER-WERKHOUDING
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'leer-werkhouding',
    providers: {
      cito: {
        productName: 'Leer-werkhouding (LWH)',
        subProducts: [
          { name: 'LWH Leerlingvragenlijst', description: '14 schalen: motivatie, concentratie, taakgerichtheid, zelfvertrouwen, faalangst, etc.', separatePrice: null },
        ],
        testFormat: 'Digitaal, zelfrapportage leerling',
        measurementFrequency: '1-2x per jaar',
        targetGroup: 'Leerjaar 1-3 VO',
        integrations: ['Cito LVS platform', 'Magister', 'SomToday'],
        keyFeatures: ['14 schalen voor breed welzijnsbeeld', 'Combineerbaar met SEF in Plus-bundel', 'Signalering op individueel en groepsniveau'],
        constructs: ['motivatie', 'concentratie', 'taakgerichtheid', 'zelfvertrouwen', 'faalangst', 'welbevinden'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // FRANS
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'frans',
    providers: {
      jij: {
        productName: 'JIJ! Frans',
        subProducts: [
          { name: 'Lezen Frans', description: 'ERK-geijkte leestoets A1-B2', separatePrice: null },
          { name: 'Luisteren Frans', description: 'ERK-geijkte luistertoets A1-B2', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar (nul- en volgmeting)',
        targetGroup: 'Leerjaar 1-6 VO',
        integrations: ['Magister', 'SomToday'],
        keyFeatures: ['ERK-niveaus A1-B2', 'Kijk-/luistertoetsen als SE-alternatief', 'Formatief en summatief'],
        constructs: ['leesvaardigheid Frans', 'luistervaardigheid Frans'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // DUITS
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'duits',
    providers: {
      jij: {
        productName: 'JIJ! Duits',
        subProducts: [
          { name: 'Lezen Duits', description: 'ERK-geijkte leestoets A1-B2', separatePrice: null },
          { name: 'Luisteren Duits', description: 'ERK-geijkte luistertoets A1-B2', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar (nul- en volgmeting)',
        targetGroup: 'Leerjaar 1-6 VO',
        integrations: ['Magister', 'SomToday'],
        keyFeatures: ['ERK-niveaus A1-B2', 'Kijk-/luistertoetsen als SE-alternatief', 'Formatief en summatief'],
        constructs: ['leesvaardigheid Duits', 'luistervaardigheid Duits'],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // SPAANS
  // ═══════════════════════════════════════════════════════════════════
  {
    moduleId: 'spaans',
    providers: {
      jij: {
        productName: 'JIJ! Spaans',
        subProducts: [
          { name: 'Lezen Spaans', description: 'ERK-geijkte leestoets A1-B2', separatePrice: null },
          { name: 'Luisteren Spaans', description: 'ERK-geijkte luistertoets A1-B2', separatePrice: null },
        ],
        testFormat: 'Digitaal, adaptief',
        measurementFrequency: '2x per jaar (nul- en volgmeting)',
        targetGroup: 'Leerjaar 1-6 VO',
        integrations: ['Magister', 'SomToday'],
        keyFeatures: ['ERK-niveaus A1-B2', 'Kijk-/luistertoetsen als SE-alternatief', 'Formatief en summatief'],
        constructs: ['leesvaardigheid Spaans', 'luistervaardigheid Spaans'],
      },
    },
  },
];

/**
 * Get module content for a specific module
 */
export function getModuleContent(moduleId: string): ModuleContentMap | undefined {
  return PROVIDER_MODULE_CONTENT.find((m) => m.moduleId === moduleId);
}
