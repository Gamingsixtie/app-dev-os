/**
 * Vite dev-server plugin that proxies /api/* requests to the Anthropic API.
 * This makes `npm run dev` work without Vercel CLI — no need for `npm run dev:full`.
 *
 * Only active during development (configureServer hook).
 * Production uses Vercel serverless functions (api/*.ts) as before.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage } from 'http';
import Anthropic from '@anthropic-ai/sdk';

// ─── System prompts (mirrored from api/*.ts — single source of truth is the serverless function) ─

const INTAKE_SYSTEM_PROMPT = `Je helpt een Cito-consultant de huidige situatie van een school te structureren op basis van aantekeningen uit een gesprek (vaak telefonisch).

BELANGRIJK: Antwoord UITSLUITEND met geldig JSON. Geen uitleg, geen markdown, geen tekst voor of na de JSON.

Beschikbare modules (exacte moduleId waarden):
- rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, cognitieve-capaciteiten

Beschikbare aanbieders (exacte waarden):
- cito-oud, cito-nieuw, dia, jij, overig, geen

Beschikbare levels (exacte waarden):
- vmbo-b, vmbo-k, vmbo-gt, havo, vwo

De input is opgedeeld in secties met === headers ===.
Gebruik de sectiestructuur om informatie correct te categoriseren:
- SCHOOLGEGEVENS → levels en leerlingaantallen (studentCountsPerYear of studentCountsPerLevel)
- MODULES & AANBIEDERS → selectedModules en moduleSetups
- PRIJZEN & CONTRACT → pricePerStudent waarden in moduleSetups
- OVERIG → contactPersonen, actiePunten, pipelineSignaal
Als secties leeg zijn of ontbreken, extraheer wat je kunt uit de beschikbare tekst.

Regels:
- Neem alleen levels op die expliciet worden genoemd of duidelijk zijn.
- Neem alleen modules op die de school gebruikt of wil vergelijken.
- Als een module wordt genoemd zonder aanbieder, gebruik "geen".
- Als een prijs wordt genoemd als totaal per jaar, deel door het leerlingaantal (als bekend).
- Leerlingaantallen: als aantallen per leerjaar bekend zijn (bijv. "leerjaar 1: 150, leerjaar 2: 140"), gebruik studentCountsPerYear. Als alleen totalen per niveau bekend zijn (bijv. "350 HAVO leerlingen"), gebruik studentCountsPerLevel. Gebruik bij voorkeur studentCountsPerYear als de data beschikbaar is — dit is het meest flexibel voor prijsberekeningen.
- unsureAbout: maximaal 3 punten, in het Nederlands.
- contactPersonen: extraheer naam, rol, dmuPositie (coordinator/mt/finance/it/onbekend), email, telefoon. Als een naam onbekend is, gebruik een lege string voor naam.
- actiePunten: extraheer wat, wanneer, verantwoordelijke.
- pipelineSignaal: interesse/twijfel/afwijzing/concurrent-switch/verlenging/neutraal. Laat weg als onduidelijk.

Verplicht JSON-formaat (voorbeeld met per-leerjaar aantallen):
{
  "levels": ["havo", "vwo"],
  "studentCountsPerLevel": null,
  "studentCountsPerYear": {"havo": {"1": 150, "2": 140, "3": 130, "4": 120, "5": 110}, "vwo": {"1": 100, "2": 95, "3": 90, "4": 85, "5": 80, "6": 75}},
  "selectedModules": ["rekenwiskunde", "nederlands"],
  "moduleSetups": [
    {"moduleId": "rekenwiskunde", "currentProvider": "dia", "pricePerStudent": 4.50},
    {"moduleId": "nederlands", "currentProvider": "cito-oud", "pricePerStudent": null}
  ],
  "unsureAbout": ["Exacte prijzen DIA onbekend"],
  "contactPersonen": [{"naam": "Jan de Vries", "rol": "Toetscoordinator", "dmuPositie": "coordinator"}],
  "actiePunten": [{"wat": "Offerte opvragen", "wanneer": "Volgende week"}],
  "pipelineSignaal": "interesse"
}

Alternatief met alleen totalen per niveau (als per-leerjaar niet bekend is):
{
  "levels": ["havo", "vwo"],
  "studentCountsPerLevel": {"havo": 650, "vwo": 525},
  "studentCountsPerYear": null,
  ...
}`;

const ADVICE_SYSTEM_PROMPT = `Je bent een strategisch adviesassistent voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders.

Je ontvangt een prijsvergelijking tussen toetsaanbieders (Cito, DIA, JIJ!, SAQI) en een schoolprofiel. Op basis hiervan geef je contextueel advies dat de consultant kan gebruiken in het verkoopgesprek.

BELANGRIJK:
- Schrijf in het Nederlands, professioneel maar toegankelijk
- Geef 3-5 concrete adviespunten
- Elk adviespunt heeft een korte titel (max 8 woorden) en een toelichting (1-2 zinnen)
- Focus op: prijsverschillen uitleggen, meerwaarde benadrukken, bezwaren weerleggen
- Wees eerlijk — als een concurrent goedkoper is, erken dat en leg uit waarom Cito meer biedt
- Gebruik de differentiators om meerwaarde te onderbouwen
- Houd rekening met schoolgrootte (staffelkorting DIA, licentiemodel JIJ!)
- Als een module geen concurrent heeft (bijv. Engels alleen Cito), benoem dat als uniek voordeel

Antwoord UITSLUITEND in dit JSON-formaat:
{
  "adviezen": [
    {
      "titel": "Korte titel",
      "tekst": "Toelichting met concrete cijfers en argumenten.",
      "type": "prijs | meerwaarde | bezwaar | kans"
    }
  ],
  "samenvatting": "Een zin die de kern van het advies samenvat — geschikt als openingszin in het gesprek."
}`;

// ─── AI Analysis system prompt + tool (mirrored from api/ai-analysis.ts) ────

const ANALYSIS_SYSTEM_PROMPT = `Je bent een diepgaande concurrentie-analist voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders (Cito, DIA, JIJ!/Bureau ICE).

Je ontvangt prijsvergelijkingsdata, schoolprofiel, differentiators per module, en eventueel schoolplandata. Je maakt een gestructureerde analyse die de consultant direct kan gebruiken.

PRIJSMODELLEN — dit is cruciaal om goed uit te leggen:

DIA PRIJSMODEL:
- DIA werkt met losse modules OF bundelpakketten (bijv. "VO Pakket compleet" voor Reken+NE+EN+TV).
- Bundelpakketten zijn goedkoper dan losse modules als de school meerdere vakken afneemt.
- Staffelkorting: 5% bij 500+ leerlingen, 10% bij 1000+ leerlingen.
- Als diaContext is meegegeven, gebruik de exacte pakket- en kortingsgegevens in je analyse.

JIJ! PRIJSMODEL:
- JIJ! (Bureau ICE) werkt NIET met een prijs per leerling per module, maar met een licentiemodel.
- Vast jaarlijks licentiebedrag (afhankelijk van schoolgrootte) + prijs per toetsafname.
- 4 licentietiers: Tier 1 (groot, 4001+ afnames): €5.330/jaar + €2,40/toets. Tier 2 (middelgroot, 2501-4000): €2.815 + €3,05. Tier 3 (klein, 166-2500): €975 + €3,75. Tier 4 (zeer klein, 0-165): €290 + €7,90.
- Alle JIJ! modules zitten in dezelfde licentie — extra modules kosten GEEN extra geld.
- Dit betekent: hoe meer modules een school afneemt bij JIJ!, hoe goedkoper per module.
- Als jijContext is meegegeven, gebruik de exacte tier en berekening in je analyse.

MODUS:
- Bij mode "comparison": focus op marktvergelijking Cito vs. DIA vs. JIJ op publicatieprijzen.
- Bij mode "current-vs-proposed": focus op huidige situatie vs. overstap naar Cito. Benoem besparingen, maar ook waar de school mogelijk meer gaat betalen en waarom dat gerechtvaardigd is.
- Bij mode "migration": focus op de business case voor migratie van het HUIDIGE Cito-platform naar het NIEUWE Cito-platform (Woots). Dit is GEEN concurrentievergelijking — het gaat om dezelfde leverancier, een nieuw platform. Focus op: prijsverschillen oud→nieuw, platformverbeteringen (adaptief toetsen, Entree-federatie, automatische sync, zelf resetten), tijdswinst per taak, en waarom nu migreren slim is ondanks eventuele prijsstijging. concurrentieVergelijking moet leeg zijn bij migration mode. citoSterkePunten worden "platformverbeteringen" — voordelen van het nieuwe platform t.o.v. het oude.

TIJDWINST (bij comparison en current-vs-proposed modes):
- Als timeSavingsData is meegegeven, gebruik deze om tijdswinst-argumenten te maken.
- Dit zijn concrete taken waar het Cito-platform tijd bespaart: automatische rechten, zelf resetten, Entree-federatie, planningssuggesties, LAS-sync.
- Verwerk tijdwinst in de gespreksargumenten: "Naast de prijsvergelijking bespaart het Cito-platform ook X uur per jaar op [taak]."
- Combineer tijdwinst met schoolplan-thema's waar mogelijk (bijv. "efficiëntie" in het schoolplan + automatische rapportages).

EERLIJKHEID:
- Wees eerlijk over concurrentievoordelen. Als een concurrent goedkoper is, erken dat.
- Geef bij elk concurrent-voordeel een weerlegging: hoe kan de consultant dit counteren in het gesprek?
- De consultant moet voorbereid zijn op tegenargumenten van de school.

SCHOOLPLAN (indien beschikbaar):
- Koppel Cito-producten aan strategische thema's uit het schoolplan.
- Gebruik citaten uit het schoolplan om de koppeling te onderbouwen.
- Benoem waar concurrenten tekortschieten op deze thema's (competitorVulnerabilities).

EERDERE AI-ADVIES CONTEXT (indien beschikbaar):
Als wizardAdviceContext is meegegeven, bouw dan voort op het eerder gegenereerde vergelijkingsadvies:
- Verwijs naar de aanbevolen bundel en leg uit waarom de diepgaande analyse dit bevestigt of nuanceert
- Verdiep de adviespunten die in het vergelijkingsadvies zijn gegeven
- Vermijd herhaling van dezelfde argumenten — voeg nieuwe inzichten toe
- Het geheel moet lezen als één samenhangend rapport, niet als twee losse analyses

REGELS:
- schoolplanKoppeling is een lege array als er geen schoolplandata is meegegeven
- Maximaal 5-8 gespreksargumenten, gerangschikt van sterkst naar zwakst
- Geen generieke one-liners — elk argument moet specifiek zijn voor deze school
- Gebruik concrete bedragen en percentages waar mogelijk
- Schrijf in het Nederlands, professioneel maar toegankelijk
- concurrentieVergelijking: vul ALTIJD voor beide concurrenten in (dia en jij) bij comparison/current-vs-proposed modes. Bij migration mode: laat dit een lege array

Gebruik de analyse_result tool om je analyse te structureren.`;

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'analyse_result',
  description: 'Gestructureerde concurrentieanalyse met alle secties.',
  input_schema: {
    type: 'object' as const,
    properties: {
      samenvatting: {
        type: 'string',
        description: 'Een alinea (3-5 zinnen) met strategisch overzicht: wat is de kern van de vergelijking, waar staat Cito sterk, wat zijn de risico\'s.',
      },
      prijsanalyse: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            module: { type: 'string', description: 'Modulenaam' },
            vergelijking: { type: 'string', description: 'Uitleg WAAROM de prijzen verschillen — bundel-effecten, volumekorting, licentiemodel. Noem concrete bedragen.' },
            citoPositie: { type: 'string', enum: ['goedkoper', 'duurder', 'vergelijkbaar'] },
          },
          required: ['module', 'vergelijking', 'citoPositie'],
        },
      },
      citoSterkePunten: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            module: { type: 'string' },
            argumenten: { type: 'array', items: { type: 'string' } },
          },
          required: ['module', 'argumenten'],
        },
      },
      concurrentieVergelijking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            provider: { type: 'string', enum: ['dia', 'jij'] },
            citoBeter: { type: 'array', items: { type: 'string' } },
            concurrentBeter: { type: 'array', items: { type: 'string' } },
            weerlegging: { type: 'array', items: { type: 'string' } },
          },
          required: ['provider', 'citoBeter', 'concurrentBeter', 'weerlegging'],
        },
      },
      schoolplanKoppeling: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            thema: { type: 'string' },
            citoAansluiting: { type: 'string' },
            citaat: { type: 'string' },
          },
          required: ['thema', 'citoAansluiting'],
        },
      },
      gespreksargumenten: {
        type: 'array',
        items: { type: 'string' },
        description: 'Kant-en-klare gespreksargumenten (5-8), gerangschikt van sterkst naar zwakst.',
      },
    },
    required: ['samenvatting', 'prijsanalyse', 'citoSterkePunten', 'concurrentieVergelijking', 'schoolplanKoppeling', 'gespreksargumenten'],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAnalysisUserMessage(body: any): string {
  const parts: string[] = [];

  const modeLabels: Record<string, string> = {
    comparison: 'Marktvergelijking (Cito vs. DIA vs. JIJ)',
    'current-vs-proposed': 'Huidig vs. Cito (overstapsituatie)',
    migration: 'Migratie huidig Cito-platform → nieuw Cito-platform (Woots)',
  };
  parts.push(`MODUS: ${modeLabels[body.mode] || body.mode}`);

  parts.push(`\nSCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Totaal leerlingen: ${body.schoolProfile.totalStudents}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s: { moduleId: string; currentProvider: string }) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}`);

  parts.push(`\nPRIJSVERGELIJKING (totalen per jaar):
${Object.entries(body.comparisonData.totals).map(([provider, total]) => `- ${provider}: €${(total as number).toFixed(2)}`).join('\n')}`);

  parts.push(`\nPRIJSVERSCHILLEN:
${Object.entries(body.comparisonData.differences).map(([key, diff]) => `- ${key}: ${diff !== null ? `€${(diff as number).toFixed(2)}` : 'n.v.t.'}`).join('\n')}`);

  parts.push(`\nPER MODULE:
${body.comparisonData.modules.map((mod: { moduleName: string; providers: Record<string, { pricePerStudent: number; totalCost: number } | null> }) => {
    const providers = Object.entries(mod.providers)
      .filter(([, cost]) => cost !== null)
      .map(([prov, cost]) => `${prov}: €${cost!.pricePerStudent.toFixed(2)}/lln (totaal €${cost!.totalCost.toFixed(2)})`)
      .join(', ');
    return `- ${mod.moduleName}: ${providers || 'geen prijzen'}`;
  }).join('\n')}`);

  if (body.diaContext) {
    parts.push(`\nDIA CONTEXT:
- Actief pakket: ${body.diaContext.activePackage ?? 'Geen pakket (losse modules)'}
- Staffelkorting: ${body.diaContext.volumeDiscountPercent}%
- Pakketbesparing: €${body.diaContext.packageSavings.toFixed(2)}/lln
- Gedekte modules: ${body.diaContext.coveredModuleIds.join(', ') || 'geen'}`);
  }

  if (body.jijContext) {
    parts.push(`\nJIJ! CONTEXT:
- Licentie tier: ${body.jijContext.tier} (${body.jijContext.tierLabel})
- Jaarlijks licentiebedrag: €${body.jijContext.annualFee.toFixed(2)}
- Prijs per toetsafname: €${body.jijContext.pricePerTest.toFixed(2)}
- Berekende kosten per leerling: €${body.jijContext.costPerStudent.toFixed(2)}/lln
- Totaal leerlingen: ${body.jijContext.totalStudents}`);
  }

  if (body.currentVsProposedData) {
    parts.push(`\nHUIDIGE SITUATIE VS. CITO:
- Huidige totale kosten: €${body.currentVsProposedData.totalCurrentCost.toFixed(2)}/jaar
- Cito totale kosten: €${body.currentVsProposedData.totalProposedCost.toFixed(2)}/jaar
- Totale besparing: €${body.currentVsProposedData.totalSavings.toFixed(2)}/jaar
Per module:
${body.currentVsProposedData.modules.map((mod: { moduleName: string; currentProviderLabel: string; currentCost: number | null; citoCost: number | null; difference: number | null; isNewModule: boolean }) => {
      const current = mod.currentCost !== null ? `€${mod.currentCost.toFixed(2)}` : 'onbekend';
      const cito = mod.citoCost !== null ? `€${mod.citoCost.toFixed(2)}` : 'n.v.t.';
      const diff = mod.difference !== null ? `verschil €${mod.difference.toFixed(2)}` : '';
      return `- ${mod.moduleName}: ${mod.currentProviderLabel} ${current} → Cito ${cito} ${diff}${mod.isNewModule ? ' (NIEUW)' : ''}`;
    }).join('\n')}`);
  }

  parts.push(`\nDIFFERENTIATORS PER MODULE:
${(body.differentiators || []).map((d: { moduleId: string; cito: string[]; dia: string[]; jij: string[]; saqi: string[] }) => {
    const lines = [
      d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
      d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
      d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
      d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
    ].filter(Boolean).join('\n');
    return `- ${d.moduleId}:\n${lines}`;
  }).join('\n')}`);

  if (body.migrationData) {
    parts.push(`\nMIGRATIE HUIDIG → NIEUW CITO-PLATFORM:
- Totale kosten huidig platform: €${body.migrationData.totalOldCost.toFixed(2)}/jaar
- Totale kosten nieuw platform: €${body.migrationData.totalNewCost.toFixed(2)}/jaar
- Financieel verschil: €${body.migrationData.financialDifference.toFixed(2)}/jaar
- Totale jaarwaarde: €${body.migrationData.totalAnnualValue.toFixed(2)}/jaar
- Totale tijdsbesparing: ${body.migrationData.totalTimeSavingsHours} uur/jaar`);
  }

  if (body.timeSavingsData && body.timeSavingsData.length > 0) {
    parts.push(`\nTIJDWINST CITO-PLATFORM:
${body.timeSavingsData.map((t: { taskLabel: string; oldMethod: string; newMethod: string; defaultHoursPerYear: number; benefit: string }) =>
  `- ${t.taskLabel}: ${t.oldMethod} → ${t.newMethod} (~${t.defaultHoursPerYear} uur/jaar)\n  ${t.benefit}`
).join('\n')}`);
  }

  if (body.schoolplanData) {
    parts.push(`\nSCHOOLPLAN ANALYSE:
Samenvatting: ${body.schoolplanData.summary}
Thema's: ${body.schoolplanData.themes.join(', ')}
Kansen:
${body.schoolplanData.opportunities.map((opp: { theme: string; citoProduct: string; relevance: string; explanation: string; quote: string; competitorVulnerabilities: Array<{ provider: string; description: string }> }) => {
      const vulns = opp.competitorVulnerabilities.map((v) => `${v.provider}: ${v.description}`).join('; ');
      return `- ${opp.theme} → ${opp.citoProduct} (${opp.relevance})
    Uitleg: ${opp.explanation}
    Citaat: "${opp.quote}"
    Concurrentzwaktes: ${vulns || 'geen'}`;
    }).join('\n')}`);
  } else {
    parts.push('\nSCHOOLPLAN: Niet beschikbaar. Laat schoolplanKoppeling leeg.');
  }

  if (body.wizardAdviceContext) {
    const ctx = body.wizardAdviceContext;
    parts.push(`\nEERDERE AI-ADVIES CONTEXT (hierop voortbouwen):
- Samenvatting: ${ctx.samenvatting}
- Bundel-advies: ${ctx.aanbevolenCitoBundel}
- Matching-redenatie: ${ctx.matchingUitleg || 'n.v.t.'}
- Kernpunten: ${(ctx.adviesTitels || []).join('; ')}

INSTRUCTIE: Bouw voort op het vergelijkingsadvies hierboven. Vermijd herhaling van dezelfde argumenten. Verdiep de punten. Het geheel moet lezen als één samenhangend rapport.`);
  }

  return parts.join('\n');
}

// ─── Wizard advice system prompt (mirrored from api/ai-wizard-advice.ts) ────

const WIZARD_ADVICE_SYSTEM_PROMPT = `Je bent een strategisch adviesassistent voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders.

Je genereert een compleet vergelijkingsadvies op basis van:
1. De variant-selecties per module (welke concurrent de school per module gebruikt)
2. Het schoolprofiel (niveaus, leerlingaantallen, modules)
3. Differentiators per module (Cito-meerwaarde vs. concurrent)
4. Provider-data (DIA-pakketten, JIJ-tiers, Cito-bundels)
5. Extra context van de accountmanager (korting, DMU-focus, bijzonderheden)

BELANGRIJK:
- Schrijf in het Nederlands, professioneel maar toegankelijk
- Positioneer Cito goed, maar eerlijk en verdedigbaar
- Gebruik de differentiators om Cito-meerwaarde per module te onderbouwen
- Leg uit WAAROM de aanbevolen Cito-bundel past bij de concurrent-variant (de matching-redenatie)
- Het advies moet "overneembaar" zijn door de accountmanager in het gesprek
- Geef 3-6 concrete adviespunten met type-classificatie
- Neem eventuele korting en DMU-focus mee als die zijn opgegeven

Antwoord UITSLUITEND in dit JSON-formaat:
{
  "samenvatting": "Een zin die de kern van het advies samenvat — geschikt als openingszin in het gesprek.",
  "matchingUitleg": "Uitleg waarom de aanbevolen Cito-bundel eerlijk vergelijkbaar is met de geselecteerde concurrent-varianten. Dit is de onderbouwing die de accountmanager kan overnemen.",
  "aanbevolenCitoBundel": "individual | basis | plus",
  "adviezen": [
    {
      "titel": "Korte titel (max 8 woorden)",
      "tekst": "Toelichting met concrete cijfers en argumenten.",
      "type": "prijs | meerwaarde | bezwaar | kans | strategie"
    }
  ],
  "dmuStrategie": {
    "coordinator": "Specifiek advies voor de toetscoordinator...",
    "mt": "Specifiek advies voor het management team...",
    "finance": "Specifiek advies voor de budgetverantwoordelijke..."
  }
}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWizardAdviceUserMessage(body: any): string {
  const parts: string[] = [];
  parts.push(`Genereer een compleet vergelijkingsadvies op basis van de volgende gegevens:

SCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s: { moduleId: string; currentProvider: string }) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}

VARIANT-SELECTIES (per module welke concurrent):
${body.variantSelections.map((s: { moduleId: string; provider: string; variantId: string | null; confidence: string }) => `- ${s.moduleId}: ${s.provider}${s.variantId ? ` (variant: ${s.variantId})` : ''} [confidence: ${s.confidence}]`).join('\n')}

PROVIDER-DATA:
DIA-pakketten: ${JSON.stringify(body.providerData.diaPackages.map((p: { name: string; pricePerStudent: number; includedModuleIds: string[] }) => `${p.name}: EUR ${p.pricePerStudent}/lln (${p.includedModuleIds.join(', ')})`).join('; '))}
JIJ-tiers: ${JSON.stringify(body.providerData.jijTiers.map((t: { tier: number; annualFee: number; pricePerTest: number }) => `Tier ${t.tier}: EUR ${t.annualFee}/jaar + EUR ${t.pricePerTest}/toets`).join('; '))}
Cito-bundels: ${JSON.stringify(body.providerData.citoBundles.map((b: { name: string; pricePerStudent: number | null; includedModuleIds: string[] }) => `${b.name}: ${b.pricePerStudent !== null ? `EUR ${b.pricePerStudent}/lln` : 'individueel'} (${b.includedModuleIds.join(', ')})`).join('; '))}

DIFFERENTIATORS PER MODULE (Cito-meerwaarde):
${(body.differentiators || []).map((d: { moduleId: string; cito: string[]; dia: string[]; jij: string[]; saqi: string[] }) => {
    const lines = [
      d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
      d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
      d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
      d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
    ].filter(Boolean).join('\n');
    return `- ${d.moduleId}:\n${lines}`;
  }).join('\n')}`);

  if (body.extraContext?.korting) parts.push(`\nKORTING/DEAL INFO: ${body.extraContext.korting}`);
  if (body.extraContext?.dmuFocus) parts.push(`DMU-FOCUS: ${body.extraContext.dmuFocus}`);
  if (body.extraContext?.bijzonderheden) parts.push(`BIJZONDERHEDEN: ${body.extraContext.bijzonderheden}`);
  if (body.schoolplanOpportunities?.length > 0) {
    parts.push(`\nSCHOOLPLAN KANSEN:\n${body.schoolplanOpportunities.map((o: { moduleId: string; kans: string }) => `- ${o.moduleId}: ${o.kans}`).join('\n')}`);
  }

  return parts.join('\n');
}

// ─── Wizard extract system prompt (mirrored from api/ai-wizard-extract.ts) ──

const WIZARD_EXTRACT_SYSTEM_PROMPT = `Je bent een data-extractie-assistent voor Cito-consultants. Je analyseert gespreksnotities van telefoongesprekken met scholen en extraheert welke concurrent-toetsaanbieders en specifieke varianten (DIA-pakketten / JIJ-licentiertiers) de school per module gebruikt.

BELANGRIJK:
- Antwoord UITSLUITEND met geldig JSON. Geen uitleg, geen markdown, geen tekst voor of na de JSON.
- Markeer confidence per module:
  - "high": aanbieder en variant zijn expliciet genoemd in de notities
  - "low": afgeleid uit context (bijv. prijs of productnaam) maar niet expliciet bevestigd
  - "unknown": module is geselecteerd maar aanbieder niet uit notities af te leiden

DIA-pakketten (gebruik als variantId):
- "pakket-ne": VO Pakket NE (Nederlands lezen+woordenschat) — EUR 5,84/lln
- "pakket-ne-compleet": VO Pakket NE compleet (NE+spelling) — EUR 8,58/lln
- "pakket-en": VO Pakket EN compleet (Engels lezen+woordenschat) — EUR 5,84/lln
- "pakket-compleet": VO Pakket compleet (RE+NL+EN+TVZ) — EUR 18,13/lln
- "basisvaardigheden-2": VO Basisvaardigheden 2 — EUR 21,10/lln
- "basisvaardigheden-1-plus": VO Basisvaardigheden 1+ — EUR 35,58/lln

JIJ-tiers (gebruik tiernummer als string voor variantId):
- "1": Licentie 1 (4.001+ afnames)
- "2": Licentie 2 (2.501-4.000 afnames)
- "3": Licentie 3 (166-2.500 afnames)
- "4": Licentie 4 (0-165 afnames)

Provider waarden: "dia", "jij", "geen"

Verplicht JSON-formaat:
{
  "selections": [
    {
      "moduleId": "rekenwiskunde",
      "provider": "dia",
      "variantId": "pakket-compleet",
      "confidence": "high"
    }
  ],
  "uitleg": "Uitleg van wat er wel en niet uit de notities kon worden afgeleid."
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export function devApiPlugin(apiKey: string): Plugin {
  return {
    name: 'dev-api-proxy',

    configureServer(server) {
      const anthropic = new Anthropic({ apiKey });

      // POST /api/ai-intake — SSE streaming
      server.middlewares.use('/api/ai-intake', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));
          const notes = body.notes;

          if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
            res.statusCode = 400;
            res.end('Notes zijn verplicht');
            return;
          }

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: INTAKE_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: `Analyseer de volgende aantekeningen en extraheer de gestructureerde schoolgegevens als JSON:\n\n${notes}`,
              },
            ],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-verwerking: ${String(err)}`);
        }
      });

      // POST /api/ai-analysis — non-streaming, tool_use structured output
      // Model cascade with retry + validation (mirrors api/ai-analysis.ts)
      server.middlewares.use('/api/ai-analysis', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));

          if (!body.comparisonData || !body.schoolProfile) {
            res.statusCode = 400;
            res.end('Vergelijkingsdata en schoolprofiel zijn verplicht');
            return;
          }

          const userMessage = buildAnalysisUserMessage(body);
          console.log('[ai-analysis] User message length:', userMessage.length, 'chars');

          // Model cascade: Haiku first (fast, fits within Vercel Hobby 60s timeout),
          // fall back to Sonnet only if Haiku fails
          const MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'] as const;

          for (const model of MODELS) {
            const MAX_RETRIES = model === MODELS[0] ? 2 : 3;
            let lastError: unknown = null;

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
              if (attempt > 0) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`[ai-analysis] ${model} retry ${attempt}/${MAX_RETRIES - 1} after ${delay}ms...`);
                await new Promise((r) => setTimeout(r, delay));
              }

              try {
                const message = await anthropic.messages.create({
                  model,
                  max_tokens: 4096,
                  system: ANALYSIS_SYSTEM_PROMPT,
                  tools: [ANALYSIS_TOOL],
                  tool_choice: { type: 'tool', name: 'analyse_result' },
                  messages: [{ role: 'user', content: userMessage }],
                });

                // Check for truncated output — treat as retryable
                if (message.stop_reason === 'max_tokens') {
                  console.warn(`[ai-analysis] ${model} output truncated (max_tokens), retrying...`);
                  lastError = new Error('Output truncated');
                  continue;
                }

                const toolBlock = message.content.find(
                  (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
                );

                if (!toolBlock) {
                  console.warn(`[ai-analysis] ${model} no tool_use block found`);
                  lastError = new Error('No tool block');
                  continue;
                }

                // Server-side validation: ensure required fields are present
                const input = toolBlock.input as Record<string, unknown>;
                if (typeof input.samenvatting !== 'string' || !Array.isArray(input.gespreksargumenten)) {
                  console.warn(`[ai-analysis] ${model} returned incomplete tool output, keys:`, Object.keys(input));
                  lastError = new Error('Incomplete tool output');
                  continue;
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(input));
                return;
              } catch (err) {
                lastError = err;
                const errMsg = String(err);
                const isRetryable = errMsg.includes('529') || errMsg.includes('overloaded') ||
                  errMsg.includes('429') || errMsg.includes('rate') ||
                  errMsg.includes('500') || errMsg.includes('503');

                if (isRetryable && attempt < MAX_RETRIES - 1) {
                  console.warn(`[ai-analysis] ${model} attempt ${attempt + 1} failed, retrying...`, errMsg);
                  continue;
                }

                // If retryable and we have a fallback model, try that
                if (isRetryable && model !== MODELS[MODELS.length - 1]) {
                  console.warn(`[ai-analysis] ${model} overloaded, falling back to next model...`);
                  break;
                }

                break;
              }
            }

            // If last model also failed, return error
            if (model === MODELS[MODELS.length - 1]) {
              console.error('[ai-analysis] All models failed:', lastError);
              res.statusCode = 503;
              res.end('AI-service is tijdelijk overbelast. Probeer het over een minuut opnieuw.');
              return;
            }
          }

          // Should not reach here
          res.statusCode = 500;
          res.end('AI-analyse mislukt.');
        } catch (err) {
          console.error('[ai-analysis] Error:', err);
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-analyse: ${String(err)}`);
        }
      });

      // POST /api/ai-wizard-advice — SSE streaming
      server.middlewares.use('/api/ai-wizard-advice', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));

          if (!body.variantSelections || !body.schoolProfile) {
            res.statusCode = 400;
            res.end('Variant-selecties en schoolprofiel zijn verplicht');
            return;
          }

          const userMessage = buildWizardAdviceUserMessage(body);

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: WIZARD_ADVICE_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-adviesverwerking: ${String(err)}`);
        }
      });

      // POST /api/ai-wizard-extract — SSE streaming
      server.middlewares.use('/api/ai-wizard-extract', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));

          if (!body.notes || typeof body.notes !== 'string' || body.notes.trim().length === 0) {
            res.statusCode = 400;
            res.end('Gespreksnotities zijn verplicht');
            return;
          }

          const userMessage = `Analyseer de volgende gespreksnotities en extraheer per module welke concurrent-aanbieder en specifieke variant (DIA-pakket / JIJ-tier) de school gebruikt.

GESELECTEERDE MODULES:
${(body.selectedModules || []).join(', ')}

GESPREKSNOTITIES:
${body.notes}`;

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: WIZARD_EXTRACT_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-extractie: ${String(err)}`);
        }
      });

      // POST /api/ai-advice — SSE streaming
      server.middlewares.use('/api/ai-advice', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));

          if (!body.comparisonData || !body.schoolProfile) {
            res.statusCode = 400;
            res.end('Vergelijkingsdata en schoolprofiel zijn verplicht');
            return;
          }

          // Build user message (same format as api/ai-advice.ts)
          const userMessage = `Analyseer deze prijsvergelijking en geef strategisch advies:

SCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Totaal leerlingen: ${body.schoolProfile.totalStudents}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s: { moduleId: string; currentProvider: string }) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}

PRIJSVERGELIJKING (totalen per jaar):
${Object.entries(body.comparisonData.totals).map(([provider, total]) => `- ${provider}: €${(total as number).toFixed(2)}`).join('\n')}

PRIJSVERSCHILLEN:
${Object.entries(body.comparisonData.differences).map(([key, diff]) => `- ${key}: ${diff !== null ? `€${(diff as number).toFixed(2)}` : 'n.v.t.'}`).join('\n')}

PER MODULE:
${body.comparisonData.modules.map((mod: { moduleName: string; providers: Record<string, { pricePerStudent: number } | null> }) => {
  const providers = Object.entries(mod.providers)
    .filter(([, cost]) => cost !== null)
    .map(([prov, cost]) => `${prov}: €${cost!.pricePerStudent.toFixed(2)}/lln`)
    .join(', ');
  return `- ${mod.moduleName}: ${providers || 'geen prijzen'}`;
}).join('\n')}

DIFFERENTIATORS PER MODULE:
${(body.differentiators || []).map((d: { moduleId: string; cito: string[]; dia: string[]; jij: string[]; saqi: string[] }) => {
  const parts = [
    d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
    d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
    d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
    d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
  ].filter(Boolean).join('\n');
  return `- ${d.moduleId}:\n${parts}`;
}).join('\n')}`;

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: ADVICE_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          });

          stream.on('text', (text) => {
            res.write(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`);
          });

          stream.on('message', (message) => {
            res.write(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`);
            res.end();
          });

          stream.on('error', (error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
            res.end();
          });
        } catch (err) {
          res.statusCode = 500;
          res.end(`Er is een fout opgetreden bij de AI-adviesverwerking: ${String(err)}`);
        }
      });
    },
  };
}
