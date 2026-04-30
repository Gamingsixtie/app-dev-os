import { useMemo, useState, useCallback } from 'react';
import { useSchoolProfileStore } from '../store';
import { PriceComparisonPage } from '@/features/price-comparison/PriceComparisonPage';
import { CurrentVsProposedPage } from '@/features/price-comparison/CurrentVsProposedPage';
import { MigrationPage } from '@/features/price-comparison/MigrationPage';
import { detectScenario } from '@/engine/scenario-detection';
import { updateSchoolData } from '@/db/operations';
import { SCENARIO_LABELS, type Scenario } from '@/models/school';

// ─── View switcher for all-cito-oud schools ─────────────────────────────────

function ViewSwitcher({
  current,
  onSwitch,
}: {
  current: 'B' | 'C';
  onSwitch: (scenario: Scenario) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 sm:px-8 pt-4 pb-2 max-w-[960px] mx-auto">
      <span className="text-xs font-medium text-neutral-500 mr-1">Weergave:</span>
      <button
        type="button"
        onClick={() => onSwitch('B')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
          current === 'B'
            ? 'bg-cito-primary text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        Migratie bekijken
      </button>
      <button
        type="button"
        onClick={() => onSwitch('C')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors min-h-[32px] ${
          current === 'C'
            ? 'bg-cito-primary text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        Vergelijk met concurrent
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ComparisonTab() {
  const scenario = useSchoolProfileStore((s) => s.scenario);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const activeSchoolId = useSchoolProfileStore((s) => s.activeSchoolId);
  const setScenario = useSchoolProfileStore((s) => s.setScenario);

  // Pending selection in the initial choice UI (before confirming)
  const [pendingChoice, setPendingChoice] = useState<'migration' | 'competitor' | null>(null);

  // Detect scenario from module setups
  const detection = useMemo(
    () => moduleSetups.length > 0 ? detectScenario(moduleSetups) : null,
    [moduleSetups],
  );

  // Check if all active modules are cito-oud (candidate for choice UI)
  const isAllCitoOud = useMemo(() => {
    if (!detection) return false;
    return detection.hasMigrationModules && !detection.hasCompetitorModules && !detection.hasUpsellModules;
  }, [detection]);

  // Apply scenario to store + database
  const handleApplyScenario = useCallback(async (chosen: Scenario) => {
    setScenario(chosen);
    if (activeSchoolId) {
      await updateSchoolData(activeSchoolId, { scenario: chosen });
    }
  }, [setScenario, activeSchoolId]);

  // Handle choice confirmation
  const handleConfirmChoice = useCallback(async () => {
    if (!pendingChoice) return;
    const chosenScenario: Scenario = pendingChoice === 'competitor' ? 'C' : 'B';
    await handleApplyScenario(chosenScenario);
    setPendingChoice(null);
  }, [pendingChoice, handleApplyScenario]);

  // Effective scenario: store scenario takes priority, then auto-detect
  const effectiveScenario = useMemo(() => {
    if (scenario) return scenario;
    if (moduleSetups.length === 0) return null;
    return detection?.recommended ?? null;
  }, [scenario, moduleSetups, detection]);

  // No modules selected at all
  if (selectedModules.length === 0) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen vergelijking beschikbaar. Vul eerst het schoolprofiel aan via de Overzicht-tab.
          </p>
        </div>
      </div>
    );
  }

  // All modules are cito-oud and no B/C scenario chosen yet — show choice UI
  if (isAllCitoOud && (!scenario || (scenario !== 'B' && scenario !== 'C'))) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 max-w-lg mx-auto">
          <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">
            Wat wilt u vergelijken?
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Alle modules staan op het huidige Cito-platform. Kies wat u wilt bekijken.
          </p>
          <div className="flex gap-4 sm:flex-row flex-col">
            {/* Migration card */}
            <button
              type="button"
              onClick={() => setPendingChoice('migration')}
              className={`flex-1 text-left rounded-lg border p-4 cursor-pointer transition-colors min-h-[80px] ${
                pendingChoice === 'migration'
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
              onClick={() => setPendingChoice('competitor')}
              className={`flex-1 text-left rounded-lg border p-4 cursor-pointer transition-colors min-h-[80px] ${
                pendingChoice === 'competitor'
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

          {/* Confirm button */}
          {pendingChoice !== null && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleConfirmChoice}
                className="bg-cito-primary text-white text-sm font-semibold py-2.5 px-6 rounded-lg min-h-[44px] hover:opacity-90 transition-opacity"
              >
                Doorgaan
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modules exist but no scenario set — show detection prompt
  if (!effectiveScenario && detection) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center max-w-lg mx-auto">
          <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">
            Welk type vergelijking?
          </h3>
          <p className="text-sm text-neutral-500 mb-6">
            Kies het scenario dat bij deze school past.
          </p>
          <div className="flex flex-col gap-3">
            {(['A', 'B', 'C'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleApplyScenario(s)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  detection.recommended === s
                    ? 'border-cito-primary bg-cito-primary/5 ring-2 ring-cito-primary/20'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-neutral-900">
                    {SCENARIO_LABELS[s].title}
                  </span>
                  {detection.recommended === s && (
                    <span className="text-xs bg-cito-primary/10 text-cito-primary font-semibold px-2 py-0.5 rounded-full">
                      Aanbevolen
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  {SCENARIO_LABELS[s].description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scenario set but no moduleSetups — fallback empty state
  if (!effectiveScenario) {
    return (
      <div className="p-8 max-sm:p-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-[16px] text-neutral-500">
            Geen vergelijking beschikbaar. Vul eerst het schoolprofiel aan via de Overzicht-tab.
          </p>
        </div>
      </div>
    );
  }

  // Determine which existing page to render based on scenario and module setups
  const hasProviderSetups = moduleSetups.some(
    (setup) => setup.currentProvider !== 'geen',
  );

  // Scenario B: migration — huidig Cito-platform vs. nieuw platform
  if (effectiveScenario === 'B' && hasProviderSetups) {
    return (
      <>
        {isAllCitoOud && <ViewSwitcher current="B" onSwitch={handleApplyScenario} />}
        <MigrationPage />
      </>
    );
  }

  // Scenario C: current Cito vs. competitor — uses the comparison page
  if (effectiveScenario === 'C' && hasProviderSetups) {
    return (
      <>
        {isAllCitoOud && <ViewSwitcher current="C" onSwitch={handleApplyScenario} />}
        <PriceComparisonPage />
      </>
    );
  }

  if (effectiveScenario === 'A' && hasProviderSetups) {
    return <CurrentVsProposedPage />;
  }

  // Scenario A without provider setups: market comparison
  return <PriceComparisonPage />;
}
