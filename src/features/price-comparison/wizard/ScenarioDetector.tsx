/**
 * Scenario detection banner for the AI comparison wizard (D-26).
 * Shows choice UI for all-old-Cito, info banner for all-new-Cito scenarios.
 */

import { useState } from 'react';
import type { WizardScenario } from './types';

interface ScenarioDetectorProps {
  scenario: WizardScenario;
  onProceed?: () => void;
  onChooseCompetitor?: () => void;
  onChooseMigration?: () => void;
}

export function ScenarioDetector({ scenario, onProceed, onChooseCompetitor, onChooseMigration }: ScenarioDetectorProps) {
  const [selected, setSelected] = useState<'migration' | 'competitor' | null>(null);

  if (scenario === 'deels-concurrent') {
    return null;
  }

  if (scenario === 'alles-oud-cito') {
    return (
      <div className="mb-6">
        <p className="text-sm font-semibold mb-3">Wat wilt u vergelijken?</p>
        <div className="flex gap-4 sm:flex-row flex-col">
          {/* Migration card */}
          <button
            type="button"
            onClick={() => setSelected('migration')}
            className={`flex-1 text-left rounded-lg border p-4 cursor-pointer transition-colors min-h-[80px] ${
              selected === 'migration'
                ? 'border-cito-primary border-2 bg-cito-primary/5'
                : 'border-blue-200 bg-blue-50 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Migratie bekijken</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Vergelijk het huidige Cito-platform met het nieuwe platform.
                </p>
              </div>
            </div>
          </button>

          {/* Competitor card */}
          <button
            type="button"
            onClick={() => setSelected('competitor')}
            className={`flex-1 text-left rounded-lg border p-4 cursor-pointer transition-colors min-h-[80px] ${
              selected === 'competitor'
                ? 'border-cito-primary border-2 bg-cito-primary/5'
                : 'border-amber-200 bg-amber-50 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m-5.5-6L12 5m0 0l2.5 4" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Vergelijk met concurrent</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Vergelijk uw huidige Cito-kosten met een alternatieve aanbieder.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Confirm button — only visible when a card is selected */}
        {selected !== null && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (selected === 'migration') {
                  onChooseMigration?.();
                } else if (selected === 'competitor') {
                  onChooseCompetitor?.();
                }
              }}
              className="bg-cito-primary text-white text-sm font-semibold py-2.5 px-6 rounded-lg min-h-[44px] hover:opacity-90 transition-opacity"
            >
              Doorgaan
            </button>
          </div>
        )}
      </div>
    );
  }

  if (scenario === 'alles-nieuw-cito') {
    return (
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border bg-emerald-50 border-emerald-200" role="alert">
        <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-emerald-800 mb-3">
            Deze school gebruikt al het nieuwe Cito-platform. Wilt u alsnog een marktvergelijking uitvoeren?
          </p>
          {onProceed && (
            <button
              type="button"
              onClick={onProceed}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors min-h-[44px]"
            >
              Doorgaan
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
