interface SchoolplanStreamingProgressProps {
  currentStep: number; // 0 = not started, 1 = step 1 active, 2 = step 2 active, 3 = complete
}

const STEPS = [
  { step: 1, label: 'Document wordt samengevat...' },
  { step: 2, label: 'Kansen worden geidentificeerd...' },
];

/**
 * Two-step progress indicator for schoolplan AI analysis.
 * Reuses visual pattern from StreamingExtraction with checkmark/circle icons.
 */
export default function SchoolplanStreamingProgress({
  currentStep,
}: SchoolplanStreamingProgressProps) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex flex-col gap-2">
        {STEPS.map(({ step, label }) => {
          const isDone = step < currentStep;
          const isActive = step === currentStep;

          return (
            <div key={step} className="flex items-center gap-2">
              {isDone ? (
                // Green checkmark icon
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 text-green-500 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : isActive ? (
                // Cito-primary filled circle with pulse animation
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 text-cito-primary flex-shrink-0 animate-pulse"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="4" />
                </svg>
              ) : (
                // Neutral empty circle
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 text-neutral-300 flex-shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="4" />
                </svg>
              )}

              <span
                className={`text-sm ${
                  isDone
                    ? 'text-neutral-500'
                    : isActive
                      ? 'font-semibold text-neutral-900'
                      : 'text-neutral-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {currentStep === 3 && (
        <p className="text-sm text-green-600 font-semibold mt-2">Analyse voltooid</p>
      )}
    </div>
  );
}
