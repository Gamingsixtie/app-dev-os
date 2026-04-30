import type { Scenario } from '@/models/school';
import type { ComparisonResult } from '@/engine/price-comparison';
import type { SchijnvoordeelWarning } from '@/engine/schijnvoordeel';
import type { UpsellOpportunity } from '@/engine/upsell';
import { PROVIDER_LABELS } from '@/engine/price-comparison';
import { formatCurrency } from '@/lib/format';

interface ScenarioPreviewProps {
  scenario: Scenario;
  comparisonPreview: ComparisonResult;
  schijnvoordelen: SchijnvoordeelWarning[];
  upsellOpportunities: UpsellOpportunity[];
  totalStudents: number;
}

export default function ScenarioPreview({
  scenario,
  comparisonPreview,
  schijnvoordelen,
  upsellOpportunities,
  totalStudents,
}: ScenarioPreviewProps) {
  const moduleCount = comparisonPreview.modules.length;

  if (moduleCount === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
        Preview
      </div>

      {scenario === 'A' && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-700">
            Vergelijking van <span className="font-semibold">{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
            {' '}voor <span className="font-semibold">{totalStudents.toLocaleString('nl-NL')} leerlingen</span>
          </p>

          {/* Provider totals */}
          <div className="flex flex-wrap gap-3">
            {(['cito', 'dia', 'jij', 'saqi'] as const).map((provider) => {
              const total = comparisonPreview.totals[provider];
              if (total === 0) return null;
              return (
                <div key={provider} className="text-sm">
                  <span className="font-semibold text-neutral-900">
                    {PROVIDER_LABELS[provider]}:
                  </span>{' '}
                  <span className="text-neutral-600">{formatCurrency(total)}</span>
                </div>
              );
            })}
          </div>

          {/* Differences */}
          {comparisonPreview.differences.citoVsDia !== null && (
            <p className="text-xs text-neutral-500">
              Cito vs. DIA: {comparisonPreview.differences.citoVsDia > 0 ? '+' : ''}
              {formatCurrency(comparisonPreview.differences.citoVsDia)}
            </p>
          )}
        </div>
      )}

      {scenario === 'B' && (
        <p className="text-sm text-neutral-700">
          Migratieberekening voor <span className="font-semibold">{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
          {' '}— geschatte jaarlijkse besparing wordt na voltooiing berekend.
        </p>
      )}

      {/* Insights badge */}
      {(schijnvoordelen.length > 0 || upsellOpportunities.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {schijnvoordelen.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              {schijnvoordelen.length} schijnvoordeel{schijnvoordelen.length !== 1 ? 'en' : ''}
            </span>
          )}
          {upsellOpportunities.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">
              {upsellOpportunities.length} upsell-kans{upsellOpportunities.length !== 1 ? 'en' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
