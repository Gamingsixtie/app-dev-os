/**
 * Vercel serverless function — AI Excel price-import (Phase 26-04, Task 3).
 *
 * Mirrors `api/ai-intake.ts`:
 *   - Module-level Anthropic + Supabase admin clients (reused across warm invocations).
 *   - Optional auth gate via `SKIP_AUTH=true` for local dev (mirrors `VITE_SKIP_AUTH`).
 *   - Single request/response (no SSE — batch imports don't need streaming).
 *
 * Contract:
 *   Request:  { provider, excelRows, currentConfig }
 *   Response: { proposed, notes? }  on 200
 *             { error }              on 4xx / 5xx (Dutch user-facing message)
 *
 * Per CONTEXT.md D-08: server-side ANTHROPIC_API_KEY only — NO VITE_ prefix.
 * Per CONTEXT.md D-11: single-provider per upload — provider is in the request body.
 *
 * Note: cannot directly import the canonical Zod schemas from `src/**` here
 * because Vercel serverless build uses a different tsconfig root. Per-shape
 * validation of the AI output runs CLIENT-SIDE in `ai-price-import-client.ts`
 * via `PROVIDER_IMPORT_SCHEMAS[provider]`. The server only validates the
 * request envelope (defensive, cheap).
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

// ─── Request envelope schema (defensive — not the AI-output schema) ─────────

const RequestSchema = z.object({
  provider: z.enum(['cito', 'dia', 'jij', 'saqi']),
  excelRows: z.array(z.array(z.string())).min(1, 'Excel-bestand bevat geen rijen'),
  currentConfig: z.record(z.string(), z.unknown()),
});

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Je bent een data-mapper voor de Cito Rekentool. Je krijgt:
1) De huidige prijsconfiguratie van een aanbieder (JSON, het "pricingStrategy" object).
2) Excel-rijen met nieuwe prijsinformatie (matrix van cellen, eerste rij = headers).

Je taak: produceer EEN GELDIG JSON-object dat exact dezelfde shape heeft als de huidige config (zelfde "type" discriminator, zelfde top-level velden), maar met de prijzen aangepast op basis van de Excel-rijen.

BELANGRIJK:
- Antwoord UITSLUITEND met geldig JSON. Geen uitleg, geen markdown, geen tekst voor of na de JSON.
- Behoud ALLE bestaande velden uit de huidige config tenzij de Excel ze expliciet aanpast. Dat geldt ook voor het "type" discriminator-veld en voor genest objecten/arrays (bundles, packages, tiers).
- Voor onbekende of dubbelzinnige rijen: behoud de huidige waarde en noteer een korte uitleg in een "notes" veld.
- Output format: { "proposed": <volledige nieuwe pricingStrategy object>, "notes": "<optionele NL-uitleg of lege string>" }
- "proposed" moet structureel identiek zijn aan de huidige config, alleen waarde-aanpassingen.
- Verzin GEEN nieuwe velden, modules, packages of tiers die niet in de huidige config staan.`;

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // Auth gate (mirrors api/ai-intake.ts)
    const skipAuth = process.env.SKIP_AUTH === 'true';
    if (!skipAuth) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        return jsonError(401, 'Niet ingelogd');
      }
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return jsonError(401, 'Niet ingelogd');
      }
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'Verzoek-body is geen geldig JSON');
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return jsonError(400, `Ongeldig verzoek: ${firstIssue?.message ?? 'onbekend'}`);
    }
    const { provider, excelRows, currentConfig } = parsed.data;

    // Cap rows sent to AI to keep prompt bounded (defensive — Excel uploads
    // are capped at 5MB client-side so this is a secondary guard).
    const cappedRows = excelRows.slice(0, 200);

    const userMessage = `Aanbieder: ${provider}

Huidige config (pricingStrategy):
\`\`\`json
${JSON.stringify(currentConfig, null, 2)}
\`\`\`

Excel-rijen (eerste rij = headers):
\`\`\`json
${JSON.stringify(cappedRows, null, 2)}
\`\`\`

Produceer { "proposed": <nieuwe pricingStrategy>, "notes": "<optioneel>" }.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text content from the response
    const text = message.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('');

    // Parse JSON (try direct first, then strip code fences, then first-brace fallback)
    let aiResult: { proposed?: unknown; notes?: unknown };
    try {
      aiResult = JSON.parse(text);
    } catch {
      const fence = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      const candidate = fence ? fence[1] : extractFirstJsonObject(text);
      if (!candidate) {
        return jsonError(502, 'AI-antwoord kon niet worden verwerkt (geen geldig JSON gevonden)');
      }
      try {
        aiResult = JSON.parse(candidate);
      } catch {
        return jsonError(502, 'AI-antwoord kon niet worden verwerkt (JSON-parsefout)');
      }
    }

    if (
      !aiResult ||
      typeof aiResult !== 'object' ||
      typeof aiResult.proposed !== 'object' ||
      aiResult.proposed === null
    ) {
      return jsonError(502, 'AI-antwoord mist het verwachte "proposed" object');
    }

    const notes = typeof aiResult.notes === 'string' && aiResult.notes.trim().length > 0
      ? aiResult.notes
      : undefined;

    return new Response(
      JSON.stringify({ proposed: aiResult.proposed, notes }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    return jsonError(500, `Er is een fout opgetreden bij de AI-import: ${msg}`);
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function extractFirstJsonObject(text: string): string | null {
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}
