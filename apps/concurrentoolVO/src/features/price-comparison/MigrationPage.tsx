import { useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { usePriceComparisonStore } from './store';
import { useSchoolProfileStore } from '../school-profile/store';
import { calculateMigration } from '../../engine/migration';
import type { MigrationResult } from '../../engine/migration';
import { CITO_MIGRATION_PRICES } from '../../data/cito-migration-prices';
import { getTotalStudents } from '../../engine/price-comparison';
import { formatCurrency } from '../../lib/format';
import { DisclaimerFooter } from '../../components/ui/DisclaimerFooter';
import { EditableField } from '@/features/school-profile/components/EditableField';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { CitoBundleSelector } from './CitoBundleSelector';
import { PeriodToggle } from './PeriodToggle';
import { AnalysisPanel } from './AnalysisPanel';
import { ComparisonWizard } from './wizard/ComparisonWizard';

interface MigrationPageProps {
  onBack?: () => void;
}

// ─── Multi-year bar chart ─────────────────────────────────────────────────────

function MultiYearChart({ result }: { result: MigrationResult }) {
  const data = result.multiYearProjection.map((p) => ({
    name: `${p.year} jaar`,
    waarde: Math.round(p.cumulativeSavings),
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={52} margin={{ top: 24, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip
            formatter={(v) => [formatCurrency(Number(v)), 'Cumulatieve waarde']}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: 13,
            }}
            cursor={{ fill: 'rgba(0, 48, 130, 0.04)', radius: 4 }}
          />
          <Bar dataKey="waarde" radius={[6, 6, 0, 0]}>
            <LabelList
              dataKey="waarde"
              position="top"
              formatter={(v) => formatCurrency(Number(v))}
              style={{ fontSize: 11, fontWeight: 500, fill: '#6B7280' }}
            />
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.waarde >= 0 ? '#003082' : '#dc2626'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MigrationPage({ onBack }: MigrationPageProps) {
  const initialize = usePriceComparisonStore((s) => s.initialize);
  const migrationHourlyRate = usePriceComparisonStore((s) => s.migrationHourlyRate);
  const migrationTimeSavingOverrides = usePriceComparisonStore((s) => s.migrationTimeSavingOverrides);
  const customTimeSavingTasks = usePriceComparisonStore((s) => s.customTimeSavingTasks);
  const hiddenTimeSavingTaskIds = usePriceComparisonStore((s) => s.hiddenTimeSavingTaskIds);
  const setMigrationHourlyRate = usePriceComparisonStore((s) => s.setMigrationHourlyRate);
  const setMigrationTimeSavingOverride = usePriceComparisonStore((s) => s.setMigrationTimeSavingOverride);

  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const studentCounts = useSchoolProfileStore((s) => s.studentCounts);
  const levels = useSchoolProfileStore((s) => s.levels);
  const { slug } = useParams({ strict: false }) as { slug?: string };

  useEffect(() => {
    initialize();
  }, [initialize]);

  const result: MigrationResult = calculateMigration(
    selectedModules,
    studentCounts,
    CITO_MIGRATION_PRICES,
    migrationTimeSavingOverrides,
    migrationHourlyRate,
    0,
    customTimeSavingTasks,
    hiddenTimeSavingTaskIds,
  );

  const totalStudents = getTotalStudents(studentCounts);

  const BackButton = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="text-sm text-cito-primary hover:underline mb-8 inline-flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Terug naar schoolprofiel
    </button>
  ) : null;

  if (result.modules.length === 0) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-16">
        {BackButton}
        <h2 className="text-xl font-semibold mb-2">Geen migratiedata beschikbaar</h2>
        <p className="text-base text-neutral-500 mb-6">
          Voor de geselecteerde modules zijn nog geen migratieprijzen ingevuld.
          Pas het bestand <code>src/data/cito-migration-prices.ts</code> aan met de actuele tarieven.
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className="bg-cito-primary text-white text-sm font-semibold py-2 px-4 rounded-lg hover:opacity-90">
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
          Business case overstap Cito-platform
        </h1>
        <p className="mt-2 text-base text-neutral-500">
          Financieel overzicht + tijdswinst voor de migratie van huidig naar nieuw Cito-platform
          {totalStudents > 0 && ` · ${totalStudents} leerlingen`}
          {levels.length > 0 && ` · ${levels.map((l) => l.toUpperCase()).join(', ')}`}.
        </p>
      </div>

      {/* Cito bundel + contractperiode keuze */}
      <div className="flex flex-wrap items-start gap-6 mb-8">
        <CitoBundleSelector />
        <PeriodToggle />
      </div>

      {/* Financial overview */}
      <div className="bg-white rounded-xl border border-neutral-200 mb-8 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-neutral-900">Financieel overzicht</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Module</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Huidig platform</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nieuw platform</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Verschil/jaar</th>
            </tr>
          </thead>
          <tbody>
            {result.modules.map((mod) => (
              <tr key={mod.moduleId} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                <td className="py-3 px-4 text-sm font-medium text-neutral-900">{mod.moduleName}</td>
                <td className="py-3 px-4 text-sm text-neutral-700 text-right">{formatCurrency(mod.oldTotalCost)}</td>
                <td className="py-3 px-4 text-sm text-neutral-700 text-right">{formatCurrency(mod.newTotalCost)}</td>
                <td className={`py-3 px-4 text-sm font-semibold text-right ${mod.annualDifference > 0 ? 'text-green-700' : mod.annualDifference < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                  {mod.annualDifference === 0 ? 'Gelijk' : mod.annualDifference > 0 ? `−${formatCurrency(mod.annualDifference)}` : `+${formatCurrency(Math.abs(mod.annualDifference))}`}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900">Totaal</td>
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900 text-right">{formatCurrency(result.totalOldCost)}</td>
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900 text-right">{formatCurrency(result.totalNewCost)}</td>
              <td className={`py-3 px-4 text-sm font-semibold text-right ${result.financialDifference > 0 ? 'text-green-700' : result.financialDifference < 0 ? 'text-red-600' : 'text-neutral-500'}`}>
                {result.financialDifference === 0 ? 'Gelijk' : result.financialDifference > 0 ? `−${formatCurrency(result.financialDifference)}` : `+${formatCurrency(Math.abs(result.financialDifference))}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Time savings calculator */}
      <div className="bg-white rounded-xl border border-neutral-200 mb-8 overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-[15px] font-semibold text-neutral-900">Tijdswinst-calculator</h2>
          {migrationHourlyRate !== null && migrationHourlyRate > 0 ? (
            <EditableField
              label="Uurtarief:"
              value={migrationHourlyRate}
              unit="€/uur"
              onChange={setMigrationHourlyRate}
            />
          ) : (
            <button
              type="button"
              onClick={() => setMigrationHourlyRate(50)}
              className="text-sm text-cito-primary underline decoration-dashed underline-offset-2"
            >
              Uurtarief invullen
            </button>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Taak</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Huidig</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nieuw</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Uren/jaar</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Waarde/jaar</th>
            </tr>
          </thead>
          <tbody>
            {result.timeSavings.map((task) => (
              <tr key={task.taskId} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                <td className="py-3 px-4 text-sm font-medium text-neutral-900">{task.taskLabel}</td>
                <td className="py-3 px-4 text-sm text-neutral-500">{task.oldMethodLabel}</td>
                <td className="py-3 px-4 text-sm text-neutral-500">{task.newMethodLabel}</td>
                <td className="py-3 px-4 text-right">
                  <EditableField
                    label=""
                    value={task.hoursPerYear ?? 0}
                    unit="uur"
                    onChange={(h) => setMigrationTimeSavingOverride(task.taskId, h)}
                  />
                </td>
                <td className="py-3 px-4 text-sm font-medium text-green-700 text-right">{formatCurrency(task.valuePerYear)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
              <td colSpan={3} className="py-3 px-4 text-sm font-semibold text-neutral-900">Totaal tijdswinst</td>
              <td className="py-3 px-4 text-sm font-semibold text-neutral-900 text-right">{result.totalTimeSavingsHours} uur</td>
              <td className="py-3 px-4 text-sm font-semibold text-green-700 text-right">{formatCurrency(result.totalTimeSavingsValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Total value card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">Financieel voordeel</div>
          <div className={`text-[22px] font-semibold leading-none ${result.financialDifference >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {result.financialDifference === 0 ? 'Gelijk' : result.financialDifference > 0 ? `−${formatCurrency(result.financialDifference)}` : `+${formatCurrency(Math.abs(result.financialDifference))}`}
          </div>
          <div className="text-xs text-neutral-400 mt-1">per jaar</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase tracking-wide">Tijdsbesparing</div>
          <div className="text-[22px] font-semibold leading-none text-green-700">{formatCurrency(result.totalTimeSavingsValue)}</div>
          <div className="text-xs text-neutral-400 mt-1">
            {migrationHourlyRate !== null && migrationHourlyRate > 0
              ? `${result.totalTimeSavingsHours} uur × ${formatCurrency(migrationHourlyRate)}/uur`
              : `${result.totalTimeSavingsHours} uur/jaar`}
          </div>
        </div>
        <div className="rounded-lg bg-cito-primary p-4 text-white">
          <div className="text-xs font-semibold opacity-70 mb-1 uppercase tracking-wide">Totale jaarwaarde</div>
          <div className="text-[22px] font-semibold leading-none">{formatCurrency(result.totalAnnualValue)}</div>
          <div className="text-xs opacity-60 mt-1">financieel + tijdswinst</div>
        </div>
      </div>

      {/* Multi-year projection */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">Meerjarenprojectie</h2>
        <MultiYearChart result={result} />
        <p className="text-xs text-neutral-400 mt-3 text-center">
          Cumulatieve waarde over 1 en 3 jaar (financieel + tijdswinst)
        </p>
      </div>

      {/* AI Vergelijkingswizard */}
      <div className="mb-8">
        <ComparisonWizard />
      </div>

      {/* AI Migration Analysis */}
      <AnalysisPanel mode="migration" schoolId={slug} migrationResult={result} />

      <DisclaimerFooter showDisclaimer={true} />
    </div>
  );
}
