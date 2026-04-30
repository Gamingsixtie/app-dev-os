import type { DiscountPattern } from '@/engine/discount-patterns';

interface MarktKortingToggleProps {
  patterns: DiscountPattern[];
  isEnabled: boolean;
  onToggle: (useMarketPricing: boolean) => void;
}

/**
 * Two-option toggle: "Publicatieprijzen" (default) | "Inclusief marktkorting"
 * Disabled with tooltip when insufficient pattern data exists.
 */
export function MarktKortingToggle({ patterns, isEnabled, onToggle }: MarktKortingToggleProps) {
  const hasPatterns = patterns.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Prijsbasis
      </span>
      <div
        className="inline-flex rounded-lg border border-neutral-200 overflow-hidden"
        title={!hasPatterns ? 'Onvoldoende data voor marktkorting-schatting' : undefined}
      >
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            !isEnabled
              ? 'bg-cito-primary text-white'
              : 'bg-white text-neutral-600 hover:bg-neutral-50'
          }`}
          aria-pressed={!isEnabled}
        >
          Publicatieprijzen
        </button>
        <button
          type="button"
          onClick={() => hasPatterns && onToggle(true)}
          disabled={!hasPatterns}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            isEnabled
              ? 'bg-cito-primary text-white'
              : hasPatterns
                ? 'bg-white text-neutral-600 hover:bg-neutral-50'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
          aria-pressed={isEnabled}
          title={!hasPatterns ? 'Onvoldoende data voor marktkorting-schatting' : undefined}
        >
          Inclusief marktkorting
        </button>
      </div>
    </div>
  );
}
