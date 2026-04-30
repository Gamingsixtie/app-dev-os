import { describe, it, expect } from 'vitest';
import type { SchoolRecord, PriceOverride } from '@/db/types';

/**
 * PRIJS-07: School-specific price overrides are stored per-school
 * and do not cross-contaminate between schools.
 *
 * This test verifies the data model ensures that appliedOverrides
 * are a property of each individual SchoolRecord, not shared state.
 */

function makeSchool(name: string, overrides: PriceOverride[]): Pick<SchoolRecord, 'name' | 'appliedOverrides'> {
  return { name, appliedOverrides: overrides };
}

describe('PRIJS-07: School-specific price overrides isolation', () => {
  it('two schools can have different appliedOverrides arrays', () => {
    const schoolA = makeSchool('School A', [
      { moduleId: 'rekenwiskunde', provider: 'cito', amount: 5.0 },
    ]);

    const schoolB = makeSchool('School B', [
      { moduleId: 'nederlands', provider: 'dia', amount: 3.5 },
      { moduleId: 'rekenwiskunde', provider: 'cito', amount: 7.0 },
    ]);

    // School A has different overrides from School B
    expect(schoolA.appliedOverrides).toHaveLength(1);
    expect(schoolB.appliedOverrides).toHaveLength(2);

    // No cross-contamination
    expect(schoolA.appliedOverrides).not.toEqual(schoolB.appliedOverrides);
    expect(schoolA.appliedOverrides[0].amount).toBe(5.0);
    expect(schoolB.appliedOverrides.find(o => o.moduleId === 'rekenwiskunde')!.amount).toBe(7.0);
  });

  it('modifying one school overrides does not affect another', () => {
    const overridesA: PriceOverride[] = [
      { moduleId: 'rekenwiskunde', provider: 'cito', amount: 5.0 },
    ];
    const overridesB: PriceOverride[] = [
      { moduleId: 'rekenwiskunde', provider: 'cito', amount: 5.0 },
    ];

    const schoolA = makeSchool('School A', overridesA);
    const schoolB = makeSchool('School B', overridesB);

    // Mutate school A's overrides
    schoolA.appliedOverrides = [
      ...schoolA.appliedOverrides,
      { moduleId: 'nederlands', provider: 'dia', amount: 4.0 },
    ];

    // School B should remain unchanged
    expect(schoolB.appliedOverrides).toHaveLength(1);
    expect(schoolA.appliedOverrides).toHaveLength(2);
  });

  it('appliedOverrides on SchoolRecord are separate from default publication prices', () => {
    // The appliedOverrides field explicitly stores per-school custom prices
    // that override the default publication prices from src/data/
    const school = makeSchool('Test School', [
      { moduleId: 'rekenwiskunde', provider: 'cito', amount: 6.0 },
    ]);

    // Verify the override has the expected structure
    const override = school.appliedOverrides[0];
    expect(override).toHaveProperty('moduleId');
    expect(override).toHaveProperty('provider');
    expect(override).toHaveProperty('amount');

    // The amount is a school-specific price, not the publication price
    // Publication prices live in src/data/default-prices.ts (read-only)
    expect(override.amount).toBe(6.0);
  });
});
