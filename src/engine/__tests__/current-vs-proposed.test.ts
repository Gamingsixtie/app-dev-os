import { describe, it, expect } from 'vitest';
import { calculateCurrentVsProposed } from '../current-vs-proposed';
import type { ModuleCurrentSetup } from '../../models/school';
import type { PriceRecord } from '../../models/pricing';

const mockPrices: PriceRecord[] = [
  {
    moduleId: 'rekenwiskunde',
    provider: 'cito',
    amountPerStudent: 4.5,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-01'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'dia',
    amountPerStudent: 5.2,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-01'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'rekenwiskunde',
    provider: 'jij',
    amountPerStudent: 4.8,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-01'),
    isPublicationPrice: true,
  },
  {
    moduleId: 'cognitieve-capaciteiten',
    provider: 'cito',
    amountPerStudent: 6.5,
    source: 'publication',
    sourceLabel: 'Test',
    verifiedAt: new Date('2026-01-01'),
    isPublicationPrice: true,
  },
];

const studentCounts = { havo: { 1: 50, 2: 50 } }; // 100 students total

describe('calculateCurrentVsProposed', () => {
  it('returns empty result for empty moduleSetups', () => {
    const result = calculateCurrentVsProposed([], studentCounts, mockPrices);
    expect(result.modules).toHaveLength(0);
    expect(result.totalCurrentCost).toBe(0);
    expect(result.totalProposedCost).toBe(0);
    expect(result.totalAnnualSavings).toBe(0);
  });

  it('calculates correctly for DIA at publication price', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);
    const mod = result.modules[0];

    // Uses DIA publication price (5.2) × 100 students = 520
    expect(mod.currentCostPerStudent).toBe(5.2);
    expect(mod.currentTotalCost).toBe(520);
    // Cito: 4.5 × 100 = 450
    expect(mod.proposedCitoCostPerStudent).toBe(4.5);
    expect(mod.proposedCitoTotalCost).toBe(450);
    // Difference: 520 - 450 = 70 (Cito cheaper)
    expect(mod.annualDifference).toBe(70);
    expect(result.totalAnnualSavings).toBe(70);
  });

  it('uses custom price when pricePerStudent is set', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 3.0 },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);
    const mod = result.modules[0];

    expect(mod.currentCostPerStudent).toBe(3.0);
    expect(mod.currentTotalCost).toBe(300);
    // annualDifference: 300 - 450 = -150 (Cito more expensive)
    expect(mod.annualDifference).toBe(-150);
    expect(result.hasSpecialPrices).toBe(true);
  });

  it('marks module as new when provider is geen', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'cognitieve-capaciteiten', currentProvider: 'geen', pricePerStudent: null },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);
    const mod = result.modules[0];

    expect(mod.isNewModule).toBe(true);
    expect(mod.currentTotalCost).toBeNull();
    expect(mod.proposedCitoTotalCost).toBe(650); // 6.5 × 100
    expect(mod.annualDifference).toBeNull();
  });

  it('handles cito-oud provider with null current cost', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);
    const mod = result.modules[0];

    expect(mod.isNewModule).toBe(false);
    expect(mod.currentCostPerStudent).toBeNull();
    expect(mod.currentTotalCost).toBeNull();
    expect(mod.annualDifference).toBeNull();
  });

  it('handles overig provider with custom name and price', () => {
    const setups: ModuleCurrentSetup[] = [
      {
        moduleId: 'rekenwiskunde',
        currentProvider: 'overig',
        pricePerStudent: 4.0,
        customProviderName: 'Boom Toetsing',
      },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);
    const mod = result.modules[0];

    expect(mod.currentProviderLabel).toBe('Boom Toetsing');
    expect(mod.currentCostPerStudent).toBe(4.0);
    expect(mod.currentTotalCost).toBe(400);
  });

  it('sums totals correctly across multiple modules', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
      { moduleId: 'cognitieve-capaciteiten', currentProvider: 'geen', pricePerStudent: null },
    ];
    const result = calculateCurrentVsProposed(setups, studentCounts, mockPrices);

    // DIA rekenwiskunde: 5.2 × 100 = 520
    expect(result.totalCurrentCost).toBe(520);
    // Cito rekenwiskunde: 4.5 × 100 = 450, cog. cap.: 6.5 × 100 = 650 → total = 1100
    expect(result.totalProposedCost).toBe(1100);
    // savings: 520 - 1100 = -580 (Cito more expensive because it adds new module)
    expect(result.totalAnnualSavings).toBe(-580);
  });
});
