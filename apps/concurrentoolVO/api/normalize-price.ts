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

/**
 * Module catalog reference for AI prompt — maps module IDs to names and aliases.
 * This is a static reference list; the actual MODULE_CATALOG lives in src/models/modules.ts.
 */
const MODULE_CATALOG_REFERENCE = [
  { id: 'rekenwiskunde', name: 'Reken-Wiskunde', aliases: ['rekenen', 'wiskunde', 'Diacijfer', 'Diawisk'] },
  { id: 'nederlands', name: 'Nederlands', aliases: ['NE', 'Diatekst NE', 'Diawoord NE', 'begrijpend lezen'] },
  { id: 'engels', name: 'Engels', aliases: ['EN', 'Diatekst EN', 'Diawoord EN', 'English'] },
  { id: 'taalverzorging', name: 'Taalverzorging Nederlands', aliases: ['spelling', 'grammatica', 'Diaspel'] },
  { id: 'sociaal-emotioneel', name: 'Sociaal-emotioneel functioneren', aliases: ['SEF', 'SAQI', 'Hart & Handen'] },
  { id: 'cognitieve-capaciteiten', name: 'Cognitieve capaciteitentoets', aliases: ['CCTT', 'NSCCT', 'intelligentie'] },
  { id: 'leer-werkhouding', name: 'Leer-werkhouding', aliases: ['LWH', 'werkhouding'] },
  { id: 'frans', name: 'Frans', aliases: ['French', 'MVT Frans'] },
  { id: 'duits', name: 'Duits', aliases: ['German', 'MVT Duits'] },
  { id: 'spaans', name: 'Spaans', aliases: ['Spanish', 'MVT Spaans'] },
];

const moduleListForPrompt = MODULE_CATALOG_REFERENCE
  .map((m) => `- ${m.id} (aliases: ${m.name}, ${m.aliases.join(', ')})`)
  .join('\n');

const SYSTEM_PROMPT = `You are a pricing data normalizer for Dutch educational testing products.
Given free-form text about pricing, extract structured pricing information.

Match module names to these exact IDs:
${moduleListForPrompt}

Match provider names to: cito, dia, jij, saqi.
Provider aliases:
- "Leerling in Beeld", "nieuw Cito-platform", "Cito" -> cito
- "DIA", "DIA Toetsen" -> dia
- "IEP", "Bureau ICE", "JIJ!" -> jij
- "SAQI" -> saqi

Amounts should be in EUR per student per year.
Validate: flag if amount seems unrealistic (< 1 EUR or > 50 EUR per student).

Respond ONLY with valid JSON matching this exact structure:
{
  "prices": [
    {
      "moduleId": "string (exact module ID from list above)",
      "provider": "string (cito|dia|jij|saqi)",
      "amountPerStudent": number,
      "confidence": "high|medium|low",
      "warning": "optional string, e.g. 'Prijs lijkt onrealistisch hoog'"
    }
  ],
  "unmatched": ["string segments that could not be matched"]
}`;

// ─── API handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // Skip auth in dev mode (SKIP_AUTH=true in .env.local)
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tekst is verplicht' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Call Claude Haiku for normalization
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Normaliseer de volgende prijsinformatie:\n\n${text.slice(0, 5000)}`,
        },
      ],
    });

    // Parse Claude response
    const content = response.content[0];
    if (content.type !== 'text') {
      return new Response(
        JSON.stringify({ prices: [], unmatched: [text] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Strip markdown fences if present
    let cleaned = content.text.trim();
    const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    try {
      const result = JSON.parse(cleaned);
      // Validate structure has required fields
      if (!result.prices || !Array.isArray(result.prices)) {
        return new Response(
          JSON.stringify({ prices: [], unmatched: [text] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch {
      return new Response(
        JSON.stringify({ prices: [], unmatched: [text] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Normalisatie mislukt. Probeer het opnieuw.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
