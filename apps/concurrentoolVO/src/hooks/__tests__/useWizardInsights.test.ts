import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the store with selector support
const mockState = {
  selectedModules: ['rekenwiskunde', 'nederlands'],
  studentCounts: {
    havo: { 1: 100, 2: 100, 3: 100 },
    vwo: { 1: 50, 2: 50, 3: 50 },
  },
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
    { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
  ],
};

vi.mock('@/features/school-profile/store', () => ({
  useSchoolProfileStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

// Mock engines with real-ish return values
vi.mock('@/engine/price-comparison', () => ({
  calculateComparison: vi.fn(() => ({
    modules: [
      { moduleId: 'rekenwiskunde', providers: { cito: { totalCost: 3591 }, dia: { totalCost: 3000 }, jij: { totalCost: 0 } } },
      { moduleId: 'nederlands', providers: { cito: { totalCost: 1800 }, dia: { totalCost: 1500 }, jij: { totalCost: 0 } } },
    ],
    totals: { cito: 5391, dia: 4500, jij: 0 },
  })),
  getTotalStudents: vi.fn(() => 450),
}));

vi.mock('@/engine/schijnvoordeel', () => ({
  detectSchijnvoordelen: vi.fn(() => []),
}));

vi.mock('@/engine/upsell', () => ({
  calculateUpsell: vi.fn(() => []),
}));

import { useWizardInsights } from '../useWizardInsights';

describe('useWizardInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns comparison preview with module results', () => {
    const { result } = renderHook(() => useWizardInsights());

    expect(result.current.comparisonPreview).toBeDefined();
    expect(result.current.comparisonPreview.modules).toHaveLength(2);
  });

  it('returns total students count', () => {
    const { result } = renderHook(() => useWizardInsights());

    expect(result.current.totalStudents).toBe(450);
  });

  it('returns schijnvoordelen array', () => {
    const { result } = renderHook(() => useWizardInsights());

    expect(Array.isArray(result.current.schijnvoordelen)).toBe(true);
  });

  it('returns upsell opportunities array', () => {
    const { result } = renderHook(() => useWizardInsights());

    expect(Array.isArray(result.current.upsellOpportunities)).toBe(true);
  });
});
