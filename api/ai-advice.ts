import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Lazy-init to avoid crashes when env vars are missing during build
let anthropic: Anthropic | null = null;
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
    );
  }
  return supabaseAdmin;
}

const SYSTEM_PROMPT = `Je bent een strategisch adviesassistent voor Cito-consultants die Nederlandse middelbare scholen adviseren over toetsaanbieders.

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

const RETENTION_SYSTEM_PROMPT = `Je bent een retentie-adviesassistent voor Cito-consultants. De school is een BESTAANDE Cito-klant op het huidige platform die overweegt naar een concurrent over te stappen.

PERSPECTIEF: Retentie, niet acquisitie. De school betaalt al bij Cito.

BELANGRIJK:
- Schrijf in het Nederlands, professioneel maar toegankelijk
- Geef 4-6 concrete adviespunten in drie categorieen
- Categorie 1 (type "prijs"): Prijsvergelijking — wat betaalt de school nu bij Cito vs. wat kost de concurrent
- Categorie 2 (type "bezwaar"): Bij overstap verliest u — differentiators geframed als BEHOUDEN, niet als KRIJGEN. Gebruik woorden als "verliest", "raakt kwijt", "moet opnieuw opbouwen"
- Categorie 3 (type "meerwaarde"): Als u bij Cito blijft — migratiepad naar nieuw platform (volgend schooljaar gratis upgrade), schoolplan-aansluiting als die beschikbaar is
- Wees eerlijk over prijs — als concurrent goedkoper is, erken dat en leg uit wat de school verliest bij overstap
- Als er schoolplan-kansen zijn meegegeven, verwijs daar concreet naar: "Uw schoolplan noemt [doel], Cito's [module] ondersteunt dit"
- Het migratiepad is de zachte deal: "als u bij Cito blijft, gaat u volgend schooljaar over naar het nieuwe platform met extra voordelen"

Antwoord UITSLUITEND in dit JSON-formaat:
{
  "adviezen": [
    { "titel": "Korte titel", "tekst": "Toelichting.", "type": "prijs | meerwaarde | bezwaar" }
  ],
  "samenvatting": "Kern van het retentie-advies — geschikt als openingszin."
}`;

interface AdviceRequest {
  comparisonData: {
    modules: Array<{
      moduleId: string;
      moduleName: string;
      providers: Record<string, { pricePerStudent: number; totalCost: number } | null>;
    }>;
    totals: Record<string, number>;
    differences: Record<string, number | null>;
  };
  schoolProfile: {
    levels: string[];
    totalStudents: number;
    selectedModules: string[];
    moduleSetups: Array<{
      moduleId: string;
      currentProvider: string;
    }>;
  };
  differentiators: Array<{
    moduleId: string;
    cito: string[];
    dia: string[];
    jij: string[];
    saqi: string[];
  }>;
  scenarioType?: 'A' | 'C';
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>;
  migrationContext?: {
    platformUpgradeNextYear: boolean;
    newPlatformBenefits: string[];
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const body: AdviceRequest = await request.json();

    if (!body.comparisonData || !body.schoolProfile) {
      return new Response('Vergelijkingsdata en schoolprofiel zijn verplicht', { status: 400 });
    }

    const userMessage = `Analyseer deze prijsvergelijking en geef strategisch advies:

SCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Totaal leerlingen: ${body.schoolProfile.totalStudents}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}

PRIJSVERGELIJKING (totalen per jaar):
${Object.entries(body.comparisonData.totals).map(([provider, total]) => `- ${provider}: €${(total as number).toFixed(2)}`).join('\n')}

PRIJSVERSCHILLEN:
${Object.entries(body.comparisonData.differences).map(([key, diff]) => `- ${key}: ${diff !== null ? `€${(diff as number).toFixed(2)}` : 'n.v.t.'}`).join('\n')}

PER MODULE:
${body.comparisonData.modules.map((mod) => {
  const providers = Object.entries(mod.providers)
    .filter(([, cost]) => cost !== null)
    .map(([prov, cost]) => `${prov}: €${cost!.pricePerStudent.toFixed(2)}/lln`)
    .join(', ');
  return `- ${mod.moduleName}: ${providers || 'geen prijzen'}`;
}).join('\n')}

DIFFERENTIATORS PER MODULE:
${body.differentiators.map((d) => {
  const parts = [
    d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
    d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
    d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
    d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
  ].filter(Boolean).join('\n');
  return `- ${d.moduleId}:\n${parts}`;
}).join('\n')}${body.schoolplanOpportunities?.length ? `\n\nSchoolplan-kansen:\n${body.schoolplanOpportunities.map(o => `- ${o.moduleId}: ${o.kans}`).join('\n')}` : ''}${body.migrationContext ? `\n\nMigratiecontext: School gaat volgend schooljaar over naar nieuw Cito-platform. Voordelen: ${body.migrationContext.newPlatformBenefits.join(', ')}` : ''}`;

    // Select system prompt based on scenario type
    const systemPrompt = body.scenarioType === 'C' ? RETENTION_SYSTEM_PROMPT : SYSTEM_PROMPT;

    const stream = getAnthropic().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

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
    return new Response('Er is een fout opgetreden bij de AI-adviesverwerking', { status: 500 });
  }
}
