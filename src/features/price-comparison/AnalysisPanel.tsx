import { useState, useCallback, useEffect } from 'react';
import { useSchoolProfileStore } from '../school-profile/store';
import { usePriceComparisonStore } from './store';
import { getTotalStudents } from '../../engine/price-comparison';
import { generateAnalysis, type AnalysisResult, type ConcurrentDetail, type PrijsAnalyseItem, type AnalysisProgress, AnalysisError } from '../../lib/ai-analysis';
import { useSchoolplanAnalysis } from '@/hooks/useSchoolplanAnalysis';
import { useWizardStore } from './wizard/wizard-store';
import type { CurrentVsProposedResult } from '../../engine/current-vs-proposed';
import type { MigrationResult } from '../../engine/migration';

// ─── Position chip ──────────────────────────────────────────────────────────

const POSITIE_CONFIG: Record<PrijsAnalyseItem['citoPositie'], { label: string; color: string; bg: string }> = {
  goedkoper: { label: 'Goedkoper', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  duurder: { label: 'Duurder', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  vergelijkbaar: { label: 'Vergelijkbaar', color: 'text-neutral-600', bg: 'bg-neutral-50 border-neutral-200' },
};

// ─── Competitor detail card ─────────────────────────────────────────────────

function ConcurrentCard({ detail }: { detail: ConcurrentDetail }) {
  const providerLabel = detail.provider === 'dia' ? 'DIA' : 'JIJ!';

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <h4 className="text-sm font-semibold text-neutral-900 mb-3">
        Cito vs. {providerLabel}
      </h4>
      <div className="space-y-3">
        {/* Cito beter */}
        {detail.citoBeter.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">
              Cito sterker
            </div>
            <ul className="space-y-1">
              {detail.citoBeter.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concurrent beter */}
        {detail.concurrentBeter.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">
              {providerLabel} sterker
            </div>
            <ul className="space-y-1">
              {detail.concurrentBeter.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weerlegging */}
        {detail.weerlegging.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wide">
              Weerlegging
            </div>
            <ul className="space-y-1">
              {detail.weerlegging.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface AnalysisPanelProps {
  mode: 'comparison' | 'current-vs-proposed' | 'migration';
  schoolId?: string;
  currentVsProposedResult?: CurrentVsProposedResult | null;
  migrationResult?: MigrationResult | null;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export function AnalysisPanel({ mode, schoolId, currentVsProposedResult, migrationResult, onAnalysisComplete }: AnalysisPanelProps) {
  const result = usePriceComparisonStore((s) => s.result);
  const diaPackageResult = usePriceComparisonStore((s) => s.diaPackageResult);
  const levels = useSchoolProfileStore((s) => s.levels);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);

  const { data: schoolplanData } = useSchoolplanAnalysis(schoolId ?? '');
  const wizardNarrativeContext = useWizardStore((s) => s.wizardNarrativeContext);
  const shouldAutoTriggerAnalysis = useWizardStore((s) => s.shouldAutoTriggerAnalysis);
  const clearAutoTrigger = useWizardStore((s) => s.clearAutoTrigger);
  const cachedAnalysisResult = useWizardStore((s) => s.cachedAnalysisResult);
  const setCachedAnalysisResult = useWizardStore((s) => s.setCachedAnalysisResult);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(cachedAnalysisResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'timeout' | 'server' | 'parse' | 'auth' | 'unknown' | null>(null);
  const [errorRetryable, setErrorRetryable] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [progressAttempt, setProgressAttempt] = useState<{ current: number; max: number } | null>(null);

  const totalStudents = getTotalStudents(studentCounts);

  const PROGRESS_LABELS: Record<AnalysisProgress, string> = {
    connecting: 'Verbinding maken...',
    generating: 'Analyse genereren...',
    processing: 'Resultaat verwerken...',
    retrying: 'Opnieuw proberen...',
  };

  const handleProgress = useCallback((state: AnalysisProgress, attempt?: number, maxAttempts?: number) => {
    setProgress(state);
    if (attempt !== undefined && maxAttempts !== undefined) {
      setProgressAttempt({ current: attempt, max: maxAttempts });
    }
  }, []);

  const handleGenerate = useCallback(async (deep = false) => {
    if (!result) return;

    setLoading(true);
    setError(null);
    setErrorType(null);
    setErrorRetryable(false);
    setProgress('connecting');
    setProgressAttempt(null);
    setAnalysis(null);

    try {
      const analysisResult = await generateAnalysis(
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
        wizardNarrativeContext,
        { deepAnalysis: deep, onProgress: handleProgress },
      );
      setAnalysis(analysisResult);
      setCachedAnalysisResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      console.error('[AnalysisPanel] Error:', err);
      if (err instanceof AnalysisError) {
        setError(err.message);
        setErrorType(err.type);
        setErrorRetryable(err.retryable);
      } else {
        setError(err instanceof Error ? err.message : 'Er ging iets mis bij het genereren van de analyse.');
        setErrorType('unknown');
        setErrorRetryable(true);
      }
    } finally {
      setLoading(false);
      setProgress(null);
      setProgressAttempt(null);
    }
  }, [result, mode, levels, studentCounts, selectedModules, moduleSetups, diaPackageResult, currentVsProposedResult, schoolplanData, migrationResult, wizardNarrativeContext, handleProgress, onAnalysisComplete]);

  // Auto-trigger after wizard applies to table
  useEffect(() => {
    if (shouldAutoTriggerAnalysis && result && !loading) {
      clearAutoTrigger();
      handleGenerate(false);
    }
  }, [shouldAutoTriggerAnalysis, result, loading, clearAutoTrigger, handleGenerate]);

  if (!result || selectedModules.length === 0 || totalStudents === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-600"
              aria-hidden="true"
            >
              <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-indigo-700">
              {mode === 'migration' ? 'AI Migratie-analyse' : 'AI Concurrentieanalyse'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {mode === 'migration'
                ? 'Business case analyse voor de overstap naar het nieuwe Cito-platform'
                : 'Diepgaande analyse van prijsverschillen, sterke punten en gespreksargumenten'}
              {schoolId && schoolplanData ? ' · inclusief schoolplan' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleGenerate(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
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
                Analyseren...
              </>
            ) : analysis ? (
              'Opnieuw analyseren'
            ) : (
              'Analyse genereren'
            )}
          </button>
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-indigo-600 text-indigo-600 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Diepgaande analyse met Claude Opus -- voor key accounts"
          >
            {loading ? '...' : 'Diepgaand'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3" data-error-type={errorType}>
          <p className="text-sm text-red-800">{error}</p>
          {errorRetryable && (
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Opnieuw proberen
            </button>
          )}
        </div>
      )}

      {/* Progress indicator */}
      {loading && progress && (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm text-blue-800">
            {PROGRESS_LABELS[progress]}
            {progress === 'retrying' && progressAttempt && ` (poging ${progressAttempt.current}/${progressAttempt.max})`}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-indigo-50 rounded-lg" />
          <div className="h-24 bg-neutral-50 rounded-lg" />
          <div className="h-24 bg-neutral-50 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-32 bg-neutral-50 rounded-lg" />
            <div className="h-32 bg-neutral-50 rounded-lg" />
          </div>
          <div className="h-20 bg-neutral-50 rounded-lg" />
        </div>
      )}

      {/* Analysis results */}
      {analysis && !loading && (
        <div className="space-y-5">
          {/* 1. Samenvatting */}
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
            <h3 className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
              Samenvatting
            </h3>
            <p className="text-sm text-indigo-900 leading-relaxed">
              {analysis.samenvatting}
            </p>
          </div>

          {/* 2. Prijsanalyse */}
          {analysis.prijsanalyse.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Prijsanalyse per module
              </h3>
              <div className="space-y-2">
                {analysis.prijsanalyse.map((item, i) => {
                  const config = POSITIE_CONFIG[item.citoPositie] ?? POSITIE_CONFIG.vergelijkbaar;
                  return (
                    <div key={i} className="rounded-lg border border-neutral-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-neutral-900">{item.module}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{item.vergelijking}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Cito Sterke Punten */}
          {analysis.citoSterkePunten.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                {mode === 'migration' ? 'Platformverbeteringen' : 'Cito sterke punten'}
              </h3>
              <div className="space-y-3">
                {analysis.citoSterkePunten.map((item, i) => (
                  <div key={i} className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                    <div className="text-sm font-semibold text-green-800 mb-1.5">{item.module}</div>
                    <ul className="space-y-1">
                      {item.argumenten.map((arg, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-neutral-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Concurrentie Vergelijking */}
          {analysis.concurrentieVergelijking.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Concurrentievergelijking
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.concurrentieVergelijking.map((detail, i) => (
                  <ConcurrentCard key={i} detail={detail} />
                ))}
              </div>
            </div>
          )}

          {/* 5. Schoolplan Koppeling (only if data available) */}
          {analysis.schoolplanKoppeling && analysis.schoolplanKoppeling.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Koppeling met schoolplan
              </h3>
              <div className="space-y-2">
                {analysis.schoolplanKoppeling.map((item, i) => (
                  <div key={i} className="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
                    <div className="text-sm font-semibold text-purple-800 mb-1">{item.thema}</div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{item.citoAansluiting}</p>
                    {item.citaat && (
                      <blockquote className="mt-2 pl-3 border-l-2 border-purple-300 text-xs text-purple-700 italic">
                        &ldquo;{item.citaat}&rdquo;
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Gespreksargumenten */}
          {analysis.gespreksargumenten.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Kant-en-klare gespreksargumenten
              </h3>
              <ol className="space-y-2">
                {analysis.gespreksargumenten.map((arg, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-cito-primary/10 text-cito-primary rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-neutral-700 leading-relaxed">{arg}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-neutral-400 mt-2">
            Deze analyse is automatisch gegenereerd op basis van de vergelijkingsdata en schoolprofiel.
            Controleer de informatie altijd voor gebruik in een gesprek.
          </p>
        </div>
      )}

      {/* Empty state — before first generation */}
      {!analysis && !loading && !error && (
        <p className="text-sm text-neutral-400">
          Klik op &ldquo;AI Analyse&rdquo; voor een diepgaande concurrentieanalyse met prijsuitleg, sterke punten en kant-en-klare gespreksargumenten.
        </p>
      )}
    </div>
  );
}
