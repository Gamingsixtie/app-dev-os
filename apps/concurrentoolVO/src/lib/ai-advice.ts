/**
 * AI-powered comparison advice.
 * Takes a comparison result + school profile and generates strategic advice
 * for Cito consultants. Calls the Vercel serverless proxy at /api/ai-advice
 * with SSE streaming.
 */

import { parseSSEChunk } from './ai-intake';
import { supabase } from '@/lib/supabase/client';
import type { ComparisonResult } from '../engine/price-comparison';
import { getTotalStudents } from '../engine/price-comparison';
import { MODULE_DIFFERENTIATORS } from '../data/differentiators';
import type { ModuleCurrentSetup, SchoolLevel } from '../models/school';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdviceItem {
  titel: string;
  tekst: string;
  type: 'prijs' | 'meerwaarde' | 'bezwaar' | 'kans';
}

export interface AdviceResult {
  adviezen: AdviceItem[];
  samenvatting: string;
}

// ─── Auth helper (reuse pattern from ai-intake) ─────────────────────────────

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

// ─── Build request payload ──────────────────────────────────────────────────

export function buildAdvicePayload(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
) {
  const totalStudents = getTotalStudents(studentCounts);

  // Filter differentiators to selected modules only
  const relevantDifferentiators = MODULE_DIFFERENTIATORS.filter((d) =>
    selectedModules.includes(d.moduleId),
  );

  return {
    comparisonData: {
      modules: result.modules.map((mod) => ({
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        providers: mod.providers,
      })),
      totals: result.totals,
      differences: result.differences,
    },
    schoolProfile: {
      levels,
      totalStudents,
      selectedModules,
      moduleSetups: moduleSetups.map((s) => ({
        moduleId: s.moduleId,
        currentProvider: s.currentProvider,
      })),
    },
    differentiators: relevantDifferentiators,
  };
}

// ─── Build retention payload (Scenario C) ───────────────────────────────────

export function buildRetentionAdvicePayload(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>,
) {
  const base = buildAdvicePayload(result, levels, studentCounts, selectedModules, moduleSetups);
  return {
    ...base,
    scenarioType: 'C' as const,
    schoolplanOpportunities: schoolplanOpportunities ?? [],
    migrationContext: {
      platformUpgradeNextYear: true,
      newPlatformBenefits: [
        'Nieuw platform met verbeterde functionaliteit',
        'Automatische migratie zonder extra kosten',
        'Doorlopende toegang tot bestaande data',
      ],
    },
  };
}

// ─── Parse advice from accumulated text ─────────────────────────────────────

function parseAdviceFromText(fullText: string): AdviceResult {
  const cleaned = fullText.trim();

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
      throw new Error('AI-advies kon niet worden verwerkt als JSON.');
    }
  }

  // Basic validation
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.adviezen) || typeof obj.samenvatting !== 'string') {
    throw new Error('AI-advies heeft een onverwacht formaat.');
  }

  return {
    adviezen: (obj.adviezen as AdviceItem[]).slice(0, 5),
    samenvatting: obj.samenvatting as string,
  };
}

// ─── Main advice function ───────────────────────────────────────────────────

/**
 * Sends comparison data to the server-side AI proxy and returns parsed advice.
 */
export async function generateAdvice(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
): Promise<AdviceResult> {
  const headers = await getAuthHeaders();
  const payload = buildAdvicePayload(result, levels, studentCounts, selectedModules, moduleSetups);

  const response = await fetch('/api/ai-advice', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'AI-advies genereren mislukt. Probeer het opnieuw.');
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

  if (!fullText) throw new Error('Onverwacht leeg AI-advies');

  return parseAdviceFromText(fullText);
}

// ─── Streaming variant ──────────────────────────────────────────────────────

/**
 * Streaming variant that yields text chunks as they arrive.
 * Used by AdvicePanel for real-time streaming display.
 */
export async function* streamAdvice(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
): AsyncGenerator<string> {
  const headers = await getAuthHeaders();
  const payload = buildAdvicePayload(result, levels, studentCounts, selectedModules, moduleSetups);

  const response = await fetch('/api/ai-advice', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(response.status === 401
      ? 'Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.'
      : `AI-advies genereren mislukt (${response.status}): ${errorBody || 'Onbekende fout'}`);
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

// ─── Streaming retention variant (Scenario C) ──────────────────────────────

/**
 * Streaming variant for retention advice (Scenario C).
 * Uses buildRetentionAdvicePayload instead of buildAdvicePayload.
 */
export async function* streamRetentionAdvice(
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  schoolplanOpportunities?: Array<{ moduleId: string; kans: string }>,
): AsyncGenerator<string> {
  const headers = await getAuthHeaders();
  const payload = buildRetentionAdvicePayload(
    result, levels, studentCounts, selectedModules, moduleSetups, schoolplanOpportunities,
  );

  const response = await fetch('/api/ai-advice', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(response.status === 401
      ? 'Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.'
      : `Advies genereren mislukt (${response.status}): ${errorBody || 'Onbekende fout'}`);
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
