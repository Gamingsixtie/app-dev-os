import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Module-level init (reused across warm invocations)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const DEFAULT_SYSTEM_PROMPT = `Je helpt een Cito-consultant de huidige situatie van een school te structureren op basis van aantekeningen uit een gesprek (vaak telefonisch).

De notities zijn onderverdeeld in secties met headers (## School & Niveaus, ## Modules & Aanbieders, ## Contactpersonen, ## Actiepunten & Overig). Gebruik de sectie-indeling als hint voor waar welke informatie staat, maar extraheer altijd alle relevante gegevens ongeacht in welke sectie ze staan.

BELANGRIJK: Antwoord UITSLUITEND met geldig JSON. Geen uitleg, geen markdown, geen tekst voor of na de JSON.

Beschikbare modules (exacte moduleId waarden):
- rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, cognitieve-capaciteiten, leer-werkhouding
- frans, duits, spaans (alleen bij JIJ! beschikbaar)

Beschikbare aanbieders (exacte waarden):
- cito-oud, cito-nieuw, dia, jij, saqi, overig, geen

Aanbieder-aliassen (vertaal naar de juiste provider-waarde):
- "Leerling in Beeld", "nieuw Cito-platform", "Cito nieuw" \u2192 "cito-nieuw"
- "VAS", "LOVS", "Cito Volgsysteem", "oud platform" \u2192 "cito-oud"
- "IEP", "Bureau ICE", "JIJ" \u2192 "jij"
- "SAQI", "School Attitude Questionnaire" \u2192 "saqi" (alleen voor sociaal-emotioneel)
- "Boom Toetsing", "Boom test uitgevers", "AMN", "RTTI" \u2192 "overig"

DIA productnaam-aliassen (vertaal naar de juiste moduleId):
- "Diatekst NE", "Diatekst Nederlands" \u2192 moduleId "nederlands" (begrijpend lezen, \u20AC3,36 los)
- "Diawoord NE", "Diawoord Nederlands" \u2192 moduleId "nederlands" (woordenschat, \u20AC3,36 los)
- "Diaspel", "digitaal dictee" \u2192 moduleId "taalverzorging" (\u20AC3,36)
- "Diacijfer" \u2192 moduleId "rekenwiskunde" (rekenniveau, \u20AC3,36)
- "Diawisk" \u2192 moduleId "rekenwiskunde" (wiskundig redeneren, \u20AC3,36 — zelfde module als Diacijfer)
- "Diatekst EN", "Diatekst Engels" \u2192 moduleId "engels" (begrijpend lezen EN, \u20AC3,36 los)
- "Diawoord EN", "Diawoord Engels" \u2192 moduleId "engels" (woordenschat EN, \u20AC3,36 los)
- "NSCCT", "Niet-Schoolse Cognitieve Capaciteitentoets" \u2192 moduleId "cognitieve-capaciteiten" (\u20AC9,75 digitaal / \u20AC4,50 papier)
- "Groeiwijzer" \u2192 DIA rapportagetool (geen apart product, noteer in unsureAbout)
- "Tekstenlab" \u2192 DIA oefenmateriaal (geen apart product, noteer in unsureAbout)
- "Spellab" \u2192 DIA oefenmateriaal spelling (geen apart product, noteer in unsureAbout)

DIA-context (belangrijk voor prijsherkenning):
DIA verkoopt modules los (\u20AC3,36/stuk) of als pakketten:
- Losse modules: Diatekst NE \u20AC3,36, Diawoord NE \u20AC3,36, Diaspel \u20AC3,36, Diacijfer \u20AC3,36, Diawisk \u20AC3,36, Diatekst EN \u20AC3,36, Diawoord EN \u20AC3,36
- Pakket NE (Diatekst + Diawoord = lezen + woordenschat): \u20AC5,84/lln \u2192 modules: ["nederlands"]
- Pakket NE compleet (lezen + woordenschat + spelling): \u20AC8,58/lln \u2192 modules: ["nederlands", "taalverzorging"]
- Pakket EN compleet (Diatekst EN + Diawoord EN): \u20AC5,84/lln \u2192 modules: ["engels"]
- Pakket compleet (alle 7 DIA-modules): \u20AC18,13/lln \u2192 modules: ["rekenwiskunde", "nederlands", "engels", "taalverzorging"]
- Basisvaardigheden 2 (incl. oefenmateriaal Burgerschap): \u20AC21,10/lln \u2192 modules: ["rekenwiskunde", "nederlands", "engels", "taalverzorging"]
- Basisvaardigheden 1+ (alle oefenmateriaal incl. Tekstenlab, Spellab): \u20AC35,58/lln \u2192 modules: ["rekenwiskunde", "nederlands", "engels", "taalverzorging"]
- Staffelkorting: 500+ leerlingen = 5%, 1000+ = 10%
- NSCCT (cognitieve capaciteiten): \u20AC9,75 digitaal, \u20AC4,50 papier (los van pakketten)
- LAS-koppeling (Magister/Somtoday) is GRATIS bij DIA

JIJ!-context (belangrijk voor prijsherkenning):
JIJ! (Bureau ICE) hanteert een licentie + toetsprijs-model:
- E\u00E9n jaarlijkse licentie per school, 4 niveaus op basis van totaal afnames:
  - Licentie 1 (4.001+ afnames): \u20AC5.330/jaar + \u20AC2,40/toets + \u20AC500 Magister
  - Licentie 2 (2.501-4.000): \u20AC2.815/jaar + \u20AC3,05/toets + \u20AC500 Magister
  - Licentie 3 (166-2.500): \u20AC975/jaar + \u20AC3,75/toets + \u20AC500 Magister
  - Licentie 4 (0-165): \u20AC290/jaar + \u20AC7,90/toets + \u20AC195 Magister
- Alle modules (RE, NL, EN, MVT, SEF) vallen onder dezelfde licentie
- Magister/Somtoday-koppeling is BETAALD (\u20AC500 voor L1-3, \u20AC195 voor L4)
- Sociaal-emotioneel (Hart & Handen zelfevaluaties): zit in basislicentie (geen meerprijs)
- Schoolexamens: \u20AC5,80/leerling (apart product, noteer in unsureAbout als school dit noemt)
- MVT: Frans, Duits, Spaans beschikbaar (ERK-geijkt A1-B2/C1)

Cito-context:
- Cito nieuw platform ("Leerling in Beeld"): bundelprijzen
  - Basis bundel (RE+NL+EN): \u20AC23,45/lln
  - Plus bundel (RE+NL+EN+TV+SEF+LWH): \u20AC31,44/lln
  - 3-jarig contract: ~6% korting
  - 3-jarig + DUO-subsidie: ~10% korting
- Cito oud platform (VAS/LOVS): individuele moduleprijzen
- Leer-werkhouding (LWH): alleen bij Cito beschikbaar (\u20AC3,00/lln of in Plus-bundel)

SAQI-context:
- SAQI = School Attitude Questionnaire Internet
- Alleen voor sociaal-emotioneel (\u20AC3,50/lln)
- COTAN-gecertificeerd, adaptief
- Onafhankelijk van LVS-aanbieder

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

DIA-specifieke extractieregels:
- Als school DIA + Nederlands noemt zonder specifiek product: ga uit van Pakket NE (\u20AC5,84), niet Diatekst los (\u20AC3,36). De meeste DIA-scholen nemen het pakket.
- Als school "Diatekst" of "alleen lezen" noemt: dat is \u20AC3,36 (individueel). Noteer in unsureAbout: "School gebruikt mogelijk alleen Diatekst (lezen), niet het volledige pakket."
- Als school "Diawoord" noemt naast Diatekst: samen = Pakket NE (\u20AC5,84).
- Als school "\u20AC8,58 voor Nederlands" noemt: dat is Pakket NE compleet (lezen + woordenschat + spelling). Extraheer dan ook module "taalverzorging" met provider "dia".
- Als school "\u20AC18,13" of "pakket compleet" noemt: extraheer alle 4 modules (rekenwiskunde, nederlands, engels, taalverzorging) met provider "dia". Verdeel: \u20AC18,13 \u00F7 4 = \u20AC4,53/module.
- Als school "\u20AC21,10" of "basisvaardigheden" noemt: extraheer alle 4 modules met provider "dia". Verdeel: \u20AC21,10 \u00F7 4 = \u20AC5,28/module. Noteer oefenmateriaal in unsureAbout.
- Als school "\u20AC35,58" of "basisvaardigheden 1+" noemt: extraheer alle 4 modules met provider "dia". Verdeel: \u20AC35,58 \u00F7 4 = \u20AC8,90/module. Noteer uitgebreid oefenmateriaal in unsureAbout.
- Als school staffelkorting noemt (bijv. "5% korting"): pas de prijs per leerling aan en noteer korting in unsureAbout.
- Als school "NSCCT" of "cognitieve capaciteiten bij DIA" noemt: gebruik moduleId "cognitieve-capaciteiten", provider "dia", prijs \u20AC9,75 (digitaal). Bij papier: \u20AC4,50.
- Als school "Diacijfer" noemt: moduleId "rekenwiskunde", provider "dia".
- Als school "Diawisk" noemt: moduleId "rekenwiskunde", provider "dia". Noteer in unsureAbout: "School noemt Diawisk (wiskundig redeneren) — mogelijk naast Diacijfer."

JIJ!-specifieke extractieregels:
- Als school JIJ!, Bureau ICE of IEP noemt: zet pricePerStudent op null per module — het systeem berekent dit o.b.v. het licentiemodel.
- Als school een totaalbedrag noemt (bijv. "\u20AC5.330 per jaar", "\u20AC975 licentie"): zet dit NIET als pricePerStudent. Noteer het in unsureAbout als "JIJ!-licentiekosten: \u20AC[bedrag]/jaar — wordt per leerling berekend door het systeem".
- Als school sociaal-emotioneel bij JIJ!/IEP noemt: zet pricePerStudent op 0 (zit in basislicentie). Noteer: "Hart & Handen (JIJ! sociaal-emotioneel) zit in basislicentie."
- Als school Frans, Duits of Spaans noemt bij JIJ!/IEP: gebruik moduleId "frans", "duits" of "spaans".
- Als school "schoolexamen" of "\u20AC5,80" bij JIJ! noemt: dat zijn schoolexamens (apart product). Noteer in unsureAbout, NIET als reguliere module.
- Als school Magister- of Somtoday-kosten bij JIJ! noemt: noteer in unsureAbout met het bedrag.

Cito-specifieke extractieregels:
- Als school "Leerling in Beeld" noemt: gebruik "cito-nieuw".
- Als school "VAS", "LOVS" of "Cito Volgsysteem" noemt: gebruik "cito-oud".
- Als school "leer-werkhouding", "LWH", "motivatie", "concentratie" noemt bij Cito: gebruik moduleId "leer-werkhouding".
- Als school "\u20AC23,45" of "Basis bundel" noemt: extraheer modules rekenwiskunde, nederlands, engels met provider "cito-nieuw". Verdeel: \u20AC23,45 \u00F7 3 = \u20AC7,82/module.
- Als school "\u20AC31,44" of "Plus bundel" noemt: extraheer modules rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, leer-werkhouding met provider "cito-nieuw". Verdeel: \u20AC31,44 \u00F7 6 = \u20AC5,24/module.

SAQI-specifieke extractieregels:
- SAQI is ALLEEN voor sociaal-emotioneel. Als school SAQI noemt: moduleId "sociaal-emotioneel", provider "saqi", pricePerStudent \u20AC3,50.

Overig-specifieke extractieregels:
- Als school "Boom", "AMN", "RTTI" of een andere onbekende aanbieder noemt: provider "overig", customProviderName met de naam.
- Als school meerdere aanbieders gebruikt voor verschillende modules: extraheer per module de juiste aanbieder.

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

export async function POST(request: Request): Promise<Response> {
  try {
    // Skip auth in dev mode (SKIP_AUTH=true in .env.local)
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      // Extract and verify Bearer token
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Verify JWT via Supabase admin client
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse and validate request body
    const { notes } = await request.json();

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return new Response('Notes zijn verplicht', { status: 400 });
    }

    // Stream the Anthropic response via SSE
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: DEFAULT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyseer de volgende aantekeningen en extraheer de gestructureerde schoolgegevens als JSON:\n\n${notes}`,
        },
      ],
    });

    // Create a ReadableStream that emits SSE events
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          stream.on('text', (text) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`),
            );
          });

          stream.on('message', (message) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'message_stop', message })}\n\n`),
            );
            controller.close();
          });

          stream.on('error', (error) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`),
            );
            controller.close();
          });
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch {
    return new Response('Er is een fout opgetreden bij de AI-verwerking', { status: 500 });
  }
}
