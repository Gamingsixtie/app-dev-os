export interface Assumption {
  id: string;
  label: string;
  description: string;
  defaultValue: number;
  currentValue: number;
  unit: string;
  category: string;
}

/**
 * Check if an assumption has been modified from its default value.
 */
export function isModified(assumption: Assumption): boolean {
  return assumption.currentValue !== assumption.defaultValue;
}

/**
 * Reset an assumption to its default value.
 * Returns a new object (does not mutate the original).
 */
export function resetToDefault(assumption: Assumption): Assumption {
  return { ...assumption, currentValue: assumption.defaultValue };
}

export interface AssumptionPreset {
  name: string;
  studentCountRanges: Record<string, number>;
  assumptions: Partial<Record<string, number>>;
}
