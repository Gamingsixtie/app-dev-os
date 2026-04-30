import { Link } from '@tanstack/react-router';
import type { UpsellOpportunity } from '@/engine/upsell';
import { CURRENT_PROVIDER_LABELS } from '@/models/school';
import { formatCurrency } from '@/lib/format';
import { UpsellBadge } from '@/components/ui/UpsellBadge';

interface UpsellCardProps {
  opportunities: UpsellOpportunity[];
  schoolSlug: string;
  hasModuleSetups: boolean;
}

export default function UpsellCard({ opportunities, schoolSlug, hasModuleSetups }: UpsellCardProps) {
  const hasGreenSignals = opportunities.some((o) => o.signalStrength === 'green');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      {/* Title row */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-cito-primary">Upsell-kansen</h3>
        <UpsellBadge count={opportunities.length} hasGreenSignals={hasGreenSignals} />
      </div>

      {/* Empty state: no moduleSetups filled */}
      {!hasModuleSetups && (
        <p className="text-sm text-neutral-400 italic">
          Vul de huidige situatie in bij stap 4 van de wizard om kansen te detecteren.
        </p>
      )}

      {/* Empty state: moduleSetups filled but no opportunities */}
      {hasModuleSetups && opportunities.length === 0 && (
        <p className="text-sm text-neutral-400 italic">
          Geen upsell-kansen gevonden voor deze school.
        </p>
      )}

      {/* Opportunity list */}
      {opportunities.length > 0 && (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div key={opp.moduleId} className="flex items-center gap-3">
              {/* Signal strength dot */}
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                  opp.signalStrength === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                aria-hidden="true"
              />

              {/* Module info */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-neutral-900">
                  {opp.moduleName}
                </span>
                <span className="text-sm text-neutral-500 ml-2">
                  {CURRENT_PROVIDER_LABELS[opp.currentProvider]}
                </span>
                {opp.savingsPerStudent !== null && (
                  <span className="text-sm text-neutral-500 ml-2">
                    {opp.savingsPerStudent > 0 ? '+' : ''}
                    {formatCurrency(opp.savingsPerStudent)}/leerling
                  </span>
                )}
              </div>

              {/* Link to comparison */}
              <Link
                to="/scholen/$slug/vergelijking"
                params={{ slug: schoolSlug }}
                className="text-sm text-cito-primary underline flex-shrink-0"
              >
                Bekijk vergelijking
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
