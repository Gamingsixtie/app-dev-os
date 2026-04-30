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

interface AdviceRequest {
  variantSelections: Array<{
    moduleId: string;
    provider: string;
    variantId: string | null;
    confidence: string;
  }>;
  schoolProfile: {
    levels: string[];
    studentCounts: Record<string, Record<string, number>>;
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
  providerData: {
    diaPackages: Array<{ id: string; name: string; pricePerStudent: number; includedModuleIds: string[] }>;
    jijTiers: Array<{ tier: number; label: string; annualFee: number; pricePerTest: number }>;
    citoBundles: Array<{ id: string; name: string; pricePerStudent: number | null; includedModuleIds: string[] }>;
  };
  extraContext: {
    korting: string;
    dmuFocus: string;
    bijzonderheden: string;
  };
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>;
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

    if (!body.variantSelections || !body.schoolProfile) {
      return new Response('Variant-selecties en schoolprofiel zijn verplicht', { status: 400 });
    }

    const userMessage = `Genereer een compleet vergelijkingsadvies op basis van de volgende gegevens:

SCHOOLPROFIEL:
- Niveaus: ${body.schoolProfile.levels.join(', ')}
- Geselecteerde modules: ${body.schoolProfile.selectedModules.join(', ')}
- Huidige aanbieders: ${body.schoolProfile.moduleSetups.map((s) => `${s.moduleId}: ${s.currentProvider}`).join(', ')}

VARIANT-SELECTIES (per module welke concurrent):
${body.variantSelections.map((s) => `- ${s.moduleId}: ${s.provider}${s.variantId ? ` (variant: ${s.variantId})` : ''} [confidence: ${s.confidence}]`).join('\n')}

PROVIDER-DATA:
DIA-pakketten: ${JSON.stringify(body.providerData.diaPackages.map((p) => `${p.name}: EUR ${p.pricePerStudent}/lln (${p.includedModuleIds.join(', ')})`).join('; '))}
JIJ-tiers: ${JSON.stringify(body.providerData.jijTiers.map((t) => `Tier ${t.tier}: EUR ${t.annualFee}/jaar + EUR ${t.pricePerTest}/toets`).join('; '))}
Cito-bundels: ${JSON.stringify(body.providerData.citoBundles.map((b) => `${b.name}: ${b.pricePerStudent !== null ? `EUR ${b.pricePerStudent}/lln` : 'individueel'} (${b.includedModuleIds.join(', ')})`).join('; '))}

DIFFERENTIATORS PER MODULE (Cito-meerwaarde):
${body.differentiators.map((d) => {
  const parts = [
    d.cito.length > 0 ? `  Cito: ${d.cito.join('; ')}` : '',
    d.dia.length > 0 ? `  DIA: ${d.dia.join('; ')}` : '',
    d.jij.length > 0 ? `  JIJ!: ${d.jij.join('; ')}` : '',
    d.saqi.length > 0 ? `  SAQI: ${d.saqi.join('; ')}` : '',
  ].filter(Boolean).join('\n');
  return `- ${d.moduleId}:\n${parts}`;
}).join('\n')}

${body.extraContext.korting ? `KORTING/DEAL INFO: ${body.extraContext.korting}` : ''}
${body.extraContext.dmuFocus ? `DMU-FOCUS: ${body.extraContext.dmuFocus}` : ''}
${body.extraContext.bijzonderheden ? `BIJZONDERHEDEN: ${body.extraContext.bijzonderheden}` : ''}
${body.schoolplanOpportunities && body.schoolplanOpportunities.length > 0
  ? `\nSCHOOLPLAN KANSEN:\n${body.schoolplanOpportunities.map((o) => `- ${o.moduleId}: ${o.kans}`).join('\n')}`
  : ''}`;

    const stream = getAnthropic().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
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
    return new Response('Er is een fout opgetreden bij de AI-adviesverwerking', { status: 500 });
  }
}
