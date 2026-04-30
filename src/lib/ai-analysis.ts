/**
 * AI-powered competitive analysis.
 * Generates a structured 6-section analysis of Cito vs. competitors,
 * optionally enriched with schoolplan data. Calls /api/ai-analysis
 * which uses tool_use for guaranteed structured output.
 */

import type { ComparisonResult } from '../engine/price-comparison';
import { getTotalStudents } from '../engine/price-comparison';
import { MODULE_DIFFERENTIATORS } from '../data/differentiators';
import { getDiaVolumeDiscountPercent } from '../engine/dia-packages';
import { estimateJijCostPerStudent } from '../data/jij-license-tiers';
import type { DiaPackageResult } from '../models/dia-packages';
import type { ModuleCurrentSetup, SchoolLevel } from '../models/school';
import type { CurrentVsProposedResult } from '../engine/current-vs-proposed';
import type { MigrationResult } from '../engine/migration';
import type { SchoolplanAnalysisRow } from '@/db/types';
import { MIGRATION_MODULE_BENEFITS } from '../models/migration';
import { TIME_SAVING_TASKS } from '../models/migration';
import type { WizardNarrativeContext } from '../features/price-comparison/wizard/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrijsAnalyseItem {
  module: string;
  vergelijking: string;
  citoPositie: 'goedkoper' | 'duurder' | 'vergelijkbaar';
}

export interface ConcurrentDetail {
  provider: 'dia' | 'jij';
  citoBeter: string[];
  concurrentBeter: string[];
  weerlegging: string[];
}

export interface SchoolplanKoppeling {
  thema: string;
  citoAansluiting: string;
  citaat?: string;
}

export interface AnalysisResult {
  samenvatting: string;
  prijsanalyse: PrijsAnalyseItem[];
  citoSterkePunten: Array<{ module: string; argumenten: string[] }>;
  concurrentieVergelijking: ConcurrentDetail[];
  schoolplanKoppeling: SchoolplanKoppeling[] | null;
  gespreksargumenten: string[];
}

// ─── Progress & error types ─────────────────────────────────────────────────

export type AnalysisProgress = 'connecting' | 'generating' | 'processing' | 'retrying';
export type ProgressCallback = (state: AnalysisProgress, attempt?: number, maxAttempts?: number) => void;

export type AnalysisErrorType = 'timeout' | 'server' | 'parse' | 'auth' | 'unknown';

export class AnalysisError extends Error {
  readonly type: AnalysisErrorType;
  readonly retryable: boolean;

  constructor(
    message: string,
    type: AnalysisErrorType,
    retryable: boolean,
  ) {
    super(message);
    this.name = 'AnalysisError';
    this.type = type;
    this.retryable = retryable;
  }
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return headers;
  }

  const { supabase } = await import('@/lib/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Niet ingelogd. Log opnieuw in om AI-functies te gebruiken.');

  headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

// ─── Build request payload ──────────────────────────────────────────────────

export function buildAnalysisPayload(
  mode: 'comparison' | 'current-vs-proposed' | 'migration',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
  migrationResult?: MigrationResult | null,
  wizardContext?: WizardNarrativeContext | null,
) {
  const totalStudents = getTotalStudents(studentCounts);

  // Filter differentiators to selected modules only
  const relevantDifferentiators = MODULE_DIFFERENTIATORS.filter((d) =>
    selectedModules.includes(d.moduleId),
  );

  // Build DIA context
  const discountPercent = getDiaVolumeDiscountPercent(totalStudents);
  const diaContext = diaPackageResult
    ? {
        activePackage: diaPackageResult.selectedPackage?.name ?? null,
        volumeDiscountPercent: discountPercent,
        packageSavings: diaPackageResult.savings,
        coveredModuleIds: diaPackageResult.coveredModuleIds,
      }
    : null;

  // Build JIJ context
  let jijContext = null;
  if (totalStudents > 0) {
    const { costPerStudent, tier } = estimateJijCostPerStudent(totalStudents);
    jijContext = {
      tier: tier.tier,
      tierLabel: tier.label,
      annualFee: tier.annualFee,
      pricePerTest: tier.pricePerTest,
      totalStudents,
      costPerStudent,
    };
  }

  // Build current-vs-proposed data
  let currentVsProposedData = undefined;
  if (mode === 'current-vs-proposed' && currentVsProposedResult) {
    currentVsProposedData = {
      modules: currentVsProposedResult.modules.map((mod) => ({
        moduleId: mod.moduleId,
        moduleName: mod.moduleName,
        currentProvider: mod.currentProvider,
        currentProviderLabel: mod.currentProviderLabel,
        currentCost: mod.currentTotalCost,
        citoCost: mod.proposedCitoTotalCost,
        difference: mod.annualDifference,
        isNewModule: mod.isNewModule,
      })),
      totalCurrentCost: currentVsProposedResult.totalCurrentCost,
      totalProposedCost: currentVsProposedResult.totalProposedCost,
      totalSavings: currentVsProposedResult.totalAnnualSavings,
    };
  }

  // Build schoolplan data (top 5 opportunities by relevance)
  let schoolplanPayload = undefined;
  if (schoolplanData && schoolplanData.analysis_status === 'complete' && schoolplanData.opportunities.length > 0) {
    const relevanceOrder = { hoog: 0, midden: 1, laag: 2 };
    const sortedOpportunities = [...schoolplanData.opportunities]
      .sort((a, b) => (relevanceOrder[a.relevance] ?? 2) - (relevanceOrder[b.relevance] ?? 2))
      .slice(0, 5);

    schoolplanPayload = {
      summary: schoolplanData.summary,
      themes: schoolplanData.themes,
      opportunities: sortedOpportunities.map((opp) => ({
        theme: opp.theme,
        citoProduct: opp.citoProduct,
        moduleId: opp.moduleId,
        explanation: opp.explanation,
        relevance: opp.relevance,
        quote: opp.quote,
        competitorVulnerabilities: opp.competitorVulnerabilities,
      })),
    };
  }

  // Build time savings payload for comparison modes (same tasks as migration)
  let timeSavingsPayload = undefined;
  if (mode !== 'migration') {
    timeSavingsPayload = TIME_SAVING_TASKS.map((task) => ({
      taskLabel: task.label,
      oldMethod: task.oldMethodLabel,
      newMethod: task.newMethodLabel,
      defaultHoursPerYear: task.defaultHoursPerYear,
      description: task.description,
      benefit: task.benefit,
    }));
  }

  // Build migration payload
  let migrationPayload = undefined;
  if (mode === 'migration' && migrationResult) {
    migrationPayload = {
      modules: migrationResult.modules.map((m) => ({
        moduleId: m.moduleId,
        moduleName: m.moduleName,
        oldPricePerStudent: m.oldPricePerStudent,
        newPricePerStudent: m.newPricePerStudent,
        oldTotalCost: m.oldTotalCost,
        newTotalCost: m.newTotalCost,
        annualDifference: m.annualDifference,
      })),
      totalOldCost: migrationResult.totalOldCost,
      totalNewCost: migrationResult.totalNewCost,
      financialDifference: migrationResult.financialDifference,
      timeSavings: migrationResult.timeSavings.map((t) => {
        const task = TIME_SAVING_TASKS.find((ts) => ts.id === t.taskId);
        return {
          taskLabel: t.taskLabel,
          oldMethod: t.oldMethodLabel,
          newMethod: t.newMethodLabel,
          hoursPerYear: t.hoursPerYear,
          description: task?.description ?? '',
          benefit: task?.benefit ?? '',
        };
      }),
      totalTimeSavingsHours: migrationResult.totalTimeSavingsHours,
      totalAnnualValue: migrationResult.totalAnnualValue,
      moduleBenefits: MIGRATION_MODULE_BENEFITS.filter((b) =>
        selectedModules.includes(b.moduleId),
      ),
    };
  }

  // Build wizard advice context for progressive enrichment
  const wizardAdviceContext = wizardContext ? {
    samenvatting: wizardContext.samenvatting,
    matchingUitleg: wizardContext.matchingUitleg,
    aanbevolenCitoBundel: wizardContext.aanbevolenCitoBundel,
    adviesTitels: wizardContext.adviezen.map((a) => a.titel),
  } : null;

  return {
    mode,
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
    diaContext,
    jijContext,
    currentVsProposedData,
    schoolplanData: schoolplanPayload ?? null,
    migrationData: migrationPayload,
    timeSavingsData: timeSavingsPayload,
    wizardAdviceContext,
  };
}

// ─── Fetch with retry ───────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  onProgress?: ProgressCallback,
  maxRetries = 2,
): Promise<Response> {
  const maxAttempts = maxRetries + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      onProgress?.('connecting', attempt, maxAttempts);
      const response = await fetch(url, options);
      onProgress?.('generating', attempt, maxAttempts);

      if (response.ok) return response;

      // Don't retry 400/401/403
      if (response.status < 500 && response.status !== 408 && response.status !== 429) {
        const text = await response.text();
        if (response.status === 401) {
          throw new AnalysisError(text || 'Niet geautoriseerd. Log opnieuw in.', 'auth', false);
        }
        throw new AnalysisError(text || 'Serverfout.', 'server', false);
      }

      // Retryable server errors
      if (attempt < maxAttempts) {
        onProgress?.('retrying', attempt + 1, maxAttempts);
        await new Promise(r => setTimeout(r, attempt === 1 ? 1000 : 3000));
        continue;
      }

      const text = await response.text();
      if (response.status === 504 || response.status === 408) {
        throw new AnalysisError(
          'De analyse duurde te lang. Dit kan komen door een complex schoolprofiel. Probeer het opnieuw -- bij herhaalde timeouts, neem contact op met support.',
          'timeout', true
        );
      }
      throw new AnalysisError(text || 'Serverfout. Probeer het later opnieuw.', 'server', true);
    } catch (err) {
      if (err instanceof AnalysisError) throw err;
      // Network error
      if (attempt < maxAttempts) {
        onProgress?.('retrying', attempt + 1, maxAttempts);
        await new Promise(r => setTimeout(r, attempt === 1 ? 1000 : 3000));
        continue;
      }
      throw new AnalysisError(
        'Geen verbinding met de server. Controleer je internetverbinding.',
        'timeout', true
      );
    }
  }
  throw new AnalysisError('Alle pogingen mislukt.', 'unknown', true);
}

// ─── Main analysis function ─────────────────────────────────────────────────

export async function generateAnalysis(
  mode: 'comparison' | 'current-vs-proposed' | 'migration',
  result: ComparisonResult,
  levels: SchoolLevel[],
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>,
  selectedModules: string[],
  moduleSetups: ModuleCurrentSetup[],
  diaPackageResult: DiaPackageResult | null,
  currentVsProposedResult?: CurrentVsProposedResult | null,
  schoolplanData?: SchoolplanAnalysisRow | null,
  migrationResult?: MigrationResult | null,
  wizardContext?: WizardNarrativeContext | null,
  options?: { deepAnalysis?: boolean; onProgress?: ProgressCallback },
): Promise<AnalysisResult> {
  console.log('[ai-analysis] Step 1: getAuthHeaders...');
  const headers = await getAuthHeaders();
  console.log('[ai-analysis] Step 2: buildAnalysisPayload...');
  const payload = buildAnalysisPayload(
    mode,
    result,
    levels,
    studentCounts,
    selectedModules,
    moduleSetups,
    diaPackageResult,
    currentVsProposedResult,
    schoolplanData,
    migrationResult,
    wizardContext,
  );
  console.log('[ai-analysis] Step 3: fetch /api/ai-analysis (with retry)...');

  const response = await fetchWithRetry(
    '/api/ai-analysis',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, deepAnalysis: options?.deepAnalysis }),
    },
    options?.onProgress,
  );

  console.log('[ai-analysis] Step 4: response status:', response.status);

  // Server streams keepalive spaces followed by the JSON result.
  // response.text() waits for the full body, then we trim and parse.
  options?.onProgress?.('processing');
  const raw = await response.text();
  const text = raw.trim();
  console.log('[ai-analysis] Step 5: response received, length:', text.length);

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AnalysisError(
      'Het AI-resultaat kon niet worden verwerkt. Probeer het opnieuw.',
      'parse', true
    );
  }

  // Check for server-side error
  if (data.error && !data.samenvatting) {
    throw new AnalysisError(
      typeof data.error === 'string' ? data.error : 'AI-analyse mislukt.',
      'server', true
    );
  }

  if (typeof data.samenvatting !== 'string') {
    console.error('[ai-analysis] Missing samenvatting, received keys:', Object.keys(data));
    throw new Error('AI-analyse heeft een onverwacht formaat. Probeer het opnieuw.');
  }

  return {
    samenvatting: data.samenvatting as string,
    prijsanalyse: Array.isArray(data.prijsanalyse) ? data.prijsanalyse : [],
    citoSterkePunten: Array.isArray(data.citoSterkePunten) ? data.citoSterkePunten : [],
    concurrentieVergelijking: Array.isArray(data.concurrentieVergelijking) ? data.concurrentieVergelijking : [],
    schoolplanKoppeling: Array.isArray(data.schoolplanKoppeling) && (data.schoolplanKoppeling as unknown[]).length > 0 ? data.schoolplanKoppeling as AnalysisResult['schoolplanKoppeling'] : null,
    gespreksargumenten: Array.isArray(data.gespreksargumenten) ? (data.gespreksargumenten as string[]).slice(0, 8) : [],
  };
}
