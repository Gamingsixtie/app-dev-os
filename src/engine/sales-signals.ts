export type SalesSignalType = 'emphasize-price' | 'focus-value' | 'vulnerable';

export interface SalesSignal {
  type: SalesSignalType;
  label: string;
  description: string;
  color: 'green' | 'yellow' | 'red';
}

/**
 * Determine the sales signal for a module based on cost comparison
 * and available differentiators.
 *
 * Logic:
 * - Cito cheaper or equal -> "Benadruk prijs" (green)
 * - Cito more expensive + has differentiators -> "Focus op meerwaarde" (yellow)
 * - Cito more expensive + no differentiators -> "Kwetsbaar punt" (red)
 * - Either cost is null -> null (cannot determine)
 *
 * Pure function: no side effects, no state.
 *
 * @param citoCost - Cito cost per student (or total)
 * @param competitorCost - Competitor cost per student (or total)
 * @param citoDifferentiators - Unique Cito advantages for this module
 * @param competitorDifferentiators - Unique competitor advantages (currently unused but available for future use)
 */
export function determineSalesSignal(
  citoCost: number | null,
  competitorCost: number | null,
  citoDifferentiators: string[],
  _competitorDifferentiators: string[],
): SalesSignal | null {
  if (citoCost === null || competitorCost === null) {
    return null;
  }

  if (citoCost <= competitorCost) {
    return {
      type: 'emphasize-price',
      label: 'Benadruk prijs',
      description:
        'Cito is goedkoper of gelijk geprijsd. Gebruik prijs als verkoopargument.',
      color: 'green',
    };
  }

  if (citoDifferentiators.length > 0) {
    return {
      type: 'focus-value',
      label: 'Focus op meerwaarde',
      description:
        'Cito is duurder, maar biedt unieke voordelen. Benadruk de meerwaarde.',
      color: 'yellow',
    };
  }

  return {
    type: 'vulnerable',
    label: 'Kwetsbaar punt',
    description:
      'Cito is duurder zonder duidelijke differentiatie. Bereid een sterk verhaal voor.',
    color: 'red',
  };
}
