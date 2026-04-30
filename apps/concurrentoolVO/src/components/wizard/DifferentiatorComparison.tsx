import { useState } from 'react';
import { MODULE_DIFFERENTIATORS } from '@/data/differentiators';
import { PROVIDER_LABELS, type ProviderKey } from '@/engine/price-comparison';
import type { CurrentProvider } from '@/models/school';

interface DifferentiatorComparisonProps {
  moduleId: string;
  currentProvider: CurrentProvider;
}

/** Map CurrentProvider to a ProviderKey for differentiator lookup */
function toProviderKey(provider: CurrentProvider): ProviderKey | null {
  if (provider === 'dia') return 'dia';
  if (provider === 'jij') return 'jij';
  if (provider === 'saqi') return 'saqi';
  return null;
}

export default function DifferentiatorComparison({
  moduleId,
  currentProvider,
}: DifferentiatorComparisonProps) {
  const [expanded, setExpanded] = useState(false);
  const providerKey = toProviderKey(currentProvider);

  const diffEntry = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === moduleId);
  if (!diffEntry) return null;

  const citoDiffs = diffEntry.cito;
  if (citoDiffs.length === 0) return null;

  // Only show comparison against non-Cito providers with differentiators
  const competitorDiffs = providerKey ? diffEntry[providerKey] : [];
  const citoExclusive = citoDiffs.filter((d) => !competitorDiffs.includes(d));

  if (citoExclusive.length === 0) return null;

  const providerLabel = providerKey
    ? PROVIDER_LABELS[providerKey]
    : currentProvider;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-cito-primary hover:underline flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        Wat biedt Cito extra t.o.v. {providerLabel}?
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
          <div className="space-y-3">
            {/* Cito exclusive advantages */}
            <div>
              <div className="text-xs font-semibold text-blue-700 mb-1">
                Cito biedt extra:
              </div>
              <ul className="space-y-0.5">
                {citoExclusive.map((d, i) => (
                  <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">+</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Competitor advantages */}
            {competitorDiffs.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-neutral-500 mb-1">
                  {providerLabel} biedt:
                </div>
                <ul className="space-y-0.5">
                  {competitorDiffs.map((d, i) => (
                    <li key={i} className="text-xs text-neutral-600 flex items-start gap-1.5">
                      <span className="text-neutral-400 mt-0.5 flex-shrink-0">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
