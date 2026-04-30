import { useState } from 'react';
import type { SensitivityResult } from '@/engine/sensitivity';
import { formatCurrency } from '@/lib/format';

interface SensitivitySectionProps {
  result: SensitivityResult;
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
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
    className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export function SensitivitySection({ result }: SensitivitySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModuleDetail, setShowModuleDetail] = useState(false);

  const breakEvenText =
    result.breakEven.totalPercent !== null
      ? `${result.competitorLabel} wordt goedkoper bij ${result.breakEven.totalPercent}% korting`
      : `${result.competitorLabel} is nu al goedkoper`;

  return (
    <div className="border border-neutral-200 rounded-lg">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-cito-primary">
          Gevoeligheidsanalyse
        </span>
        <ChevronIcon expanded={isOpen} />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {/* Scenario table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-50 text-neutral-700">
                  <th className="text-left py-2 px-3 font-semibold">Scenario</th>
                  <th className="text-right py-2 px-3 font-semibold">
                    {result.competitorLabel} totaal
                  </th>
                  <th className="text-right py-2 px-3 font-semibold">
                    Cito totaal
                  </th>
                  <th className="text-right py-2 px-3 font-semibold">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((scenario) => {
                  const isNegative = scenario.difference < 0;
                  return (
                    <tr
                      key={scenario.discountPercent}
                      className="border-t border-neutral-100"
                    >
                      <td className="py-2 px-3">{scenario.label}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {formatCurrency(scenario.competitorTotal)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {formatCurrency(scenario.citoTotal)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right tabular-nums font-semibold ${
                          isNegative ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {isNegative ? '' : '+'}
                        {formatCurrency(scenario.difference)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Break-even summary */}
          <div className="bg-neutral-50 rounded-md px-3 py-2 text-sm">
            <span className="font-semibold">Break-even: </span>
            {breakEvenText}
          </div>

          {/* Per-module detail toggle */}
          <button
            type="button"
            onClick={() => setShowModuleDetail((prev) => !prev)}
            className="text-sm text-cito-primary hover:underline"
          >
            {showModuleDetail
              ? 'Verberg detail per module'
              : 'Toon break-even per module'}
          </button>

          {showModuleDetail && (
            <div className="space-y-1 text-sm">
              {result.breakEven.perModule.map((mod) => {
                const scenario = result.scenarios[0];
                const moduleData = scenario?.perModule.find(
                  (m) => m.moduleId === mod.moduleId,
                );
                const moduleName = moduleData?.moduleName ?? mod.moduleId;
                const breakEvenModuleText =
                  mod.percent !== null
                    ? `${mod.percent}% korting`
                    : 'nu al goedkoper';

                return (
                  <div
                    key={mod.moduleId}
                    className="flex justify-between py-1 px-3 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-neutral-700">{moduleName}</span>
                    <span className="text-neutral-600 tabular-nums">
                      {breakEvenModuleText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
