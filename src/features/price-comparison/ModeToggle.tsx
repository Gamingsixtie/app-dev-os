import { usePriceComparisonStore } from './store';

export function ModeToggle() {
  const isInternal = usePriceComparisonStore((s) => s.isInternalMode);
  const setMode = usePriceComparisonStore((s) => s.setInternalMode);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode(true)}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            isInternal
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-pressed={isInternal}
        >
          Intern
        </button>
        <button
          type="button"
          onClick={() => setMode(false)}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            !isInternal
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-pressed={!isInternal}
        >
          Extern
        </button>
      </div>
      {!isInternal && (
        <span className="text-xs text-neutral-400">
          Geschikt voor scherm delen met school
        </span>
      )}
    </div>
  );
}
