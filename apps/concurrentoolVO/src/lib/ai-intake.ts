/**
 * AI-powered intake extraction.
 * Parses freeform consultant notes from a phone call into structured wizard data.
 * Calls the Vercel serverless proxy at /api/ai-intake with SSE streaming.
 */

import { supabase } from '@/lib/supabase/client';
import { YEARS_PER_LEVEL, toPriceProvider, type SchoolLevel, type CurrentProvider } from '../models/school';
import {
  IntakeExtractionSchemaV2,
  type IntakeExtractionV2,
} from '@/features/school-profile/schemas/intake-extraction.schema';
import { DEFAULT_PRICES } from '@/data/default-prices';

// ─── V2 Schema re-exports ────────────────────────────────────────────────────

export { IntakeExtractionSchemaV2, type IntakeExtractionV2 };

/** @deprecated Use IntakeExtractionSchemaV2 instead */
export const IntakeExtractionSchema = IntakeExtractionSchemaV2;
/** @deprecated Use IntakeExtractionV2 instead */
export type IntakeExtraction = IntakeExtractionV2;

// ─── Student count distribution helper ───────────────────────────────────────

/**
 * Convert per-level totals into the store's nested year structure,
 * distributing students evenly across years within each level.
 */
export function distributeStudentCounts(
  levels: SchoolLevel[],
  countsPerLevel: Record<string, number> | null,
): Partial<Record<SchoolLevel, Record<number, number>>> {
  if (!countsPerLevel || levels.length === 0) return {};

  const result: Partial<Record<SchoolLevel, Record<number, number>>> = {};
  for (const level of levels) {
    const levelTotal = countsPerLevel[level] ?? 0;
    if (levelTotal === 0) continue;

    const years = YEARS_PER_LEVEL[level];
    const perYear = Math.round(levelTotal / years.length);
    result[level] = {};
    for (const year of years) {
      result[level]![year] = perYear;
    }
  }
  return result;
}

// ─── Per-year student count resolution ───────────────────────────────────────

/**
 * Resolve student counts from AI extraction into the store's nested year structure.
 * Prefers per-year data (studentCountsPerYear) when available — passes it through
 * with number keys. Falls back to distributing per-level totals evenly.
 */
export function resolveStudentCounts(
  levels: SchoolLevel[],
  extraction: Pick<IntakeExtractionV2, 'studentCountsPerLevel' | 'studentCountsPerYear'>,
): Partial<Record<SchoolLevel, Record<number, number>>> {
  if (levels.length === 0) return {};

  // Prefer per-year data
  const perYear = extraction.studentCountsPerYear;
  if (perYear && Object.keys(perYear).length > 0) {
    const result: Partial<Record<SchoolLevel, Record<number, number>>> = {};
    for (const level of levels) {
      const yearData = perYear[level];
      if (!yearData) continue;
      result[level] = {};
      for (const [yearStr, count] of Object.entries(yearData)) {
        const year = Number(yearStr);
        if (!isNaN(year) && count > 0) {
          result[level]![year] = count;
        }
      }
    }
    return result;
  }

  // Fallback to per-level totals with even distribution
  return distributeStudentCounts(levels, extraction.studentCountsPerLevel);
}

// ─── Auto-enrich module setups with default prices ───────────────────────────

// Provider mapping now uses shared toPriceProvider() from models/school.ts

export type IntakePriceSource = 'intake' | 'default';

export interface EnrichedModuleSetup {
  moduleId: string;
  currentProvider: CurrentProvider;
  pricePerStudent: number | null;
  customProviderName?: string;
  priceSource: IntakePriceSource;
  priceContext?: string;
}

/**
 * DIA realistic package prices — what schools actually pay.
 * Most DIA schools buy packages, not individual modules.
 * Used during enrichment when AI didn't extract a specific price.
 */
const DIA_PACKAGE_PRICES: Record<string, { price: number; label: string }> = {
  'nederlands': { price: 5.84, label: 'Pakket NE (lezen + woordenschat)' },
  'engels': { price: 5.84, label: 'Pakket EN (lezen + woordenschat)' },
};

/**
 * Enrich module setups with default publication prices when the intake
 * extracted a provider but no price. The user can always override in the wizard.
 *
 * For DIA, uses realistic package prices (what most schools pay) instead of
 * individual module prices for Nederlands and Engels.
 */
export function enrichModuleSetupsWithDefaultPrices(
  moduleSetups: IntakeExtractionV2['moduleSetups'],
): EnrichedModuleSetup[] {
  return moduleSetups.map((setup) => {
    // If price was extracted from the conversation, keep it
    if (setup.pricePerStudent !== null) {
      return { ...setup, priceSource: 'intake' as IntakePriceSource };
    }

    // Look up default price for this provider + module
    const priceProvider = toPriceProvider(setup.currentProvider as CurrentProvider);
    if (!priceProvider) {
      return { ...setup, priceSource: 'intake' as IntakePriceSource };
    }

    // DIA: use package prices for modules most schools buy as a package
    if (priceProvider === 'dia' && DIA_PACKAGE_PRICES[setup.moduleId]) {
      const pkg = DIA_PACKAGE_PRICES[setup.moduleId];
      return {
        ...setup,
        pricePerStudent: pkg.price,
        priceSource: 'default' as IntakePriceSource,
        priceContext: pkg.label,
      };
    }

    const defaultPrice = DEFAULT_PRICES.find(
      (p) => p.moduleId === setup.moduleId && p.provider === priceProvider,
    );

    if (defaultPrice) {
      return {
        ...setup,
        pricePerStudent: defaultPrice.amountPerStudent,
        priceSource: 'default' as IntakePriceSource,
      };
    }

    return { ...setup, priceSource: 'intake' as IntakePriceSource };
  });
}

// System prompt is now server-side only (single source of truth in api/ai-intake.ts)

// ─── SSE stream parsing helper ───────────────────────────────────────────────

/**
 * Parses SSE data lines from a chunk and extracts text deltas.
 * Returns accumulated text and whether an error occurred.
 */
export function parseSSEChunk(chunk: string): { texts: string[]; error?: string } {
  const texts: string[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'content_block_delta') {
          texts.push(event.text);
        } else if (event.type === 'error') {
          return { texts, error: event.error };
        }
        // 'message_stop' means stream is complete
      } catch (e) {
        if (e instanceof SyntaxError) continue; // skip malformed SSE lines
        throw e;
      }
    }
  }

  return { texts };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Skip auth token in dev mode (matches VITE_SKIP_AUTH + server-side SKIP_AUTH)
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.');

  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Sends notes to the server-side AI proxy and accumulates the SSE stream
 * into a final parsed IntakeExtraction result.
 */
export async function extractIntakeFromNotes(
  notes: string,
): Promise<IntakeExtraction> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-intake', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-verwerking mislukt. Probeer het opnieuw.');
  }

  // Read the SSE stream and accumulate the full text response
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const { texts, error } = parseSSEChunk(chunk);

    if (error) throw new Error(error);
    fullText += texts.join('');
  }

  if (!fullText) throw new Error('Onverwacht leeg AI-antwoord');

  const parsed = parseExtractionFromText(fullText);
  return parsed;
}

// ─── Parse extraction from accumulated text ─────────────────────────────────

/**
 * Parses accumulated streaming text into a validated IntakeExtractionV2 object.
 * Tries multiple strategies to extract JSON:
 * 1. Direct JSON.parse
 * 2. Strip markdown code fences (anywhere in text)
 * 3. Extract first {...} block from mixed text
 * Throws a descriptive Dutch error on failure.
 */
export function parseExtractionFromText(fullText: string): IntakeExtractionV2 {
  const cleaned = fullText.trim();

  let parsed: unknown;

  // Strategy 1: Direct JSON.parse
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Strategy 2: Strip markdown code fences (anywhere in text, not just start/end)
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1].trim());
      } catch {
        // Continue to strategy 3
      }
    }

    // Strategy 3: Extract first {...} JSON block from mixed text
    if (!parsed) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        } catch {
          // All strategies failed
        }
      }
    }

    if (!parsed) {
      const preview = cleaned.slice(0, 200);
      throw new Error(
        `AI-antwoord kon niet worden verwerkt. Het antwoord is geen geldig JSON-formaat. Begin van antwoord: "${preview}"`,
      );
    }
  }

  try {
    return IntakeExtractionSchemaV2.parse(parsed);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Onbekende validatiefout';
    throw new Error(
      `Geëxtraheerde gegevens voldoen niet aan het verwachte schema: ${message}`,
    );
  }
}

// ─── Streaming generator variant ─────────────────────────────────────────────

/**
 * Streaming variant that yields text chunks as they arrive from the SSE stream.
 * Used by IntakePanel for real-time UI updates.
 */
export async function* streamIntakeFromNotes(notes: string): AsyncGenerator<string> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-intake', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes }),
  });

  if (!response.ok) throw new Error('AI-verwerking mislukt.');

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const { texts, error } = parseSSEChunk(chunk);

    if (error) throw new Error(error);
    for (const text of texts) {
      yield text;
    }
  }
}
