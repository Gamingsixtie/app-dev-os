import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { calculateCurrentVsProposed } from '../../engine/current-vs-proposed';
import type { CurrentVsProposedResult, ModuleCurrentVsProposed } from '../../engine/current-vs-proposed';
import { DEFAULT_PRICES } from '../../data/default-prices';
import { getTotalStudents } from '../../engine/price-comparison';
import { formatCurrency } from '../../lib/format';
import { DisclaimerFooter } from '../../components/ui/DisclaimerFooter';
import { MODULE_DIFFERENTIATORS } from '../../data/differentiators';
import { CitoBundleSelector } from './CitoBundleSelector';
import { getCitoBundle } from '../../data/cito-bundles';
import { applyCitoBundlePrices } from '../../engine/cito-bundles';
import { detectScenario } from '../../engine/scenario-detection';
import { AnalysisPanel } from './AnalysisPanel';
import { ComparisonWizard } from './wizard/ComparisonWizard';

interface CurrentVsProposedPageProps {
  onBack?: () => void;
}

// ─── Module row in table ─────────────────────────────────────────────────────

function ModuleRow({ mod }: { mod: ModuleCurrentVsProposed }) {
  const { isNewModule, annualDifference } = mod;

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-neutral-900">
        {mod.moduleName}
        {isNewModule && (
          <span className="ml-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
            Nieuwe module
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-neutral-700">
        <div className="font-medium">{mod.currentProviderLabel}</div>
        {mod.currentTotalCost !== null ? (
          <div className="text-neutral-500">{formatCurrency(mod.currentTotalCost)}/jaar</div>
        ) : isNewModule ? (
          <div className="text-neutral-400 italic">Geen</div>
        ) : (
          <div className="text-neutral-400 italic">Prijs onbekend</div>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-neutral-700">
        {mod.proposedCitoTotalCost !== null ? (
          <div className="font-medium">{formatCurrency(mod.proposedCitoTotalCost)}/jaar</div>
        ) : (
          <div className="text-neutral-400 italic">Niet aangeboden</div>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-right">
        {annualDifference !== null ? (
          <span
            className={`font-semibold ${
              annualDifference > 0
                ? 'text-green-700'
                : annualDifference < 0
                  ? 'text-red-600'
                  : 'text-neutral-500'
            }`}
          >
            {annualDifference === 0
              ? 'Gelijk'
              : annualDifference > 0
                ? `−${formatCurrency(annualDifference)}`
                : `+${formatCurrency(Math.abs(annualDifference))}`}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryBanner({ result }: { result: CurrentVsProposedResult }) {
  const { totalCurrentCost, totalProposedCost, totalAnnualSavings } = result;
  const hasCurrent = result.modules.some((m) => m.currentTotalCost !== null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
      {/* Huidige kosten */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
          Huidige kosten
        </div>
        <div className="text-[22px] font-semibold text-neutral-900 leading-none">
          {hasCurrent ? formatCurrency(totalCurrentCost) : '—'}
        </div>
        <div className="text-xs text-neutral-400 mt-1">per jaar</div>
      </div>

      {/* Met Cito */}
      <div className="rounded-lg bg-cito-primary p-4 text-white">
        <div className="text-xs font-semibold opacity-70 mb-1 uppercase tracking-wide">
          Met Cito
        </div>
        <div className="text-[22px] font-semibold leading-none">
          {formatCurrency(totalProposedCost)}
        </div>
        <div className="text-xs opacity-60 mt-1">per jaar · op basis van publicatieprijzen</div>
      </div>

      {/* Verschil */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">
          Jaarlijks verschil
        </div>
        {hasCurrent ? (
          <>
            <div
              className={`text-[22px] font-semibold leading-none ${
                totalAnnualSavings > 0
                  ? 'text-green-700'
                  : totalAnnualSavings < 0
                    ? 'text-red-600'
                    : 'text-neutral-900'
              }`}
            >
              {totalAnnualSavings === 0
                ? 'Gelijk'
                : totalAnnualSavings > 0
                  ? `−${formatCurrency(totalAnnualSavings)}`
                  : `+${formatCurrency(Math.abs(totalAnnualSavings))}`}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {totalAnnualSavings > 0
                ? 'besparing met Cito'
                : totalAnnualSavings < 0
                  ? 'meerkosten met Cito'
                  : ''}
            </div>
          </>
        ) : (
          <div className="text-[22px] font-semibold leading-none text-neutral-400">—</div>
        )}
      </div>
    </div>
  );
}

// ─── Cito advantages ─────────────────────────────────────────────────────────

function CitoAdvantages({ moduleIds }: { moduleIds: string[] }) {
  const advantages = moduleIds
    .flatMap((id) => MODULE_DIFFERENTIATORS.find((d) => d.moduleId === id)?.cito ?? [])
    .filter((item, i, arr) => arr.indexOf(item) === i);

  if (advantages.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
      <h3 className="text-[15px] font-semibold text-cito-primary mb-3">
        Unieke Cito voordelen voor deze moduleselectie
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {advantages.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cito-primary flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Upsell opportunities ─────────────────────────────────────────────────────

function UpsellSection({ modules }: { modules: ModuleCurrentVsProposed[] }) {
  const newModules = modules.filter((m) => m.isNewModule && m.proposedCitoTotalCost !== null);
  if (newModules.length === 0) return null;

  const upsellTotal = newModules.reduce((sum, m) => sum + (m.proposedCitoTotalCost ?? 0), 0);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
      <h3 className="text-[15px] font-semibold text-blue-900 mb-2">
        Upsell-mogelijkheden
      </h3>
      <p className="text-sm text-blue-800 mb-4">
        Deze school gebruikt de volgende modules nog niet. Met Cito erbij kost dat{' '}
        <span className="font-semibold">{formatCurrency(upsellTotal)}/jaar</span> extra.
      </p>
      <div className="space-y-2">
        {newModules.map((mod) => (
          <div
            key={mod.moduleId}
            className="flex items-center justify-between bg-white rounded-lg border border-blue-100 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                Nieuw
              </span>
              <span className="text-sm font-medium text-neutral-900">{mod.moduleName}</span>
            </div>
            <span className="text-sm font-semibold text-neutral-700">
              {mod.proposedCitoCostPerStudent !== null
                ? `${formatCurrency(mod.proposedCitoCostPerStudent)}/leerling`
                : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Migration CTA banner ─────────────────────────────────────────────────────

function MigrationBanner({ migrationModuleCount, slug }: { migrationModuleCount: number; slug?: string }) {
  const navigate = useNavigate();

  if (migrationModuleCount === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-900">
          {migrationModuleCount} module{migrationModuleCount > 1 ? 's' : ''} op het oude Cito-platform
        </p>
        <p className="text-sm text-amber-800 mt-1">
          Voor deze modules is een migratieberekening (oud → nieuw platform) relevanter dan een concurrentieprijsvergelijking.
        </p>
        {slug && (
          <button
            type="button"
            onClick={() => navigate({ to: '/scholen/$slug/migratie', params: { slug } })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-700 underline"
          >
            Bekijk migratieberekening
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CurrentVsProposedPage({ onBack }: CurrentVsProposedPageProps) {
  const initialize = usePriceComparisonStore((s) => s.initialize);
  const citoBundleType = usePriceComparisonStore((s) => s.citoBundleType);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const levels = useSchoolProfileStore((s) => s.levels);
  const { slug } = useParams({ strict: false }) as { slug?: string };

  // Detect mixed scenario for migration CTA
  const detection = useMemo(() => detectScenario(moduleSetups), [moduleSetups]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Apply Cito bundle pricing to the prices used for current-vs-proposed
  const bundle = getCitoBundle(citoBundleType);
  const bundlePrices = applyCitoBundlePrices(DEFAULT_PRICES, bundle, selectedModules);

  const annualResult: CurrentVsProposedResult | null =
    moduleSetups.length > 0
      ? calculateCurrentVsProposed(moduleSetups, studentCounts, bundlePrices)
      : null;

  // Apply contract period multipliers to the result
  const result = annualResult;

  const totalStudents = getTotalStudents(studentCounts);

  const BackButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="text-sm text-cito-primary hover:underline mb-8 inline-flex items-center gap-1"
    >
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
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Terug naar schoolprofiel
    </button>
  ) : null;

  if (selectedModules.length === 0 || !result) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-16">
        {BackButton}
        <h2 className="text-xl font-semibold mb-2">Geen modules geselecteerd</h2>
        <p className="text-base text-neutral-500 mb-6">
          Ga terug naar uw schoolprofiel en selecteer minimaal een module.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="bg-cito-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90"
          >
            Terug naar schoolprofiel
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-12">
      {BackButton}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-cito-primary">
          Uw situatie vs. Cito
        </h1>
        <p className="mt-2 text-base text-neutral-500">
          Vergelijk uw huidige licentiekosten met Cito op basis van publicatieprijzen
          {totalStudents > 0 && ` · ${totalStudents} leerlingen`}
          {levels.length > 0 && ` · ${levels.map((l) => l.toUpperCase()).join(', ')}`}.
        </p>
        {result.hasSpecialPrices && (
          <p className="mt-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Berekening gebaseerd op ingevoerde afwijkende prijzen
          </p>
        )}
      </div>

      {/* Cito bundel keuze (contractperiode niet van toepassing — altijd jaarbasis) */}
      <div className="flex flex-wrap items-start gap-6 mb-8">
        <CitoBundleSelector />
      </div>

      {/* Summary banner */}
      <SummaryBanner result={result} />

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-neutral-200 mb-8 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Module
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Huidige situatie
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Met Cito
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Verschil/jaar
              </th>
            </tr>
          </thead>
          <tbody>
            {result.modules.map((mod) => (
              <ModuleRow key={mod.moduleId} mod={mod} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900">Totaal</td>
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900">
                {result.modules.some((m) => m.currentTotalCost !== null)
                  ? formatCurrency(result.totalCurrentCost)
                  : '—'}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900">
                {formatCurrency(result.totalProposedCost)}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-right">
                {result.modules.some((m) => m.currentTotalCost !== null) ? (
                  <span
                    className={
                      result.totalAnnualSavings > 0
                        ? 'text-green-700'
                        : result.totalAnnualSavings < 0
                          ? 'text-red-600'
                          : 'text-neutral-900'
                    }
                  >
                    {result.totalAnnualSavings === 0
                      ? 'Gelijk'
                      : result.totalAnnualSavings > 0
                        ? `−${formatCurrency(result.totalAnnualSavings)}`
                        : `+${formatCurrency(Math.abs(result.totalAnnualSavings))}`}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* AI Vergelijkingswizard */}
      <div className="mb-8">
        <ComparisonWizard />
      </div>

      {/* AI Concurrentieanalyse */}
      <AnalysisPanel
        mode="current-vs-proposed"
        schoolId={slug}
        currentVsProposedResult={result}
      />

      {/* Migration CTA for mixed scenarios */}
      {detection.hasMigrationModules && (
        <MigrationBanner
          migrationModuleCount={detection.migrationModuleIds.length}
          slug={slug}
        />
      )}

      {/* Upsell opportunities for modules not yet in use */}
      {result && <UpsellSection modules={result.modules} />}

      {/* Cito advantages */}
      <CitoAdvantages moduleIds={selectedModules} />

      {/* Time savings section */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-cito-primary/10 rounded-lg flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cito-primary"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-neutral-900">
              Tijdbesparing — meer dan alleen kosten
            </h3>
            <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
              Cito biedt aantoonbare tijdswinst voor docenten en administratie door geïntegreerde
              remediering, automatische rapportages en directe koppeling met methodeaanbieders.
              Vraag uw accountmanager om een gepersonaliseerde tijdwinst-analyse voor deze school.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Automatische rapportages
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Remediering inbegrepen
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-neutral-200 rounded-full px-3 py-1 text-xs font-medium text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                Directe methodeaanbiederintegratie
              </span>
            </div>
          </div>
        </div>
      </div>

      <DisclaimerFooter showDisclaimer={true} />
    </div>
  );
}
