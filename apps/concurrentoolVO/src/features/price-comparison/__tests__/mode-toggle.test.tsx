import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock the school profile store
const mockSchoolProfileState = {
  levels: ['havo', 'vwo'] as string[],
  studentCounts: {
    havo: { 1: 100, 2: 100, 3: 100 },
    vwo: { 1: 50, 2: 50, 3: 50 },
  },
  selectedModules: ['rekenwiskunde', 'nederlands'],
  moduleSetups: [
    { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
    { moduleId: 'nederlands', currentProvider: 'dia', pricePerStudent: null },
  ],
  scenario: null,
  currentStep: 0,
};

vi.mock('../../school-profile/store', () => ({
  useSchoolProfileStore: {
    getState: () => mockSchoolProfileState,
  },
}));

// Import after mock setup
const { usePriceComparisonStore } = await import('../store');

describe('mode-toggle store behavior (MODE-02)', () => {
  beforeEach(() => {
    act(() => {
      usePriceComparisonStore.setState({
        result: null,
        draftOverrides: [],
        appliedOverrides: [],
        hasPendingChanges: false,
        isInternalMode: true,
        contractPeriod: 'annual',
        hybridResult: null,
        sensitivityResult: null,
        diaPackageResult: null,
        activeCompetitor: null,
      });
    });
  });

  it('defaults to isInternalMode = true', () => {
    const state = usePriceComparisonStore.getState();
    expect(state.isInternalMode).toBe(true);
  });

  it('setInternalMode(false) sets isInternalMode to false', () => {
    act(() => {
      usePriceComparisonStore.getState().setInternalMode(false);
    });
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(false);
  });

  it('setInternalMode(true) restores isInternalMode to true', () => {
    act(() => {
      usePriceComparisonStore.getState().setInternalMode(false);
    });
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(false);

    act(() => {
      usePriceComparisonStore.getState().setInternalMode(true);
    });
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(true);
  });

  it('sensitivityResult is still computed when isInternalMode is false', () => {
    // Set mode to external
    act(() => {
      usePriceComparisonStore.getState().setInternalMode(false);
    });
    // Initialize the store (which computes sensitivity)
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });
    const state = usePriceComparisonStore.getState();
    // Data should still exist in the store even in external mode
    // (sensitivity is computed unconditionally, UI hides it)
    expect(state.isInternalMode).toBe(false);
    expect(state.sensitivityResult).not.toBeNull();
  });

  it('recalculate() does not clear isInternalMode', () => {
    // Initialize first
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });
    // Switch to external mode
    act(() => {
      usePriceComparisonStore.getState().setInternalMode(false);
    });
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(false);

    // Recalculate
    act(() => {
      usePriceComparisonStore.getState().recalculate();
    });
    // Mode should be preserved
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(false);
  });
});
