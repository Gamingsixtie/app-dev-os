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

const SYSTEM_PROMPT = `Je bent een waardepropositie-specialist voor Cito-consultants die Nederlandse middelbare scholen adviseren over de overstap naar het nieuwe Cito-toetsplatform.

Je ontvangt berekende migratiedata (kostenverschillen, tijdwinst, meerjarenprojectie) en een schoolprofiel. Op basis hiervan genereer je een overtuigend maar eerlijk waardverhaal.

BELANGRIJK:
- Schrijf in het Nederlands, professioneel maar toegankelijk
- Gebruik de concrete cijfers uit de data — geen vage claims
- Wees eerlijk: als bepaalde kosten hoger worden, benoem dat en weeg het af tegen andere voordelen
- Denk vanuit het perspectief van de school: wat levert het hen concreet op?
- Het narratief moet bruikbaar zijn als gespreksopener of in een businesscase-document
- Bezwaarweerleggingen moeten realistisch zijn — geen stromannen

Antwoord UITSLUITEND in dit JSON-formaat:
{
  "samenvatting": "Eén krachtige openingszin die de consultant direct kan gebruiken in het gesprek.",
  "narratief": "2-3 alinea's overtuigend maar eerlijk verhaal over de totale meerwaarde van de overstap. Combineer financiële besparingen, tijdwinst en kwalitatieve voordelen. Gebruik concrete cijfers.",
  "kernargumenten": [
    {
      "titel": "Korte krachtige titel (max 6 woorden)",
      "tekst": "Onderbouwing met concrete cijfers en voordelen uit de data.",
      "categorie": "financieel | tijdwinst | kwaliteit | risico"
    }
  ],
  "bezwaarWeerleggingen": [
    {
      "bezwaar": "Veelgehoord bezwaar van scholen bij overstap",
      "weerlegging": "Eerlijke, onderbouwde weerlegging met feiten"
    }
  ]
}

Geef maximaal 5 kernargumenten en maximaal 4 bezwaarweerleggingen.`;

interface ValueRequest {
  migrationData: {
    modules: Array<{
      moduleId: string;
      moduleName: string;
      oldTotalCost: number;
      newTotalCost: number;
      annualDifference: number;
    }>;
    totalOldCost: number;
    totalNewCost: number;
    financialDifference: number;
    timeSavings: Array<{
      taskLabel: string;
      hoursPerYear: number | null;
      valuePerYear: number;
    }>;
    totalTimeSavingsHours: number;
    totalTimeSavingsValue: number;
    totalAnnualValue: number;
    switchingCosts: number;
    breakEvenMonth: number | null;
    multiYearProjection: Array<{
      year: number;
      cumulativeSavings: number;
    }>;
  };
  schoolProfile: {
    levels: string[];
    totalStudents: number;
    selectedModules: string[];
  };
  priceDifference: number | null;
  hourlyRateKnown: boolean;
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

    const body: ValueRequest = await request.json();

    if (!body.migrationData || !body.schoolProfile) {
      return new Response('Migratiedata en schoolprofiel zijn verplicht', { status: 400 });
    }

    const md = body.migrationData;
    const sp = body.schoolProfile;

    const timeSavingsDetail = md.timeSavings
      .filter((t) => t.hoursPerYear !== null)
      .map((t) => `- ${t.taskLabel}: ${t.hoursPerYear} uur/jaar${t.valuePerYear > 0 ? ` (${formatEur(t.valuePerYear)})` : ''}`)
      .join('\n');

    const modulesDetail = md.modules
      .map((m) => {
        const sign = m.annualDifference >= 0 ? '+' : '';
        return `- ${m.moduleName}: huidig ${formatEur(m.oldTotalCost)}, nieuw ${formatEur(m.newTotalCost)} (${sign}${formatEur(m.annualDifference)})`;
      })
      .join('\n');

    const userMessage = `Genereer een waardepropositie voor deze school op basis van de volgende data:

SCHOOLPROFIEL:
- Niveaus: ${sp.levels.join(', ')}
- Totaal leerlingen: ${sp.totalStudents}
- Geselecteerde modules: ${sp.selectedModules.join(', ')}

MIGRATIE KOSTENVERGELIJKING (per jaar):
${modulesDetail}
- Totaal huidig: ${formatEur(md.totalOldCost)}
- Totaal nieuw: ${formatEur(md.totalNewCost)}
- Financieel verschil: ${formatEur(md.financialDifference)} (positief = nieuw platform is goedkoper)

TIJDWINST:
${timeSavingsDetail || '(geen tijdwinst-taken ingevuld)'}
- Totaal: ${md.totalTimeSavingsHours} uur/jaar${md.totalTimeSavingsValue > 0 ? ` (${formatEur(md.totalTimeSavingsValue)})` : ''}
${body.hourlyRateKnown ? '' : '- Uurtarief is niet bekend — druk tijdwinst uit in uren, niet in euro'}

${body.priceDifference !== null ? `PRIJSVERGELIJKING MET CONCURRENTEN:\n- Cito is ${formatEur(Math.abs(body.priceDifference))} ${body.priceDifference >= 0 ? 'goedkoper' : 'duurder'} dan de goedkoopste concurrent\n` : ''}
MEERJARENPROJECTIE:
${md.multiYearProjection.map((p) => `- Na ${p.year} jaar: ${formatEur(p.cumulativeSavings)} cumulatieve waarde`).join('\n')}

OVERSTAPKOSTEN & TERUGVERDIENTIJD:
- Overstapkosten: ${formatEur(md.switchingCosts)}
- Terugverdientijd: ${md.breakEvenMonth === 0 ? 'Direct terugverdiend' : md.breakEvenMonth === null ? 'Niet terugverdiend met huidige cijfers' : `${md.breakEvenMonth} maanden`}

TOTALE JAARLIJKSE WAARDE: ${formatEur(md.totalAnnualValue)}`;

    const stream = getAnthropic().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 3072,
      system: SYSTEM_PROMPT,
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
    return new Response('Er is een fout opgetreden bij het genereren van de waardepropositie', { status: 500 });
  }
}

function formatEur(amount: number): string {
  return `€${amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
