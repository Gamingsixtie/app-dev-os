/**
 * 3-step horizontal progress bar for the AI comparison wizard.
 * Steps: Gespreksnotities, Variant-selectie, Advies & Resultaat.
 */

const STEP_LABELS = ['Gespreksnotities', 'Variant-selectie', 'Advies & Resultaat'];

interface ComparisonWizardProgressProps {
  currentStep: 0 | 1 | 2;
  onStepClick: (step: 0 | 1 | 2) => void;
}

export function ComparisonWizardProgress({ currentStep, onStepClick }: ComparisonWizardProgressProps) {
  return (
    <div className="flex items-start justify-between w-full mb-8" role="navigation" aria-label="Wizard voortgang">
      {STEP_LABELS.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = isCompleted;

        return (
          <div key={index} className="flex flex-col items-center flex-1 relative">
            {/* Connector line before circle (except first step) */}
            {index > 0 && (
              <div
                className={`absolute top-[18px] h-[2px] ${
                  isCompleted || (index - 1 < currentStep)
                    ? 'bg-cito-primary'
                    : 'bg-neutral-200'
                }`}
                style={{ right: '50%', width: '100%' }}
              />
            )}

            {/* Step circle */}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(index as 0 | 1 | 2)}
              disabled={!isClickable}
              className={`
                relative z-10 flex items-center justify-center w-9 h-9 rounded-full text-[16px] font-semibold
                transition-colors
                ${isCompleted
                  ? 'bg-cito-primary text-white cursor-pointer hover:bg-cito-primary-light'
                  : isCurrent
                    ? 'bg-cito-accent text-white cursor-default'
                    : 'bg-neutral-200 text-neutral-500 cursor-default'
                }
                ${!isClickable ? 'pointer-events-none' : ''}
              `}
              aria-label={`Stap ${index + 1}: ${label}${isCompleted ? ' (voltooid)' : isCurrent ? ' (huidige stap)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </button>

            {/* Step label — hidden on small screens, shown on md+ */}
            <span
              className={`mt-2 text-sm font-semibold hidden md:block ${
                isCompleted
                  ? 'text-cito-primary'
                  : isCurrent
                    ? 'text-cito-accent'
                    : 'text-neutral-500'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
