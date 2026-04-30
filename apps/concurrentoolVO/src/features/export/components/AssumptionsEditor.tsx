import type { DmuAssumption } from '@/data/dmu-assumptions';

interface AssumptionsEditorProps {
  assumptions: DmuAssumption[];
  defaults: DmuAssumption[];
  onChange: (assumptions: DmuAssumption[]) => void;
}

/**
 * Inline editor for DMU assumptions: intro text and focus areas.
 * Shows a reset button when content differs from defaults.
 */
export function AssumptionsEditor({ assumptions, defaults, onChange }: AssumptionsEditorProps) {
  if (assumptions.length === 0) return null;

  const current = assumptions[0];
  const defaultAssumption = defaults[0];

  // Check if content differs from defaults
  const hasChanges =
    defaultAssumption &&
    (current.introText !== defaultAssumption.introText ||
      JSON.stringify(current.focusAreas) !== JSON.stringify(defaultAssumption.focusAreas));

  const updateIntroText = (introText: string) => {
    const updated = [...assumptions];
    updated[0] = { ...current, introText };
    onChange(updated);
  };

  const updateFocusArea = (index: number, value: string) => {
    const updated = [...assumptions];
    const newAreas = [...current.focusAreas];
    newAreas[index] = value;
    updated[0] = { ...current, focusAreas: newAreas };
    onChange(updated);
  };

  return (
    <div className="p-3 rounded-lg border border-neutral-200 space-y-3">
      <h4 className="text-xs font-semibold text-neutral-600 mb-2">
        Aannames voor deze doelgroep
      </h4>

      {/* Intro text */}
      <div>
        <label className="text-sm font-semibold text-neutral-700">Inleidingstekst</label>
        <textarea
          className="w-full text-sm text-neutral-700 border border-neutral-200 rounded-lg p-3 resize-y mt-1"
          rows={4}
          value={current.introText}
          onChange={(e) => updateIntroText(e.target.value)}
        />
      </div>

      {/* Focus areas */}
      <div>
        <label className="text-sm font-semibold text-neutral-700 mt-3">Focusgebieden</label>
        <div className="flex flex-col gap-2 mt-1">
          {current.focusAreas.map((area, i) => (
            <input
              key={i}
              className="w-full text-xs text-neutral-700 border border-neutral-200 rounded p-2"
              value={area}
              onChange={(e) => updateFocusArea(i, e.target.value)}
            />
          ))}
        </div>
      </div>

      {/* Reset button */}
      {hasChanges && (
        <button
          className="text-xs text-cito-primary hover:underline mt-2"
          onClick={() => onChange(defaults)}
        >
          Standaard herstellen
        </button>
      )}
    </div>
  );
}
