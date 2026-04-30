/**
 * Wizard Step 3: AI advice generation with streaming, result display, editable matching,
 * and "Pas tabel aan" confirmation button.
 *
 * D-15: AI generates matching recommendation with Cito bundle selection and strategic advice
 * D-16: Streaming display with blinking cursor
 * D-17: Typed advice cards
 * D-18: DMU strategy section
 * D-19: Editable matching before confirming
 * D-21: Extra context input
 * D-22: Samenvatting banner
 * D-24: Explicit "Pas tabel aan" confirmation
 * D-25: AI disclaimer
 */

import { useState } from 'react';
import { useWizardStore } from './wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { streamWizardAdvice, parseAdviceFromText } from '@/lib/ai-wizard';
import { streamRetentionAdvice } from '@/lib/ai-advice';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import { useSchoolplanAnalysis } from '@/hooks/useSchoolplanAnalysis';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';
import { DIA_PACKAGES } from '@/data/providers/dia';
import { JIJ_LICENSE_TIERS } from '@/data/providers/jij';
import { CITO_BUNDLES } from '@/data/providers/cito';
import { MODULE_CATALOG } from '@/models/modules';
import { ExtraContextField } from './ExtraContextField';
import type { WizardAdviceResult } from './types';

// ─── Type config for advice cards ───────────────────────────────────────────

const TYPE_CONFIG: Record<
  WizardAdviceResult['adviezen'][number]['type'],
  { label: string; color: string; bgColor: string }
> = {
  prijs: { label: 'Prijs', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  meerwaarde: { label: 'Meerwaarde', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  bezwaar: { label: 'Bezwaar', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  kans: { label: 'Kans', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  strategie: { label: 'Strategie', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
};

// ─── Spinner SVG ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Cito bundle label helper ───────────────────────────────────────────────

function getBundelLabel(bundleId: string): string {
  if (bundleId === 'basis') return 'Basis';
  if (bundleId === 'plus') return 'Plus';
  return 'Per module';
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WizardStep3Advice() {
  const variantSelections = useWizardStore((s) => s.variantSelections);
  const adjustedSelections = useWizardStore((s) => s.adjustedSelections);
  const aiAdvice = useWizardStore((s) => s.aiAdvice);
  const extraContext = useWizardStore((s) => s.extraContext);
  const isGeneratingAdvice = useWizardStore((s) => s.isGeneratingAdvice);
  const streamingText = useWizardStore((s) => s.streamingText);

  const setAiAdvice = useWizardStore((s) => s.setAiAdvice);
  const setAdjustedSelections = useWizardStore((s) => s.setAdjustedSelections);
  const setExtraContext = useWizardStore((s) => s.setExtraContext);
  const setIsGeneratingAdvice = useWizardStore((s) => s.setIsGeneratingAdvice);
  const setStreamingText = useWizardStore((s) => s.setStreamingText);
  const appendStreamingText = useWizardStore((s) => s.appendStreamingText);

  const scenario = useWizardStore((s) => s.scenario);

  const [error, setError] = useState<string | null>(null);
  const [dmuExpanded, setDmuExpanded] = useState(false);

  const isRetentionScenario = scenario === 'alles-oud-cito-concurrent';

  // Schoolplan data for retention advice (graceful degradation: empty array if unavailable)
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId) ?? '';
  const { data: schoolplanAnalysis } = useSchoolplanAnalysis(activeSchoolId);
  const schoolplanOpportunities = schoolplanAnalysis?.opportunities?.map((opp) => ({
    moduleId: opp.moduleId ?? '',
    kans: opp.explanation ?? opp.theme ?? '',
  })).filter((o) => o.moduleId && o.kans) ?? [];

  const hasGenerated = aiAdvice !== null;

  // Build selections to use: adjustedSelections for regeneration, variantSelections for first time
  const activeSelections =
    adjustedSelections.length > 0 ? adjustedSelections : variantSelections;

  // ─── Generate advice handler ──────────────────────────────────────────────

  const handleGenerate = async () => {
    setIsGeneratingAdvice(true);
    setStreamingText('');
    setAiAdvice(null);
    setError(null);

    // Build school profile payload
    const schoolProfile = useSchoolProfileStore.getState();
    const profile = {
      levels: schoolProfile.levels,
      studentCounts: schoolProfile.studentCounts as Record<string, Record<string, number>>,
      selectedModules: schoolProfile.selectedModules,
      moduleSetups: schoolProfile.moduleSetups.map((s) => ({
        moduleId: s.moduleId,
        currentProvider: s.currentProvider,
      })),
    };

    // Filter differentiators to selected modules
    const selectedIds = new Set(schoolProfile.selectedModules);
    const differentiators = MODULE_DIFFERENTIATORS.filter((d) =>
      selectedIds.has(d.moduleId),
    );

    // Provider data
    const providerData = {
      diaPackages: DIA_PACKAGES.map((p) => ({
        id: p.id,
        name: p.name,
        pricePerStudent: p.pricePerStudent,
        includedModuleIds: p.includedModuleIds,
      })),
      jijTiers: JIJ_LICENSE_TIERS.map((t) => ({
        tier: t.tier,
        label: t.label,
        annualFee: t.annualFee,
        pricePerTest: t.pricePerTest,
      })),
      citoBundles: CITO_BUNDLES.map((b) => ({
        id: b.id,
        name: b.name,
        pricePerStudent: b.pricePerStudent,
        includedModuleIds: b.includedModuleIds,
      })),
    };

    let fullText = '';

    try {
      // For Scenario C (alles-oud-cito-concurrent), use the dedicated retention endpoint
      // which triggers RETENTION_SYSTEM_PROMPT via /api/ai-advice with scenarioType 'C'
      const compResult = usePriceComparisonStore.getState().result;

      if (isRetentionScenario && compResult) {
        const stream = streamRetentionAdvice(
          compResult,
          schoolProfile.levels,
          schoolProfile.studentCounts,
          schoolProfile.selectedModules,
          schoolProfile.moduleSetups,
          schoolplanOpportunities.length > 0 ? schoolplanOpportunities : undefined,
        );

        for await (const chunk of stream) {
          fullText += chunk;
          appendStreamingText(chunk);
        }
      } else {
        // Scenario A or fallback: use generic wizard advice endpoint
        const stream = streamWizardAdvice(
          activeSelections,
          profile,
          differentiators,
          providerData,
          extraContext,
          schoolplanOpportunities.length > 0 ? schoolplanOpportunities : undefined,
        );

        for await (const chunk of stream) {
          fullText += chunk;
          appendStreamingText(chunk);
        }
      }

      const parsed = parseAdviceFromText(fullText);
      setAiAdvice(parsed);

      // Store narrative context for progressive enrichment by AnalysisPanel
      useWizardStore.getState().setWizardNarrativeContext({
        samenvatting: parsed.samenvatting,
        matchingUitleg: parsed.matchingUitleg,
        aanbevolenCitoBundel: parsed.aanbevolenCitoBundel,
        adviezen: parsed.adviezen,
        dmuStrategie: parsed.dmuStrategie,
      });

      // Initialize adjustedSelections from variantSelections
      setAdjustedSelections([...variantSelections]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Het advies kon niet worden gegenereerd. Controleer uw internetverbinding en probeer het opnieuw.',
      );
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  // ─── Apply to table handler ───────────────────────────────────────────────

  const handleApplyToTable = () => {
    useWizardStore.getState().applyToTable();
  };

  // ─── Update adjusted selection ────────────────────────────────────────────

  const handleAdjustProvider = (moduleId: string, provider: 'dia' | 'jij' | 'geen') => {
    const updated = (adjustedSelections.length > 0 ? adjustedSelections : variantSelections).map(
      (s) =>
        s.moduleId === moduleId
          ? { ...s, provider, variantId: null }
          : s,
    );
    setAdjustedSelections(updated);
  };

  // ─── Module name lookup ───────────────────────────────────────────────────

  const getModuleName = (moduleId: string): string => {
    return MODULE_CATALOG.find((m) => m.id === moduleId)?.name ?? moduleId;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 mt-4">
      {/* Heading */}
      <h3 className="text-[15px] font-semibold text-cito-primary">
        AI vergelijkingsadvies
      </h3>

      {/* Extra context field */}
      <ExtraContextField
        value={extraContext}
        onChange={(update) => setExtraContext(update)}
      />

      {/* Generate advice button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGeneratingAdvice}
        className="inline-flex items-center justify-center gap-2 bg-cito-accent text-white min-h-[44px] w-full rounded-lg font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isGeneratingAdvice ? (
          <>
            <Spinner />
            Genereren...
          </>
        ) : hasGenerated ? (
          'Opnieuw genereren'
        ) : (
          'Genereer advies'
        )}
      </button>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Streaming display */}
      {(isGeneratingAdvice || (streamingText && !aiAdvice)) && (
        <div className="bg-cito-primary/5 border border-cito-primary/20 rounded-lg p-4">
          <p className="text-xs font-semibold text-cito-primary uppercase tracking-wide mb-2">
            Advies wordt gegenereerd...
          </p>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
            {streamingText}
            {isGeneratingAdvice && (
              <span className="animate-pulse">|</span>
            )}
          </p>
        </div>
      )}

      {/* Parsed advice result */}
      {aiAdvice && !isGeneratingAdvice && (
        <div className="space-y-4">
          {/* Samenvatting banner */}
          {aiAdvice.samenvatting && (
            <div className="bg-cito-primary text-white rounded-lg p-4">
              <p className="text-base font-medium leading-relaxed">
                {aiAdvice.samenvatting}
              </p>
            </div>
          )}

          {/* Visual separator */}
          <hr className="border-neutral-200" />

          {/* Matching uitleg + Cito bundle recommendation */}
          {aiAdvice.matchingUitleg && (
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <p className="text-sm text-neutral-700 leading-relaxed">
                {aiAdvice.matchingUitleg}
              </p>
              <p className="text-sm font-semibold text-cito-primary mt-2">
                Aanbevolen Cito-bundel:{' '}
                <span className="inline-flex items-center px-2 py-0.5 bg-cito-accent/10 text-cito-accent border border-cito-accent/30 rounded text-xs font-semibold">
                  {getBundelLabel(aiAdvice.aanbevolenCitoBundel)}
                </span>
              </p>
            </div>
          )}

          {/* Advice cards */}
          {aiAdvice.adviezen.length > 0 && (
            <div className="space-y-3">
              {aiAdvice.adviezen.map((item, i) => {
                const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.meerwaarde;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-neutral-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${config.bgColor} ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-900">
                        {item.titel}
                      </h4>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed pl-0.5 whitespace-pre-line">
                      {item.tekst}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* DMU strategie section (collapsible) */}
          {aiAdvice.dmuStrategie &&
            Object.keys(aiAdvice.dmuStrategie).length > 0 && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDmuExpanded(!dmuExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <span>DMU-strategie per rol</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${dmuExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {dmuExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-neutral-100">
                    {Object.entries(aiAdvice.dmuStrategie!).map(
                      ([role, strategy]) => (
                        <div key={role} className="pt-3">
                          <p className="text-sm font-semibold text-neutral-800">
                            {role}
                          </p>
                          <p className="text-sm text-neutral-600 leading-relaxed mt-0.5">
                            {strategy}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Editable matching section (D-19) */}
          <div className="border border-neutral-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">
              Matching aanpassen
            </h4>
            <div className="space-y-3">
              {(adjustedSelections.length > 0
                ? adjustedSelections
                : variantSelections
              ).map((sel) => (
                <div
                  key={sel.moduleId}
                  className="flex items-center justify-between gap-4 py-2 border-b border-neutral-50 last:border-0"
                >
                  <span className="text-sm text-neutral-800 font-medium">
                    {getModuleName(sel.moduleId)}
                  </span>
                  <select
                    value={sel.provider}
                    onChange={(e) =>
                      handleAdjustProvider(
                        sel.moduleId,
                        e.target.value as 'dia' | 'jij' | 'geen',
                      )
                    }
                    className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-cito-accent/20 focus:border-cito-accent outline-none min-h-[36px]"
                  >
                    <option value="dia">DIA</option>
                    <option value="jij">JIJ</option>
                    <option value="geen">Geen</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* "Pas tabel aan" CTA — enabled as soon as variant selections exist */}
      <button
        type="button"
        onClick={handleApplyToTable}
        disabled={activeSelections.length === 0 || isGeneratingAdvice}
        className="inline-flex items-center justify-center gap-2 bg-cito-accent text-white min-h-[44px] w-full rounded-lg font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        Pas tabel aan
      </button>

      {/* AI disclaimer */}
      <p className="text-[11px] text-neutral-400 mt-3">
        Dit advies is automatisch gegenereerd op basis van de vergelijkingsdata en
        provider-informatie. Controleer de informatie altijd voor gebruik in een
        gesprek.
      </p>
    </div>
  );
}
