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

const SYSTEM_PROMPT = `Je bent een data-extractie-assistent voor Cito-consultants. Je analyseert gespreksnotities van telefoongesprekken met scholen en extraheert welke concurrent-toetsaanbieders en specifieke varianten (DIA-pakketten / JIJ-licentiertiers) de school per module gebruikt.

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
    },
    {
      "moduleId": "engels",
      "provider": "jij",
      "variantId": "3",
      "confidence": "low"
    },
    {
      "moduleId": "sociaal-emotioneel",
      "provider": "geen",
      "variantId": null,
      "confidence": "unknown"
    }
  ],
  "uitleg": "Uit de notities blijkt dat de school DIA Pakket compleet gebruikt voor de basisvakken. Voor Engels is JIJ! afgeleid uit de genoemde licentiekosten. Over sociaal-emotioneel is niets bekend."
}`;

interface ExtractRequest {
  notes: string;
  selectedModules: string[];
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

    const body: ExtractRequest = await request.json();

    if (!body.notes || typeof body.notes !== 'string' || body.notes.trim().length === 0) {
      return new Response('Gespreksnotities zijn verplicht', { status: 400 });
    }

    const userMessage = `Analyseer de volgende gespreksnotities en extraheer per module welke concurrent-aanbieder en specifieke variant (DIA-pakket / JIJ-tier) de school gebruikt.

GESELECTEERDE MODULES:
${(body.selectedModules || []).join(', ')}

GESPREKSNOTITIES:
${body.notes}`;

    const stream = getAnthropic().messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
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
    return new Response('Er is een fout opgetreden bij de AI-extractie', { status: 500 });
  }
}
