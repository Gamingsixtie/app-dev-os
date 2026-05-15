import {
  CURRENT_TOOL_USAGE_VALUES,
  CURRENT_TOOL_USAGE_LABELS,
  SCHOOL_LEVEL_LABELS,
  type CurrentToolUsage,
  type CurrentToolUsageMap,
  type SchoolLevel,
} from '@/models/school';

/**
 * Phase 27 Plan 05 (R5) — per-niveau radio-keuze "Welk pakket gebruikt elk
 * niveau nu?".
 *
 * Stateless presentational component (D-17 sub-components via composition):
 * ouder bezit `value` + dispatcht `onChange(level, value)`. Eén radio-rij per
 * geselecteerd niveau met 5 opties (Cito / DIA / JIJ! / Mix / Geen). ARIA:
 * elke rij is een fieldset met legend voor groep-semantiek; de input-`name`
 * is uniek per niveau zodat radio-groepen niet kruisen.
 *
 * Optioneel — Next-knop blokkeert niet als waardes ontbreken (zie
 * step2-schema.ts `currentToolUsage` met `.default({})`).
 */
export interface CurrentToolPerLevelProps {
  /** De niveau's die de gebruiker in WizardStep1 selecteerde. */
  levels: SchoolLevel[];
  /** Huidige map; ontbrekende keys = "nog geen keuze". */
  value: CurrentToolUsageMap;
  /** Per-rij dispatch — ouder schrijft naar form + store. */
  onChange: (level: SchoolLevel, value: CurrentToolUsage) => void;
}

export default function CurrentToolPerLevel({
  levels,
  value,
  onChange,
}: CurrentToolPerLevelProps) {
  // Defensive: ouder hoort de sectie al niet te renderen bij 0 niveaus, maar
  // we falleren stil terug als dat toch gebeurt (R5: sectie is optioneel).
  if (levels.length === 0) return null;

  return (
    <section className="mt-8" aria-labelledby="current-tool-per-level-heading">
      <h3
        id="current-tool-per-level-heading"
        className="text-[16px] font-semibold text-neutral-900 mb-3"
      >
        Welk pakket gebruikt elk niveau nu?
      </h3>
      <p className="text-[13px] text-neutral-600 mb-4">
        Optioneel — helpt sales bij stichting-aggregatie en klant-type-suggestie.
      </p>

      <div className="space-y-3">
        {levels.map((level) => {
          const groupName = `currentToolUsage-${level}`;
          const selected = value[level];
          return (
            <fieldset
              key={level}
              className="rounded-md border border-neutral-200 p-3"
              aria-labelledby={`${groupName}-legend`}
            >
              <legend
                id={`${groupName}-legend`}
                className="px-1 text-[14px] font-semibold text-neutral-700"
              >
                {SCHOOL_LEVEL_LABELS[level]}
              </legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                {CURRENT_TOOL_USAGE_VALUES.map((option) => {
                  const id = `${groupName}-${option}`;
                  return (
                    <label
                      key={option}
                      htmlFor={id}
                      className="inline-flex items-center cursor-pointer text-[14px] text-neutral-900"
                    >
                      <input
                        id={id}
                        type="radio"
                        name={groupName}
                        value={option}
                        checked={selected === option}
                        onChange={() => onChange(level, option)}
                        className="
                          w-4 h-4 border-2 border-neutral-200
                          checked:bg-cito-primary checked:border-cito-primary
                          focus:ring-2 focus:ring-cito-primary focus:ring-offset-2
                          cursor-pointer accent-cito-primary
                        "
                      />
                      <span className="ml-2">
                        {CURRENT_TOOL_USAGE_LABELS[option]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
