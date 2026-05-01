/**
 * Client-side streaming helpers for the AI comparison wizard.
 * Calls the serverless endpoints at /api/ai-wizard-extract and /api/ai-wizard-advice.
 */

import { parseSSEChunk } from './ai-intake';
import { supabase } from '@/lib/supabase/client';
import type {
  ExtractedVariantResult,
  WizardAdviceResult,
  ModuleVariantSelection,
  ExtraContextInput,
} from '@/features/price-comparison/wizard/types';

// ─── Auth helper (inline to avoid circular imports) ──────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.');

  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

// ─── Extract variants from notes (Step 1) ────────────────────────────────────

/**
 * Sends conversation notes to the AI extraction endpoint.
 * Returns structured variant selections per module.
 */
export async function extractVariantsFromNotes(
  notes: string,
  selectedModules: string[],
): Promise<ExtractedVariantResult> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-wizard-extract', {
    method: 'POST',
    headers,
    body: JSON.stringify({ notes, selectedModules }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-extractie mislukt. Probeer het opnieuw.');
  }

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

  if (!fullText) {
    return { selections: [], uitleg: 'De notities konden niet worden geanalyseerd.' };
  }

  try {
    return parseExtractionResult(fullText);
  } catch {
    return { selections: [], uitleg: 'De notities konden niet worden geanalyseerd.' };
  }
}

/**
 * Parse AI extraction result from accumulated text.
 */
function parseExtractionResult(text: string): ExtractedVariantResult {
  const cleaned = text.trim();

  let parsed: unknown;

  // Strategy 1: Direct JSON.parse
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Strategy 2: Strip markdown code fences
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1].trim());
      } catch {
        // Continue to strategy 3
      }
    }

    // Strategy 3: Extract first {...} JSON block
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
      throw new Error('AI-extractie kon niet worden verwerkt als JSON.');
    }
  }

  const obj = parsed as Record<string, unknown>;
  return {
    selections: Array.isArray(obj.selections) ? obj.selections : [],
    uitleg: typeof obj.uitleg === 'string' ? obj.uitleg : '',
  };
}

// ─── Stream wizard advice (Step 3) ──────────────────────────────────────────

/**
 * Streaming variant that yields text chunks as they arrive from the AI advice endpoint.
 * Used by the wizard for real-time streaming display.
 */
export async function* streamWizardAdvice(
  variantSelections: ModuleVariantSelection[],
  schoolProfile: {
    levels: string[];
    studentCounts: Record<string, Record<string, number>>;
    selectedModules: string[];
    moduleSetups: Array<{ moduleId: string; currentProvider: string }>;
  },
  differentiators: Array<{
    moduleId: string;
    cito: string[];
    dia: string[];
    jij: string[];
    saqi: string[];
  }>,
  providerData: {
    diaPackages: Array<{ id: string; name: string; pricePerStudent: number; includedModuleIds: string[] }>;
    jijTiers: Array<{ tier: number; label: string; annualFee: number; pricePerTest: number }>;
    citoBundles: Array<{ id: string; name: string; pricePerStudent: number | null; includedModuleIds: string[] }>;
  },
  extraContext: ExtraContextInput,
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>,
): AsyncGenerator<string> {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/ai-wizard-advice', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      variantSelections,
      schoolProfile,
      differentiators,
      providerData,
      extraContext,
      schoolplanOpportunities,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const statusMsg = response.status === 401
      ? 'Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.'
      : response.status === 500
        ? `Serverfout: ${errorBody || 'Onbekende fout bij AI-advies genereren'}`
        : `AI-advies genereren mislukt (${response.status}): ${errorBody}`;
    throw new Error(statusMsg);
  }

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

// ─── Parse advice from accumulated text ─────────────────────────────────────

/**
 * Parse accumulated streaming text into a WizardAdviceResult.
 * Tries multiple strategies to extract JSON (same pattern as ai-advice.ts).
 */
export function parseAdviceFromText(text: string): WizardAdviceResult {
  const fallback: WizardAdviceResult = {
    samenvatting: '',
    matchingUitleg: '',
    aanbevolenCitoBundel: 'individual',
    adviezen: [],
  };

  const cleaned = text.trim();
  if (!cleaned) return fallback;

  let parsed: unknown;

  // Strategy 1: Direct JSON.parse
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Strategy 2: Strip markdown code fences
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1].trim());
      } catch {
        // Continue to strategy 3
      }
    }

    // Strategy 3: Extract first {...} JSON block
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

    if (!parsed) return fallback;
  }

  // Validate structure
  const obj = parsed as Record<string, unknown>;
  return {
    samenvatting: typeof obj.samenvatting === 'string' ? obj.samenvatting : '',
    matchingUitleg: typeof obj.matchingUitleg === 'string' ? obj.matchingUitleg : '',
    aanbevolenCitoBundel:
      obj.aanbevolenCitoBundel === 'basis' || obj.aanbevolenCitoBundel === 'plus'
        ? obj.aanbevolenCitoBundel
        : 'individual',
    adviezen: Array.isArray(obj.adviezen) ? obj.adviezen : [],
    dmuStrategie: typeof obj.dmuStrategie === 'object' && obj.dmuStrategie !== null
      ? obj.dmuStrategie as Record<string, string>
      : undefined,
  };
}
