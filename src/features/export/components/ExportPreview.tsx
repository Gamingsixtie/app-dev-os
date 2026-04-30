import { getReportSections } from '../pdf/dmu-filters';
import type { SectionId } from '../pdf/dmu-filters';
import type { ExportConfig, ReportData } from '../types';
import { filterByDmuTags } from '../utils/dmu-tag-filter';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import type { ProviderKey } from '@/engine/price-comparison';
import { formatCurrencyCompact } from '@/lib/format';

interface ExportPreviewProps {
  config: ExportConfig;
  data: ReportData;
}

const PROVIDERS: ProviderKey[] = ['cito', 'dia', 'jij', 'saqi'];

const REPORT_TITLES: Record<ExportConfig['reportType'], string> = {
  prijsvergelijking: 'Prijsvergelijking',
  waarderapport: 'Waarderapport',
  gecombineerd: 'Vergelijking & Waarde',
};

const DMU_LABELS: Record<ExportConfig['dmuTarget'], string> = {
  generiek: 'Generiek',
  coordinator: 'Coördinator',
  mt: 'MT / Directie',
  finance: 'Finance',
};

export function ExportPreview({ config, data }: ExportPreviewProps) {
  const reportSections = getReportSections(config.reportType, config.dmuTarget);

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'summary':
        return (
          <div key={sectionId}>
            <div className="bg-neutral-50 border-l-3 border-cito-accent p-4 rounded">
              <h4 className="font-semibold text-cito-primary text-sm mb-2">Samenvatting</h4>
              <ul className="text-sm text-neutral-700 space-y-1">
                {data.priceDifference !== null && data.priceDifference > 0 && (
                  <li>• {formatCurrencyCompact(data.priceDifference)} goedkoper dan de concurrentie</li>
                )}
                {data.migration && data.migration.totalTimeSavingsHours > 0 && (
                  <li>• {data.migration.totalTimeSavingsHours} uur tijdwinst per jaar</li>
                )}
                {data.migration && data.migration.totalAnnualValue > 0 && (
                  <li>• Totale jaarlijkse waarde: {formatCurrencyCompact(data.migration.totalAnnualValue)}</li>
                )}
              </ul>
            </div>
            {/* Intro paragraph from assumptions */}
            {data.dmuAssumptions?.[0]?.introText && (
              <p className="text-sm text-neutral-700 mt-3 leading-relaxed">
                {data.dmuAssumptions[0].introText}
              </p>
            )}
            {/* D-07: Schoolplan prompt when no schoolplan */}
            {!data.schoolplanOpportunities?.length && (
              <p className="text-xs text-neutral-400 italic mt-2">
                Upload een schoolplan voor een nog specifiekere onderbouwing.
              </p>
            )}
          </div>
        );

      case 'priceComparison':
        if (!data.comparison) return null;
        return (
          <div key={sectionId}>
            <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
              Prijsvergelijking
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-cito-primary text-white">
                    <th className="text-left p-1.5">Module</th>
                    {PROVIDERS.filter((p) =>
                      data.comparison!.modules.some((m) => m.providers[p] !== null),
                    ).map((p) => (
                      <th key={p} className="text-right p-1.5">{PROVIDER_LABELS[p]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.comparison.modules.map((mod, i) => (
                    <tr key={mod.moduleId} className={i % 2 === 0 ? '' : 'bg-neutral-50'}>
                      <td className="p-1.5">{mod.moduleName}</td>
                      {PROVIDERS.filter((p) =>
                        data.comparison!.modules.some((m) => m.providers[p] !== null),
                      ).map((p) => (
                        <td key={p} className="text-right p-1.5">
                          {mod.providers[p] ? formatCurrencyCompact(mod.providers[p]!.totalCost) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-cito-primary font-semibold bg-neutral-50">
                    <td className="p-1.5">Totaal</td>
                    {PROVIDERS.filter((p) =>
                      data.comparison!.modules.some((m) => m.providers[p] !== null),
                    ).map((p) => (
                      <td key={p} className="text-right p-1.5">
                        {formatCurrencyCompact(data.comparison!.totals[p])}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );

      case 'timeSavings':
        if (!data.migration) return null;
        return (
          <div key={sectionId}>
            <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
              Tijdwinst
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-cito-primary text-white">
                  <th className="text-left p-1.5">Taak</th>
                  <th className="text-right p-1.5">Uren/jaar</th>
                  <th className="text-right p-1.5">Waarde/jaar</th>
                </tr>
              </thead>
              <tbody>
                {data.migration.timeSavings.map((ts, i) => (
                  <tr key={ts.taskId} className={i % 2 === 0 ? '' : 'bg-neutral-50'}>
                    <td className="p-1.5">{ts.taskLabel}</td>
                    <td className="text-right p-1.5">{ts.hoursPerYear ?? 0} uur</td>
                    <td className="text-right p-1.5">
                      {ts.valuePerYear > 0 ? formatCurrencyCompact(ts.valuePerYear) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-cito-primary font-semibold bg-neutral-50">
                  <td className="p-1.5">Totaal</td>
                  <td className="text-right p-1.5">{data.migration.totalTimeSavingsHours} uur</td>
                  <td className="text-right p-1.5">
                    {data.migration.totalTimeSavingsValue > 0
                      ? formatCurrencyCompact(data.migration.totalTimeSavingsValue)
                      : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'migration':
        if (!data.migration) return null;
        return (
          <div key={sectionId}>
            <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
              Migratie Business Case
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-cito-primary text-white">
                  <th className="text-left p-1.5">Module</th>
                  <th className="text-right p-1.5">Huidig</th>
                  <th className="text-right p-1.5">Nieuw Cito</th>
                  <th className="text-right p-1.5">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {data.migration.modules.map((mod, i) => (
                  <tr key={mod.moduleId} className={i % 2 === 0 ? '' : 'bg-neutral-50'}>
                    <td className="p-1.5">{mod.moduleName}</td>
                    <td className="text-right p-1.5">{formatCurrencyCompact(mod.oldTotalCost)}</td>
                    <td className="text-right p-1.5">{formatCurrencyCompact(mod.newTotalCost)}</td>
                    <td className={`text-right p-1.5 ${mod.annualDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mod.annualDifference > 0 ? '+' : ''}{formatCurrencyCompact(mod.annualDifference)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'multiYear':
        if (!data.migration) return null;
        return (
          <div key={sectionId}>
            <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
              Meerjarenprojectie
            </h4>
            <div className="space-y-1 text-sm">
              {data.migration.multiYearProjection.map((entry) => (
                <div key={entry.year} className="flex justify-between">
                  <span>{entry.year} jaar</span>
                  <span className="font-medium">{formatCurrencyCompact(entry.cumulativeSavings)}</span>
                </div>
              ))}
              {data.migration.breakEvenMonth !== null && data.migration.breakEvenMonth > 0 && (
                <div className="text-xs text-neutral-500 mt-2">
                  Break-even na {data.migration.breakEvenMonth} maanden
                </div>
              )}
            </div>
          </div>
        );

      case 'differentiators': {
        const filtered = data.productAdvantages
          ? filterByDmuTags(data.productAdvantages, config.dmuTarget)
          : [];
        if (filtered.length === 0) {
          return (
            <div key={sectionId}>
              <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
                Cito Differentiators
              </h4>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>• Remediering in samenwerking met methodeaanbieders</li>
                <li>• Adaptieve toetsafname op maat van de leerling</li>
                <li>• Breed gevalideerd instrumentarium voor alle niveaus</li>
                <li>• Doorlopende doorontwikkeling en ondersteuning</li>
              </ul>
            </div>
          );
        }
        return (
          <div key={sectionId}>
            <h4 className="font-semibold text-cito-primary text-sm mb-2 border-b border-neutral-200 pb-1">
              Relevante Cito-voordelen
            </h4>
            {filtered.map((adv, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold text-neutral-800">{adv.advantage}</p>
                <p className="text-xs text-neutral-600">{adv.context}</p>
                <p className="text-[10px] text-neutral-400 italic">Bron: {adv.source}</p>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const hasData = data.comparison || data.migration;

  if (!hasData) {
    return (
      <div className="bg-neutral-50 rounded-lg p-8 text-center">
        <p className="text-neutral-500 text-sm">
          Vul eerst het schoolprofiel in en voer een vergelijking uit om een rapport te genereren.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      {/* Preview header */}
      <div className="border-b-3 border-cito-primary px-6 py-4">
        <h3 className="text-lg font-bold text-cito-primary">{REPORT_TITLES[config.reportType]}</h3>
        <p className="text-sm text-neutral-500">
          {data.schoolName} — {data.date} — Doelgroep: {DMU_LABELS[config.dmuTarget]}
        </p>
        <p className="text-xs text-cito-accent italic mt-1">
          Vertrouwelijk — opgesteld voor {data.schoolName}
        </p>
      </div>

      {/* Preview content */}
      <div className="px-6 py-4 space-y-5 max-h-[600px] overflow-y-auto">
        {reportSections.sections.map(renderSection)}
      </div>

      {/* Disclaimer */}
      <div className="bg-neutral-50 px-6 py-3 text-xs text-neutral-400 italic">
        Alle getoonde publicatieprijzen zijn bovengrenzen. De werkelijke prijs kan lager zijn.
      </div>
    </div>
  );
}
