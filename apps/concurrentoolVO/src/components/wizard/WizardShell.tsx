import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSchoolProfileStore } from '../../features/school-profile/store';
import { updateSchoolData } from '@/db/operations';
import ProgressBar from './ProgressBar';
import NavigationButtons from './NavigationButtons';
import WizardStep1, { type WizardStepRef } from '../../features/school-profile/components/WizardStep1';
import WizardStep2 from '../../features/school-profile/components/WizardStep2';
import WizardStep3 from '../../features/school-profile/components/WizardStep3';
import WizardStep4 from '../../features/school-profile/components/WizardStep4';
import WizardStep5 from '../../features/school-profile/components/WizardStep5';
import { IntakePanel } from '../../features/intake/IntakePanel';

const TOTAL_STEPS = 5;

export default function WizardShell() {
  const { slug } = useParams({ from: '/scholen/$slug/wizard/$step' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentStep, setCurrentStep, intakeMode, setIntakeMode } = useSchoolProfileStore();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const stepRef = useRef<WizardStepRef>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  // Scroll to top of wizard on step change
  useEffect(() => {
    wizardRef.current?.scrollIntoView?.({ behavior: 'instant', block: 'start' });
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (!stepRef.current) return;

    const isValid = await stepRef.current.submit();
    if (!isValid) return;

    // Mark current step as completed
    const newCompletedSteps = completedSteps.includes(currentStep)
      ? completedSteps
      : [...completedSteps, currentStep];
    setCompletedSteps(newCompletedSteps);

    // Auto-save to Dexie
    const state = useSchoolProfileStore.getState();
    if (state.activeSchoolId) {
      await updateSchoolData(state.activeSchoolId, {
        levels: state.levels,
        studentCounts: state.studentCounts,
        selectedModules: state.selectedModules,
        moduleSetups: state.moduleSetups,
        scenario: state.scenario,
        name: state.schoolName,
        completedSteps: [...new Set([...newCompletedSteps, currentStep])],
        isComplete: currentStep === TOTAL_STEPS - 1,
      });
      // Invalidate React Query cache so SchoolLayout re-hydrates with fresh data
      await queryClient.invalidateQueries({ queryKey: ['school', slug] });
      // Also invalidate schools list (fire-and-forget) for overview page
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate({
        to: '/scholen/$slug/wizard/$step',
        params: { slug, step: String(nextStep + 1) },
      });
    } else {
      // Last step: navigate to appropriate result view
      const { scenario, moduleSetups } = useSchoolProfileStore.getState();
      if (scenario === 'A') {
        const hasCurrentSituation = moduleSetups.some((s) => s.currentProvider !== 'geen');
        navigate({
          to: hasCurrentSituation
            ? '/scholen/$slug/huidig-vs-cito'
            : '/scholen/$slug/vergelijking',
          params: { slug },
        });
      } else if (scenario === 'B') {
        navigate({
          to: '/scholen/$slug/migratie',
          params: { slug },
        });
      }
    }
  }, [currentStep, setCurrentStep, completedSteps, navigate, slug]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate({
        to: '/scholen/$slug/wizard/$step',
        params: { slug, step: String(prevStep + 1) },
      });
    }
  }, [currentStep, setCurrentStep, navigate, slug]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (completedSteps.includes(step)) {
        setCurrentStep(step);
        navigate({
          to: '/scholen/$slug/wizard/$step',
          params: { slug, step: String(step + 1) },
        });
      }
    },
    [completedSteps, setCurrentStep, navigate, slug],
  );

  const handleIntakeComplete = useCallback(() => {
    setIntakeMode(false);
    // After intake, jump to the step the intake set (usually step 4 or 5)
    const state = useSchoolProfileStore.getState();
    navigate({
      to: '/scholen/$slug/wizard/$step',
      params: { slug, step: String(state.currentStep + 1) },
    });
  }, [setIntakeMode, navigate, slug]);

  const handleIntakeSkip = useCallback(() => {
    setIntakeMode(false);
  }, [setIntakeMode]);

  // Show AI intake panel when intake mode is active
  if (intakeMode) {
    return (
      <div ref={wizardRef}>
        <IntakePanel onComplete={handleIntakeComplete} onSkip={handleIntakeSkip} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WizardStep1 ref={stepRef} />;
      case 1:
        return <WizardStep2 ref={stepRef} />;
      case 2:
        return <WizardStep3 ref={stepRef} />;
      case 3:
        return <WizardStep4 ref={stepRef} />;
      case 4:
        return <WizardStep5 ref={stepRef} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={wizardRef}
      className="bg-white rounded-xl shadow-sm max-w-[720px] mx-auto py-12 px-8"
    >
      {/* AI Intake toggle */}
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={() => setIntakeMode(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cito-primary hover:text-cito-primary/80 bg-cito-primary/5 hover:bg-cito-primary/10 px-3 py-1.5 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Vul in met AI
        </button>
      </div>

      <ProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {renderStep()}

      <NavigationButtons
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={false}
        isLastStep={currentStep === TOTAL_STEPS - 1}
      />
    </div>
  );
}
