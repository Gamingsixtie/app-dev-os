import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scenarioSchema, type ScenarioData } from '../schemas/step5-schema.ts';
import { SCENARIO_LABELS, type Scenario } from '../../../models/school.ts';
import { useSchoolProfileStore } from '../store.ts';
import StepContainer from '../../../components/wizard/StepContainer.tsx';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import type { WizardStepRef } from './WizardStep1.tsx';
import ScenarioPreview from '../../../components/wizard/ScenarioPreview.tsx';
import DMUContextPanel from '../../../components/wizard/DMUContextPanel.tsx';
import { useWizardInsights } from '../../../hooks/useWizardInsights.ts';

const WizardStep5 = forwardRef<WizardStepRef>(function WizardStep5(_props, ref) {
  const { scenario, setScenario, contacts, moduleSetups } = useSchoolProfileStore();
  const { comparisonPreview, schijnvoordelen, upsellOpportunities, totalStudents } = useWizardInsights();

  // Show Scenario C option when all active modules are on cito-oud
  const scenarios: Scenario[] = useMemo(() => {
    const allCitoOud = moduleSetups.length > 0 &&
      moduleSetups.every((s) => s.currentProvider === 'cito-oud');
    return allCitoOud ? ['A', 'B', 'C'] : ['A', 'B'];
  }, [moduleSetups]);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ScenarioData>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      scenario: scenario ?? undefined,
    },
  });

  const currentScenario = watch('scenario');

  useImperativeHandle(ref, () => ({
    submit: () =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          (data) => {
            setScenario(data.scenario);
            resolve(true);
          },
          () => {
            resolve(false);
          },
        )();
      }),
  }));

  return (
    <StepContainer title="Wat wilt u vergelijken?">
      <div className="space-y-4">
        {scenarios.map((s) => {
          const isSelected = currentScenario === s;
          const label = SCENARIO_LABELS[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setValue('scenario', s, { shouldValidate: true })}
              className={`
                w-full text-left rounded-lg p-6 cursor-pointer transition-colors
                flex items-start gap-4
                ${isSelected
                  ? 'border-2 border-cito-primary bg-[#f0f4ff] border-l-4 border-l-cito-accent'
                  : 'border border-neutral-200 bg-white'
                }
              `}
              role="radio"
              aria-checked={isSelected}
            >
              {/* Radio indicator */}
              <div
                className={`
                  flex-shrink-0 w-5 h-5 rounded-full mt-0.5
                  ${isSelected
                    ? 'bg-cito-primary border-2 border-cito-primary'
                    : 'border-2 border-neutral-200 bg-white'
                  }
                `}
                aria-hidden="true"
              >
                {isSelected && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="text-[20px] font-semibold text-neutral-900">
                  {label.title}
                </div>
                <div className="text-[16px] text-neutral-500 mt-1">
                  {label.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {errors.scenario && (
        <p className="mt-3 text-[14px] text-red-600" role="alert">
          {errors.scenario.message}
        </p>
      )}

      {/* Scenario Preview */}
      {currentScenario && (
        <ScenarioPreview
          scenario={currentScenario}
          comparisonPreview={comparisonPreview}
          schijnvoordelen={schijnvoordelen}
          upsellOpportunities={upsellOpportunities}
          totalStudents={totalStudents}
        />
      )}

      {/* DMU Context */}
      {currentScenario && (
        <DMUContextPanel
          contacts={contacts}
          scenario={currentScenario}
        />
      )}
    </StepContainer>
  );
});

export default WizardStep5;
