/**
 * Frontend client for the AI Excel-import Vercel function (Phase 26-04, Task 4).
 *
 * Responsibilities:
 *   - Attach Supabase Bearer token (or skip when VITE_SKIP_AUTH=true).
 *   - POST to /api/ai-price-import.
 *   - Validate the AI response against PROVIDER_IMPORT_SCHEMAS[provider]
 *     CLIENT-SIDE — the server only checks the request envelope, so this
 *     is the deep shape-check (per threat-model T-26-04-04).
 *   - Surface all errors as Dutch user-facing messages.
 *
 * Mirrors `src/lib/ai-intake.ts` getAuthHeaders pattern verbatim.
 */

import { supabase } from '@/lib/supabase/client';
import {
  PROVIDER_IMPORT_SCHEMAS,
  type ProviderImportKey,
  type ProviderImportResult,
} from './price-import-schemas';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // Skip auth in dev mode (matches VITE_SKIP_AUTH + server-side SKIP_AUTH).
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Niet ingelogd. Log opnieuw in om de AI-import te gebruiken.');
  }
  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

/**
 * Send Excel rows + the current provider config to the AI proxy and return
 * a typed, schema-validated proposal. Throws Dutch errors on failure.
 */
export async function importPricesFromExcel(
  provider: ProviderImportKey,
  excelRows: string[][],
  currentConfig: Record<string, unknown>,
): Promise<ProviderImportResult> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-price-import', {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, excelRows, currentConfig }),
  });

  if (!response.ok) {
    let msg = 'AI-import mislukt.';
    try {
      const body = (await response.json()) as { error?: string };
      if (typeof body.error === 'string' && body.error.length > 0) {
        msg = body.error;
      }
    } catch {
      // Response body wasn't JSON — keep the generic Dutch fallback.
    }
    throw new Error(msg);
  }

  const body = (await response.json()) as { proposed?: unknown; notes?: string };
  if (!body.proposed) {
    throw new Error('AI gaf geen voorstel terug.');
  }

  // Deep client-side validation against the canonical Zod schema (T-26-04-04).
  const schema = PROVIDER_IMPORT_SCHEMAS[provider];
  const parsed = schema.safeParse(body.proposed);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(
      `AI-voorstel voldoet niet aan het verwachte prijsmodel: ${first?.message ?? 'validatiefout'}`,
    );
  }

  return { proposed: parsed.data, notes: body.notes };
}
