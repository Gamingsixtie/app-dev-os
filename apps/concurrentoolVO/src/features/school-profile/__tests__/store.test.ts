import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSchoolProfileStore } from '../store';
import type { SchoolRecord } from '@/db/types';

describe('useSchoolProfileStore', () => {
  beforeEach(() => {
    act(() => {
      useSchoolProfileStore.getState().clear();
    });
  });

  describe('initialization', () => {
    it('has correct default state', () => {
      const state = useSchoolProfileStore.getState();
      expect(state.activeSchoolId).toBeNull();
      expect(state.schoolName).toBe('');
      expect(state.levels).toEqual([]);
      expect(state.studentCounts).toEqual({});
      expect(state.selectedModules).toEqual([]);
      expect(state.moduleSetups).toEqual([]);
      expect(state.scenario).toBeNull();
      expect(state.currentStep).toBe(0);
      expect(state.intakeMode).toBe(false);
      expect(state.pipelineStatus).toBe('prospect');
      expect(state.contacts).toEqual([]);
      expect(state.conversations).toEqual([]);
      expect(state.actions).toEqual([]);
      expect(state.region).toBe('');
      expect(state.tags).toEqual([]);
      expect(state.viewPreference).toBe('compact');
    });
  });

  describe('setters', () => {
    it('setSchoolName updates name', () => {
      act(() => {
        useSchoolProfileStore.getState().setSchoolName('Test School');
      });
      expect(useSchoolProfileStore.getState().schoolName).toBe('Test School');
    });

    it('setLevels updates levels', () => {
      act(() => {
        useSchoolProfileStore.getState().setLevels(['havo', 'vwo']);
      });
      expect(useSchoolProfileStore.getState().levels).toEqual(['havo', 'vwo']);
    });

    it('setStudentCounts updates counts', () => {
      const counts = { havo: { 1: 100, 2: 110 } };
      act(() => {
        useSchoolProfileStore.getState().setStudentCounts(counts);
      });
      expect(useSchoolProfileStore.getState().studentCounts).toEqual(counts);
    });

    it('setScenario updates scenario', () => {
      act(() => {
        useSchoolProfileStore.getState().setScenario('A');
      });
      expect(useSchoolProfileStore.getState().scenario).toBe('A');
    });

    it('setCurrentStep updates step', () => {
      act(() => {
        useSchoolProfileStore.getState().setCurrentStep(3);
      });
      expect(useSchoolProfileStore.getState().currentStep).toBe(3);
    });

    it('setIntakeMode toggles mode', () => {
      act(() => {
        useSchoolProfileStore.getState().setIntakeMode(true);
      });
      expect(useSchoolProfileStore.getState().intakeMode).toBe(true);
    });
  });

  describe('setSelectedModules', () => {
    it('updates modules and syncs moduleSetups with defaults', () => {
      act(() => {
        useSchoolProfileStore.getState().setSelectedModules(['rekenwiskunde', 'nederlands']);
      });

      const state = useSchoolProfileStore.getState();
      expect(state.selectedModules).toEqual(['rekenwiskunde', 'nederlands']);
      expect(state.moduleSetups).toHaveLength(2);
      expect(state.moduleSetups[0]).toEqual({
        moduleId: 'rekenwiskunde',
        currentProvider: 'geen',
        pricePerStudent: null,
      });
    });

    it('preserves existing moduleSetup when module stays selected', () => {
      // Set initial modules with custom setup
      act(() => {
        useSchoolProfileStore.getState().setSelectedModules(['rekenwiskunde']);
      });
      act(() => {
        useSchoolProfileStore.getState().setModuleSetups([
          { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.0 },
        ]);
      });

      // Add a new module - existing should be preserved
      act(() => {
        useSchoolProfileStore.getState().setSelectedModules(['rekenwiskunde', 'nederlands']);
      });

      const state = useSchoolProfileStore.getState();
      expect(state.moduleSetups[0].currentProvider).toBe('dia');
      expect(state.moduleSetups[0].pricePerStudent).toBe(5.0);
      expect(state.moduleSetups[1].currentProvider).toBe('geen');
    });

    it('removes moduleSetup when module is deselected', () => {
      act(() => {
        useSchoolProfileStore.getState().setSelectedModules(['rekenwiskunde', 'nederlands']);
      });
      act(() => {
        useSchoolProfileStore.getState().setSelectedModules(['rekenwiskunde']);
      });

      const state = useSchoolProfileStore.getState();
      expect(state.moduleSetups).toHaveLength(1);
      expect(state.moduleSetups[0].moduleId).toBe('rekenwiskunde');
    });
  });

  describe('applyPreset', () => {
    it('applies student counts for selected levels', () => {
      act(() => {
        useSchoolProfileStore.getState().setLevels(['havo']);
      });
      act(() => {
        useSchoolProfileStore.getState().applyPreset('klein');
      });

      const state = useSchoolProfileStore.getState();
      // Should have student counts for havo from the klein preset
      expect(state.studentCounts.havo).toBeDefined();
    });

    it('does nothing for invalid preset id', () => {
      act(() => {
        useSchoolProfileStore.getState().setLevels(['havo']);
        useSchoolProfileStore.getState().setStudentCounts({ havo: { 1: 100 } });
      });
      act(() => {
        useSchoolProfileStore.getState().applyPreset('nonexistent' as any);
      });

      // Should remain unchanged
      expect(useSchoolProfileStore.getState().studentCounts).toEqual({ havo: { 1: 100 } });
    });
  });

  describe('hydrate', () => {
    it('hydrates all fields from a SchoolRecord', () => {
      const record: SchoolRecord = {
        id: 'school-1',
        name: 'Hydrated School',
        slug: 'hydrated-school',
        levels: ['vwo'],
        studentCounts: { vwo: { 1: 200 } },
        selectedModules: ['rekenwiskunde'],
        moduleSetups: [{ moduleId: 'rekenwiskunde', currentProvider: 'cito', pricePerStudent: 7.98 }],
        scenario: 'B',
        completedSteps: [0, 1, 2],
        appliedOverrides: [],
        migrationTimeSavingOverrides: {},
        customTimeSavingTasks: [],
        hiddenTimeSavingTaskIds: [],
        pipelineStatus: 'active',
        contacts: [],
        conversations: [],
        actions: [],
        systemEvents: [],
        region: 'Noord-Holland',
        tags: ['test'],
        viewPreference: 'extended',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      act(() => {
        useSchoolProfileStore.getState().hydrate(record);
      });

      const state = useSchoolProfileStore.getState();
      expect(state.activeSchoolId).toBe('school-1');
      expect(state.schoolName).toBe('Hydrated School');
      expect(state.levels).toEqual(['vwo']);
      expect(state.scenario).toBe('B');
      expect(state.pipelineStatus).toBe('active');
      expect(state.region).toBe('Noord-Holland');
      expect(state.tags).toEqual(['test']);
      expect(state.viewPreference).toBe('extended');
      // completedSteps [0,1,2] -> max is 2 -> next step is 3
      expect(state.currentStep).toBe(3);
    });

    it('sets currentStep to 0 for school with no completed steps', () => {
      const record: SchoolRecord = {
        id: 'new-school',
        name: 'New',
        slug: 'new',
        levels: [],
        studentCounts: {},
        selectedModules: [],
        moduleSetups: [],
        scenario: null,
        completedSteps: [],
        appliedOverrides: [],
        migrationTimeSavingOverrides: {},
        customTimeSavingTasks: [],
        hiddenTimeSavingTaskIds: [],
        pipelineStatus: 'prospect',
        contacts: [],
        conversations: [],
        actions: [],
        systemEvents: [],
        region: '',
        tags: [],
        viewPreference: 'compact',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      act(() => {
        useSchoolProfileStore.getState().hydrate(record);
      });

      expect(useSchoolProfileStore.getState().currentStep).toBe(0);
    });
  });

  describe('clear and reset', () => {
    it('clear resets to initial state', () => {
      act(() => {
        useSchoolProfileStore.getState().setSchoolName('Test');
        useSchoolProfileStore.getState().setLevels(['havo']);
      });
      act(() => {
        useSchoolProfileStore.getState().clear();
      });

      const state = useSchoolProfileStore.getState();
      expect(state.schoolName).toBe('');
      expect(state.levels).toEqual([]);
    });

    it('reset is equivalent to clear', () => {
      act(() => {
        useSchoolProfileStore.getState().setSchoolName('Test');
      });
      act(() => {
        useSchoolProfileStore.getState().reset();
      });

      expect(useSchoolProfileStore.getState().schoolName).toBe('');
    });
  });
});
