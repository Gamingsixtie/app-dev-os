interface NavigationButtonsProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  isLastStep: boolean;
}

export default function NavigationButtons({
  currentStep,
  onBack,
  onNext,
  nextDisabled,
  isLastStep,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="
            bg-transparent text-cito-primary border border-cito-primary
            text-[16px] font-semibold
            py-3 px-6 rounded-lg min-h-[44px]
            hover:bg-[#f0f4ff]
            focus:outline-none focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
          "
        >
          Vorige stap
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`
          text-[16px] font-semibold
          py-3 px-6 rounded-lg min-h-[44px]
          focus:outline-none focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
          ${nextDisabled
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : 'bg-cito-accent text-white hover:bg-cito-accent-hover active:bg-cito-accent-active cursor-pointer'
          }
        `}
      >
        {isLastStep ? 'Bekijk resultaten' : 'Volgende stap'}
      </button>
    </div>
  );
}
