import type { DmuTag } from '@/features/export/utils/dmu-tag-filter';

export interface CitoProductAdvantage {
  moduleId: string;
  advantage: string;
  context: string;
  tags: DmuTag[];
  source: string;
}

/**
 * Tagged Cito product advantages per module, with source citations.
 * Used in DMU-targeted export reports to show relevant advantages per audience.
 */
export const CITO_PRODUCT_ADVANTAGES: CitoProductAdvantage[] = [
  // --- Rekenwiskunde ---
  {
    moduleId: 'rekenwiskunde',
    advantage: 'Adaptieve toetsafname past zich aan per leerling',
    context:
      'De Cito Kernvaardighedentoets voor rekenwiskunde past het moeilijkheidsniveau automatisch aan op basis van de antwoorden van de leerling. Dit levert nauwkeurigere resultaten op en voorkomt frustratie bij leerlingen die ver onder of boven het gemiddelde presteren.',
    tags: ['kwaliteit', 'dagelijks-gebruik'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },
  {
    moduleId: 'rekenwiskunde',
    advantage: 'Remediering via methodeaanbieders direct beschikbaar',
    context:
      'Na afname van de toets kunnen docenten direct doorverwijzen naar passend oefenmateriaal van methodeaanbieders. Dit bespaart tijd bij het zoeken naar geschikte vervolgstappen en maakt de toetsresultaten direct bruikbaar in de lespraktijk.',
    tags: ['tijdwinst', 'dagelijks-gebruik'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },

  // --- Nederlands ---
  {
    moduleId: 'nederlands',
    advantage: 'Gebundeld met Rekenwiskunde en Engels in kernvaardigheden',
    context:
      'De Cito Kernvaardighedentoets bundelt Nederlands, Rekenwiskunde en Engels in een geintegreerd pakket. Scholen hoeven niet per vak apart in te kopen, wat de administratieve last verlaagt en een voordeliger totaalprijs oplevert dan losse modules bij concurrenten.',
    tags: ['financieel', 'tijdwinst'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },

  // --- Engels ---
  {
    moduleId: 'engels',
    advantage: 'Enige aanbieder met gevalideerde VO-toets Engels in LVS',
    context:
      'Cito is de enige aanbieder die een wetenschappelijk gevalideerde toets Engels aanbiedt als onderdeel van het leerlingvolgsysteem voor het voortgezet onderwijs. DIA biedt wel Engels aan, maar zonder de langjarige validatiehistorie van Cito. Dit maakt Cito de veiligste keuze voor scholen die de voortgang Engels willen monitoren.',
    tags: ['kwaliteit', 'compliance'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },

  // --- Taalverzorging ---
  {
    moduleId: 'taalverzorging',
    advantage: 'Specifieke toets voor spelling en grammatica',
    context:
      'Cito biedt een apart taalverzorgingsproduct dat spelling en grammatica gericht toetst. JIJ! (Bureau ICE) biedt geen taalverzorgingsmodule aan. Dit maakt Cito de keuze voor scholen die taalverzorging expliciet willen monitoren naast begrijpend lezen.',
    tags: ['kwaliteit', 'strategisch'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },

  // --- Sociaal-emotioneel ---
  {
    moduleId: 'sociaal-emotioneel',
    advantage: 'Breedste constructen: 6 SEF-schalen + 14 LWH-schalen',
    context:
      'Cito meet sociaal-emotioneel functioneren op 6 schalen en leer-werkhouding op 14 schalen — het breedste aanbod in de markt. JIJ! biedt alleen zelfevaluaties zonder externe validatie. SAQI is COTAN-gecertificeerd maar meet minder constructen. Voor scholen die een compleet welzijnsbeeld willen, biedt Cito het meest uitgebreide instrument.',
    tags: ['kwaliteit', 'strategisch'],
    source: 'Bron: Cito Leerling in beeld Productsheet 2025',
  },
  {
    moduleId: 'sociaal-emotioneel',
    advantage: 'Deelbaar met Inspectie voor monitoring sociale veiligheid',
    context:
      'De SEF-resultaten zijn geschikt om te delen met de Inspectie van het Onderwijs in het kader van de wettelijke verplichting rondom sociale veiligheid. Scholen hoeven geen apart instrument aan te schaffen voor deze rapportageverplichting.',
    tags: ['compliance', 'tijdwinst'],
    source: 'Bron: Cito SEF Handleiding 2025',
  },

  // --- Cognitieve capaciteiten ---
  {
    moduleId: 'cognitieve-capaciteiten',
    advantage: 'Marktleider in VO-markt voor cognitieve capaciteitentoets',
    context:
      'De Cito CCT is de meest gebruikte cognitieve capaciteitentoets in het voortgezet onderwijs. De langjarige normering en brede adoptie maken resultaten vergelijkbaar tussen scholen. DIA biedt de NSCCT als alternatief, maar met een kleinere normeringsgroep.',
    tags: ['kwaliteit', 'strategisch'],
    source: 'Bron: Cito CCT Productsheet 2025',
  },

  // --- Platform-breed ---
  {
    moduleId: 'platform',
    advantage: 'Automatische rechten en planning op nieuw platform',
    context:
      'Het nieuwe Cito-platform automatiseert het toekennen van docentrechten, het resetten van toetsen en het plannen van afnamemomenten. Op het huidige platform en bij concurrenten zijn dit handmatige taken die per school tientallen uren per jaar kosten. De tijdwinst is direct merkbaar voor coordinatoren.',
    tags: ['tijdwinst', 'dagelijks-gebruik'],
    source: 'Bron: Cito Nieuw Platform Roadmap 2025',
  },
  {
    moduleId: 'platform',
    advantage: 'Entree-federatie single sign-on vervangt startcodes',
    context:
      'Leerlingen loggen in via Entree-federatie (gekoppeld aan Magister/Somtoday) in plaats van startcodes. Dit elimineert de meest voorkomende storingen bij toetsafname en bespaart docenten gemiddeld 10-15 minuten per toetsmoment aan inlogproblemen.',
    tags: ['tijdwinst', 'dagelijks-gebruik'],
    source: 'Bron: Cito Nieuw Platform Roadmap 2025',
  },
];
