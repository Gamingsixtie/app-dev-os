import { describe, it, expect } from 'vitest';
import { isModified, resetToDefault, type Assumption } from '../assumptions';

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'uurtarief',
    label: 'Uurtarief',
    description: 'Gemiddeld uurtarief docent',
    defaultValue: 50,
    currentValue: 50,
    unit: 'euro/uur',
    category: 'financieel',
    ...overrides,
  };
}

describe('isModified', () => {
  it('returns false when currentValue equals defaultValue', () => {
    const assumption = makeAssumption({ defaultValue: 50, currentValue: 50 });
    expect(isModified(assumption)).toBe(false);
  });

  it('returns true when currentValue differs from defaultValue', () => {
    const assumption = makeAssumption({ defaultValue: 50, currentValue: 65 });
    expect(isModified(assumption)).toBe(true);
  });
});

describe('resetToDefault', () => {
  it('sets currentValue back to defaultValue', () => {
    const assumption = makeAssumption({ defaultValue: 50, currentValue: 65 });
    const reset = resetToDefault(assumption);
    expect(reset.currentValue).toBe(50);
    expect(reset.defaultValue).toBe(50);
    // Should be a new object, not mutated
    expect(reset).not.toBe(assumption);
    expect(assumption.currentValue).toBe(65);
  });
});
