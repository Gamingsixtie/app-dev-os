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
    { moduleId: 'rekenwiskunde', currentProvider: 'geen', pricePerStudent: null },
    { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
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

describe('usePriceComparisonStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    act(() => {
      usePriceComparisonStore.setState({
        result: null,
        draftOverrides: [],
        appliedOverrides: [],
        hasPendingChanges: false,
        isInternalMode: true,
        contractPeriod: 'annual',
        citoBundleType: 'individual',
        visibleProviders: ['cito'],
        migrationHourlyRate: null,
        migrationTimeSavingOverrides: {},
        customTimeSavingTasks: [],
        hiddenTimeSavingTaskIds: [],
        competitorModuleIds: null,
        forceDiaPackageId: undefined,
        productPricesDirty: false,
      });
    });
  });

  it('has correct initial state: result=null, draftOverrides=[], hasPendingChanges=false', () => {
    const state = usePriceComparisonStore.getState();
    expect(state.result).toBeNull();
    expect(state.draftOverrides).toEqual([]);
    expect(state.appliedOverrides).toEqual([]);
    expect(state.hasPendingChanges).toBe(false);
  });

  it('initialize() reads school profile and computes initial ComparisonResult', () => {
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.result).not.toBeNull();
    expect(state.result!.modules).toHaveLength(2); // rekenwiskunde, nederlands
    expect(state.result!.totals).toHaveProperty('cito');
    expect(state.result!.totals).toHaveProperty('dia');
    expect(state.result!.totals).toHaveProperty('jij');

    // 450 students total (havo: 300 + vwo: 150)
    // rekenwiskunde cito: 7.98 * 450 = 3591
    expect(state.result!.modules[0].providers.cito?.totalCost).toBe(3591);
  });

  it('setDraftOverride adds override and sets hasPendingChanges=true', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0]).toEqual({
      moduleId: 'rekenwiskunde',
      provider: 'cito',
      amount: 5.0,
    });
    expect(state.hasPendingChanges).toBe(true);
  });

  it('setDraftOverride upserts existing override for same moduleId+provider', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 6.0,
      });
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0].amount).toBe(6.0);
  });

  it('recalculate() merges draftOverrides into prices and recomputes result', () => {
    // First initialize
    act(() => {
      usePriceComparisonStore.getState().initialize();
    });

    // Set a draft override
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 10.0,
      });
    });

    // Recalculate
    act(() => {
      usePriceComparisonStore.getState().recalculate();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.hasPendingChanges).toBe(false);
    // draftOverrides should be empty (moved to appliedOverrides)
    expect(state.draftOverrides).toEqual([]);
    expect(state.appliedOverrides).toHaveLength(1);

    // 450 students * 10.0 = 4500 (was 2025 with default 4.5)
    expect(state.result!.modules[0].providers.cito?.totalCost).toBe(4500);
    // Override should change the priceRecord source
    expect(state.result!.modules[0].providers.cito?.priceRecord.source).toBe('manual');
  });

  it('resetOverride removes specific override from draftOverrides', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'nederlands',
        provider: 'dia',
        amount: 6.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().resetOverride('rekenwiskunde', 'cito');
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toHaveLength(1);
    expect(state.draftOverrides[0].moduleId).toBe('nederlands');
    expect(state.hasPendingChanges).toBe(true);
  });

  it('resetAllOverrides clears all overrides and sets hasPendingChanges=true', () => {
    act(() => {
      usePriceComparisonStore.getState().setDraftOverride({
        moduleId: 'rekenwiskunde',
        provider: 'cito',
        amount: 5.0,
      });
    });

    act(() => {
      usePriceComparisonStore.getState().resetAllOverrides();
    });

    const state = usePriceComparisonStore.getState();
    expect(state.draftOverrides).toEqual([]);
    expect(state.hasPendingChanges).toBe(true);
  });

  // ─── Visible providers ────────────────────────────────────────────────

  it('setVisibleProviders always includes cito', () => {
    act(() => {
      usePriceComparisonStore.getState().setVisibleProviders(['dia', 'jij']);
    });

    const state = usePriceComparisonStore.getState();
    expect(state.visibleProviders).toContain('cito');
    expect(state.visibleProviders).toContain('dia');
    expect(state.visibleProviders).toContain('jij');
  });

  it('setVisibleProviders does not duplicate cito if already present', () => {
    act(() => {
      usePriceComparisonStore.getState().setVisibleProviders(['cito', 'dia']);
    });

    const state = usePriceComparisonStore.getState();
    expect(state.visibleProviders.filter(p => p === 'cito')).toHaveLength(1);
  });

  it('toggleProvider adds a new provider', () => {
    act(() => {
      usePriceComparisonStore.setState({ visibleProviders: ['cito', 'dia'] });
    });
    act(() => {
      usePriceComparisonStore.getState().toggleProvider('jij');
    });

    expect(usePriceComparisonStore.getState().visibleProviders).toContain('jij');
  });

  it('toggleProvider removes an existing provider (but not below 2)', () => {
    act(() => {
      usePriceComparisonStore.setState({ visibleProviders: ['cito', 'dia', 'jij'] });
    });
    act(() => {
      usePriceComparisonStore.getState().toggleProvider('jij');
    });

    expect(usePriceComparisonStore.getState().visibleProviders).not.toContain('jij');
  });

  it('toggleProvider cannot toggle off cito', () => {
    act(() => {
      usePriceComparisonStore.setState({ visibleProviders: ['cito', 'dia'] });
    });
    act(() => {
      usePriceComparisonStore.getState().toggleProvider('cito');
    });

    expect(usePriceComparisonStore.getState().visibleProviders).toContain('cito');
  });

  it('toggleProvider does not remove last non-cito provider', () => {
    act(() => {
      usePriceComparisonStore.setState({ visibleProviders: ['cito', 'dia'] });
    });
    act(() => {
      usePriceComparisonStore.getState().toggleProvider('dia');
    });

    // Should still have 2 providers (cannot go below 2)
    expect(usePriceComparisonStore.getState().visibleProviders).toHaveLength(2);
  });

  // ─── Mode toggles ────────────────────────────────────────────────────

  it('setInternalMode switches mode', () => {
    act(() => {
      usePriceComparisonStore.getState().setInternalMode(false);
    });

    expect(usePriceComparisonStore.getState().isInternalMode).toBe(false);
  });

  it('default mode is internal (true)', () => {
    expect(usePriceComparisonStore.getState().isInternalMode).toBe(true);
  });

  // ─── Migration actions ────────────────────────────────────────────────

  it('setMigrationHourlyRate updates rate', () => {
    act(() => {
      usePriceComparisonStore.getState().setMigrationHourlyRate(65);
    });

    expect(usePriceComparisonStore.getState().migrationHourlyRate).toBe(65);
  });

  it('setMigrationTimeSavingOverride adds an override by taskId', () => {
    act(() => {
      usePriceComparisonStore.getState().setMigrationTimeSavingOverride('task-1', 10);
    });

    expect(usePriceComparisonStore.getState().migrationTimeSavingOverrides['task-1']).toBe(10);
  });

  it('addCustomTimeSavingTask appends to list', () => {
    const task = { id: 'custom-1', label: 'Custom task', hoursPerYear: 5, category: 'test' };
    act(() => {
      usePriceComparisonStore.getState().addCustomTimeSavingTask(task as any);
    });

    expect(usePriceComparisonStore.getState().customTimeSavingTasks).toHaveLength(1);
    expect(usePriceComparisonStore.getState().customTimeSavingTasks[0].id).toBe('custom-1');
  });

  it('removeCustomTimeSavingTask removes by id', () => {
    const task = { id: 'custom-1', label: 'Custom task', hoursPerYear: 5, category: 'test' };
    act(() => {
      usePriceComparisonStore.getState().addCustomTimeSavingTask(task as any);
    });
    act(() => {
      usePriceComparisonStore.getState().removeCustomTimeSavingTask('custom-1');
    });

    expect(usePriceComparisonStore.getState().customTimeSavingTasks).toHaveLength(0);
  });

  it('toggleHiddenTimeSavingTask toggles visibility', () => {
    act(() => {
      usePriceComparisonStore.getState().toggleHiddenTimeSavingTask('task-1');
    });
    expect(usePriceComparisonStore.getState().hiddenTimeSavingTaskIds).toContain('task-1');

    act(() => {
      usePriceComparisonStore.getState().toggleHiddenTimeSavingTask('task-1');
    });
    expect(usePriceComparisonStore.getState().hiddenTimeSavingTaskIds).not.toContain('task-1');
  });

  // ─── markProductPricesDirty ───────────────────────────────────────────

  it('markProductPricesDirty sets flag to true', () => {
    act(() => {
      usePriceComparisonStore.getState().markProductPricesDirty();
    });

    expect(usePriceComparisonStore.getState().productPricesDirty).toBe(true);
  });

  // ─── Variant config ──────────────────────────────────────────────────

  it('setVariantConfig stores competitor module mapping', () => {
    act(() => {
      usePriceComparisonStore.getState().setVariantConfig(
        { dia: ['rekenwiskunde'], jij: ['nederlands'] },
        'dia-pakket-1',
      );
    });

    const state = usePriceComparisonStore.getState();
    expect(state.competitorModuleIds).toEqual({ dia: ['rekenwiskunde'], jij: ['nederlands'] });
    expect(state.forceDiaPackageId).toBe('dia-pakket-1');
  });
});
