/**
 * Main wizard container for the AI comparison wizard.
 * 3-step flow: Gespreksnotities -> Variant-selectie -> Advies & Resultaat.
 * Manages step navigation, collapsed/expanded state, and scenario detection.
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useWizardStore } from './wizard-store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import { detectScenario } from './scenario-detection';
import { ComparisonWizardProgress } from './ComparisonWizardProgress';
import { ScenarioDetector } from './ScenarioDetector';
import { WizardStep1Notes } from './WizardStep1Notes';
import { WizardStep2Variants } from './WizardStep2Variants';
import { WizardStep3Advice } from './WizardStep3Advice';
import { MODULE_CATALOG } from '@/models/modules';
import { PROVIDER_LABELS } from '@/engine/price-comparison';

export function ComparisonWizard() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const isCollapsed = useWizardStore((s) => s.isCollapsed);
  const hasCompletedOnce = useWizardStore((s) => s.hasCompletedOnce);
  const scenario = useWizardStore((s) => s.scenario);
  const aiAdvice = useWizardStore((s) => s.aiAdvice);
  const variantSelections = useWizardStore((s) => s.variantSelections);
  const adjustedSelections = useWizardStore((s) => s.adjustedSelections);
  const setStep = useWizardStore((s) => s.setStep);
  const setScenario = useWizardStore((s) => s.setScenario);
  const expand = useWizardStore((s) => s.expand);

  const selectedModules = useSchoolProfileStore((s) => s.selectedModules);
  const moduleSetups = useSchoolProfileStore((s) => s.moduleSetups);
  const schoolScenario = useSchoolProfileStore((s) => s.scenario);
  const setSchoolScenario = useSchoolProfileStore((s) => s.setScenario);

  // Detect scenario on mount — respect school-level scenario choice
  useEffect(() => {
    const detected = detectScenario(moduleSetups);
    // If school scenario is already 'C' and all modules are cito-oud,
    // skip the choice UI and go straight to competitor wizard flow
    if (detected === 'alles-oud-cito' && schoolScenario === 'C') {
      setScenario('alles-oud-cito-concurrent');
    } else {
      setScenario(detected);
    }
  }, [moduleSetups, schoolScenario, setScenario]);

  // Build collapsed summary from selections
  const collapsedSummary = useMemo(() => {
    if (!hasCompletedOnce) return null;
    const selections = adjustedSelections.length > 0 ? adjustedSelections : variantSelections;
    const providers = new Set(selections.filter((s) => s.provider !== 'geen').map((s) => s.provider));
    const moduleCount = selections.filter((s) => s.provider !== 'geen').length;
    const moduleNames = selections
      .filter((s) => s.provider !== 'geen')
      .map((s) => MODULE_CATALOG.find((m) => m.id === s.moduleId)?.name)
      .filter(Boolean);

    return {
      providers: Array.from(providers).map((p) => PROVIDER_LABELS[p as keyof typeof PROVIDER_LABELS] || p),
      moduleCount,
      moduleNames,
      bundel: aiAdvice?.aanbevolenCitoBundel,
      samenvatting: aiAdvice?.samenvatting,
    };
  }, [hasCompletedOnce, adjustedSelections, variantSelections, aiAdvice]);

  // Scenario C: user chooses competitor comparison from keuze-UI
  const handleChooseCompetitor = useCallback(() => {
    useWizardStore.getState().setScenario('alles-oud-cito-concurrent');
    setStep(1);
  }, [setStep]);

  // User chooses migration from keuze-UI — set school scenario to B
  const handleChooseMigration = useCallback(() => {
    setSchoolScenario('B');
  }, [setSchoolScenario]);

  // Empty state guard: no modules selected
  if (selectedModules.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-4 md:px-0">
        <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Selecteer eerst modules in de wizard om een vergelijking te starten.
          </p>
        </div>
      </div>
    );
  }

  // Collapsed state after wizard completion
  if (isCollapsed && hasCompletedOnce && collapsedSummary) {
    return (
      <div className="max-w-[720px] mx-auto px-4 md:px-0">
        <div className="bg-cito-primary/5 border border-cito-primary/20 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600 flex-shrink-0" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-semibold text-cito-primary">
                  Vergelijkingsadvies afgerond
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 pl-[22px]">
                {collapsedSummary.providers.length > 0 && (
                  <span>
                    Concurrenten: <span className="font-medium text-neutral-700">{collapsedSummary.providers.join(', ')}</span>
                  </span>
                )}
                <span>
                  {collapsedSummary.moduleCount} {collapsedSummary.moduleCount === 1 ? 'module' : 'modules'}
                </span>
                {collapsedSummary.bundel && (
                  <span>
                    Bundel: <span className="font-medium text-neutral-700 capitalize">{collapsedSummary.bundel}</span>
                  </span>
                )}
              </div>
              {collapsedSummary.samenvatting && (
                <p className="text-xs text-neutral-500 mt-2 pl-[22px] line-clamp-2">
                  {collapsedSummary.samenvatting}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={expand}
              className="flex-shrink-0 text-sm font-medium text-cito-primary hover:text-cito-primary/80 transition-colors min-h-[44px] px-4"
            >
              Opnieuw doorlopen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStepClick = (step: 0 | 1 | 2) => {
    // Only allow clicking completed (earlier) steps
    if (step < currentStep) {
      setStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WizardStep1Notes />;
      case 1:
        return <WizardStep2Variants />;
      case 2:
        return <WizardStep3Advice />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 md:px-0">
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {/* Title */}
        <h2 className="text-[22px] font-semibold text-neutral-900">
          AI Vergelijkingsadvies
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Eerlijke concurrentievergelijking in 3 stappen
        </p>

        {/* Progress bar */}
        <ComparisonWizardProgress
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        {/* Scenario detection banner */}
        <ScenarioDetector
          scenario={scenario}
          onProceed={() => {
            // Allow proceeding in all-new-cito scenario
          }}
          onChooseCompetitor={handleChooseCompetitor}
          onChooseMigration={handleChooseMigration}
        />

        {/* Active step content */}
        {renderStep()}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setStep((currentStep - 1) as 0 | 1 | 2)}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors min-h-[44px] px-4"
            >
              Vorige stap
            </button>
          ) : (
            <div />
          )}
          {currentStep < 2 && (
            <button
              type="button"
              onClick={() => setStep((currentStep + 1) as 0 | 1 | 2)}
              className="bg-cito-primary text-white text-sm font-semibold py-2.5 px-6 rounded-lg hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Volgende stap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
