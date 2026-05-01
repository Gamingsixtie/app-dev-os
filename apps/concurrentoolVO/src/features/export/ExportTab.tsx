import { useMemo, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { usePriceComparisonStore } from '@/features/price-comparison/store';
import { useSchool } from '@/hooks/useSchools';
import { useSchoolPrices } from '@/hooks/useSchoolPrices';
import { useSchoolplanAnalysis } from '@/hooks/useSchoolplanAnalysis';
import { calculateComparison, getTotalStudents } from '@/engine/price-comparison';
import { calculateMigration } from '@/engine/migration';
import { CITO_MIGRATION_PRICES } from '@/data/cito-migration-prices';
import { getDefaultAssumptions } from '@/data/dmu-assumptions';
import type { DmuAssumption } from '@/data/dmu-assumptions';
import { CITO_PRODUCT_ADVANTAGES } from '@/data/cito-product-info';
import { tagSchoolplanOpportunity } from './utils/dmu-tag-filter';
import type { ExportConfig, ReportData } from './types';
import { ExportConfigPanel } from './components/ExportConfigPanel';
import { ExportPreview } from './components/ExportPreview';
import { PdfDownloadButton } from './components/PdfDownloadButton';
import { ClipboardButton } from './components/ClipboardButton';

export default function ExportTab() {
  const { slug } = useParams({ from: '/scholen/$slug' });

  // Config state
  const [config, setConfig] = useState<ExportConfig>({
    reportType: 'gecombineerd',
    dmuTarget: 'generiek',
  });

  // Assumptions state (session-scoped, not Zustand)
  const [assumptions, setAssumptions] = useState<DmuAssumption[]>(
    () => getDefaultAssumptions(config.dmuTarget)
  );

  // Reset assumptions when DMU target changes — done during render via a
  // previous-prop comparison instead of useEffect, which is the React-recommended
  // pattern for derived state and avoids the set-state-in-effect anti-pattern.
  const [prevDmuTarget, setPrevDmuTarget] = useState(config.dmuTarget);
  if (prevDmuTarget !== config.dmuTarget) {
    setPrevDmuTarget(config.dmuTarget);
    setAssumptions(getDefaultAssumptions(config.dmuTarget));
  }

  // School data
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const schoolName = useSchoolProfileStore((s) => s.schoolName);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const migrationHourlyRate = usePriceComparisonStore((s) => s.migrationHourlyRate);
  const migrationTimeSavingOverrides = usePriceComparisonStore((s) => s.migrationTimeSavingOverrides);

  const { data: school } = useSchool(slug);
  const { data: schoolPrices } = useSchoolPrices(activeSchoolId ?? '');
  const { data: schoolplanAnalysis } = useSchoolplanAnalysis(school?.id ?? '');
  const switchingCosts = school?.switchingCosts ?? 0;

  // Compute comparison result
  const comparison = useMemo(() => {
    if (selectedModules.length === 0) return null;
    try {
      return calculateComparison(selectedModules, studentCounts);
    } catch {
      return null;
    }
  }, [selectedModules, studentCounts, schoolPrices]);

  // Compute migration result
  const migration = useMemo(
    () =>
      calculateMigration(
        selectedModules,
        studentCounts,
        CITO_MIGRATION_PRICES,
        migrationTimeSavingOverrides,
        migrationHourlyRate,
        switchingCosts,
      ),
    [selectedModules, studentCounts, migrationTimeSavingOverrides, migrationHourlyRate, switchingCosts],
  );

  // Compute price difference (Cito vs cheapest competitor)
  const priceDifference = useMemo(() => {
    if (!comparison) return null;
    const citoTotal = comparison.totals.cito;
    const competitorTotals = [
      comparison.differences.citoVsDia !== null ? comparison.totals.dia : null,
      comparison.differences.citoVsJij !== null ? comparison.totals.jij : null,
    ].filter((t): t is number => t !== null);
    if (competitorTotals.length === 0) return null;
    return Math.min(...competitorTotals) - citoTotal;
  }, [comparison]);

  const today = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Map schoolplan opportunities + annotations to PDF-friendly format
  const schoolplanOpportunities = schoolplanAnalysis?.opportunities?.length
    ? schoolplanAnalysis.opportunities.map((opp, idx) => {
        const annotation = schoolplanAnalysis.opportunity_annotations?.[String(idx)];
        return {
          theme: opp.theme,
          citoProduct: opp.citoProduct,
          explanation: opp.explanation,
          status: (annotation?.status ?? 'open') as 'open' | 'besproken' | 'niet-relevant',
        };
      })
    : undefined;

  // Tag schoolplan opportunities for DMU filtering
  const taggedSchoolplanOpportunities = schoolplanOpportunities
    ? schoolplanOpportunities.map(opp => ({
        ...opp,
        tags: tagSchoolplanOpportunity(opp),
      }))
    : undefined;

  const reportData: ReportData = {
    schoolName: schoolName || 'School',
    date: today,
    selectedModules,
    totalStudents: getTotalStudents(studentCounts),
    comparison,
    migration,
    priceDifference,
    schoolplanOpportunities: taggedSchoolplanOpportunities,
    dmuAssumptions: assumptions,
    productAdvantages: CITO_PRODUCT_ADVANTAGES,
  };

  const hasData = comparison !== null || (migration && migration.modules.length > 0);

  return (
    <div className="p-8 max-sm:p-4 pb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Export</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Genereer een PDF-rapport om te delen met de school
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* Left: config */}
        <div className="space-y-6">
          <ExportConfigPanel
            config={config}
            onChange={setConfig}
            assumptions={assumptions}
            defaultAssumptions={getDefaultAssumptions(config.dmuTarget)}
            onAssumptionsChange={setAssumptions}
          />
          <PdfDownloadButton config={config} data={reportData} disabled={!hasData} />
          <ClipboardButton config={config} data={reportData} disabled={!hasData} />
        </div>

        {/* Right: preview */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Voorbeeld</h3>
          <ExportPreview config={config} data={reportData} />
        </div>
      </div>
    </div>
  );
}
