import { create } from 'zustand';
import type { SchoolLevel, Scenario, ModuleCurrentSetup, PipelineStatus, CustomerType, SchoolType, GrowthTrajectory, CurrentToolUsage, CurrentToolUsageMap } from '../../models/school';
import { SCHOOL_SIZE_PRESETS } from '../../data/school-profiles';
import type { SchoolRecord, Contact, Conversation, ActionItem, SystemEvent, LostDealInfo } from '@/db/types';

interface SchoolProfileState {
  // Multi-school identity
  activeSchoolId: string | null;
  schoolName: string;
  setSchoolName: (name: string) => void;

  // Step 1
  levels: SchoolLevel[];
  setLevels: (levels: SchoolLevel[]) => void;

  // Step 1 — Phase 27 R3 + R4: sales-context fields
  customerType: CustomerType | null;
  setCustomerType: (customerType: CustomerType | null) => void;
  schoolType: SchoolType | null;
  setSchoolType: (schoolType: SchoolType | null) => void;
  customSchoolType: string | null;
  setCustomSchoolType: (customSchoolType: string | null) => void;
  growthTrajectory: GrowthTrajectory | null;
  setGrowthTrajectory: (growthTrajectory: GrowthTrajectory | null) => void;

  // Step 2
  studentCounts: Partial<Record<SchoolLevel, Record<number, number>>>;
  setStudentCounts: (counts: Partial<Record<SchoolLevel, Record<number, number>>>) => void;

  // Step 2 — Phase 27 R5: per-niveau huidig-gebruik (Cito / DIA / JIJ! / Mix / Geen)
  currentToolUsage: CurrentToolUsageMap;
  setCurrentToolUsage: (level: SchoolLevel, value: CurrentToolUsage) => void;
  setCurrentToolUsageMap: (map: CurrentToolUsageMap) => void;

  // Step 3
  selectedModules: string[];
  setSelectedModules: (modules: string[]) => void;

  // Step 4 — Huidige situatie per module
  moduleSetups: ModuleCurrentSetup[];
  setModuleSetups: (setups: ModuleCurrentSetup[]) => void;

  // Step 5
  scenario: Scenario | null;
  setScenario: (scenario: Scenario) => void;

  // Navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // AI Intake mode
  intakeMode: boolean;
  setIntakeMode: (mode: boolean) => void;

  // CRM-lite fields
  pipelineStatus: PipelineStatus;
  contacts: Contact[];
  conversations: Conversation[];
  actions: ActionItem[];
  systemEvents: SystemEvent[];
  region: string;
  tags: string[];
  viewPreference: 'compact' | 'extended';
  lostDealInfo?: LostDealInfo;

  // Utilities
  applyPreset: (presetId: 'klein' | 'midden' | 'groot') => void;
  hydrate: (record: SchoolRecord) => void;
  clear: () => void;
  reset: () => void;
}

const initialState = {
  activeSchoolId: null as string | null,
  schoolName: '',
  levels: [] as SchoolLevel[],
  // Phase 27 R3 + R4 — sales-context fields (null until WizardStep1 submitted)
  customerType: null as CustomerType | null,
  schoolType: null as SchoolType | null,
  customSchoolType: null as string | null,
  growthTrajectory: null as GrowthTrajectory | null,
  studentCounts: {} as Partial<Record<SchoolLevel, Record<number, number>>>,
  // Phase 27 R5 — empty map until WizardStep2 captures per-niveau keuzes
  currentToolUsage: {} as CurrentToolUsageMap,
  selectedModules: [] as string[],
  moduleSetups: [] as ModuleCurrentSetup[],
  scenario: null as Scenario | null,
  currentStep: 0,
  intakeMode: false,
  // CRM-lite defaults
  pipelineStatus: 'prospect' as PipelineStatus,
  contacts: [] as Contact[],
  conversations: [] as Conversation[],
  actions: [] as ActionItem[],
  systemEvents: [] as SystemEvent[],
  region: '',
  tags: [] as string[],
  viewPreference: 'compact' as const,
  lostDealInfo: undefined as LostDealInfo | undefined,
};

export const useSchoolProfileStore = create<SchoolProfileState>()(
  (set) => ({
    ...initialState,

    setSchoolName: (schoolName) => set({ schoolName }),
    setLevels: (levels) => set({ levels }),
    // Phase 27 R3 + R4 — sales-context setters (mirror setSchoolName pattern;
    // WizardShell auto-saves the store state to Dexie + Supabase on Next).
    setCustomerType: (customerType) => set({ customerType }),
    setSchoolType: (schoolType) => set({ schoolType }),
    setCustomSchoolType: (customSchoolType) => set({ customSchoolType }),
    setGrowthTrajectory: (growthTrajectory) => set({ growthTrajectory }),
    setStudentCounts: (studentCounts) => set({ studentCounts }),

    // Phase 27 R5 — per-niveau huidig-gebruik (WizardStep2). Immer-style
    // mutate via spread to keep the map shallow-immutable for store subscribers.
    setCurrentToolUsage: (level, value) =>
      set((state) => ({
        currentToolUsage: { ...state.currentToolUsage, [level]: value },
      })),
    setCurrentToolUsageMap: (currentToolUsage) => set({ currentToolUsage }),

    setSelectedModules: (selectedModules) =>
      set((state) => {
        const existing = new Map(state.moduleSetups.map((s) => [s.moduleId, s]));
        const synced: ModuleCurrentSetup[] = selectedModules.map((moduleId) =>
          existing.get(moduleId) ?? {
            moduleId,
            currentProvider: 'geen',
            pricePerStudent: null,
          },
        );
        return { selectedModules, moduleSetups: synced };
      }),

    setModuleSetups: (moduleSetups) => set({ moduleSetups }),
    setScenario: (scenario) => set({ scenario }),
    setCurrentStep: (currentStep) => set({ currentStep }),
    setIntakeMode: (intakeMode) => set({ intakeMode }),

    applyPreset: (presetId) => {
      const preset = SCHOOL_SIZE_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      set((state) => {
        const newCounts = { ...state.studentCounts };
        for (const level of state.levels) {
          const presetData = preset.studentCounts[level];
          if (presetData) {
            newCounts[level] = presetData;
          }
        }
        return { studentCounts: newCounts };
      });
    },

    hydrate: (record: SchoolRecord) => set({
      activeSchoolId: record.id ?? null,
      schoolName: record.name,
      levels: record.levels,
      // Phase 27 R3 + R4 — sales-context fields (default to null when missing on legacy rows)
      customerType: record.customerType ?? null,
      schoolType: record.schoolType ?? null,
      customSchoolType: record.customSchoolType ?? null,
      growthTrajectory: record.growthTrajectory ?? null,
      studentCounts: record.studentCounts,
      // Phase 27 R5 — currentToolUsage map (default to empty if legacy row)
      currentToolUsage: record.currentToolUsage ?? {},
      selectedModules: record.selectedModules,
      moduleSetups: record.moduleSetups,
      scenario: record.scenario,
      currentStep: record.completedSteps.length > 0
        ? Math.min(Math.max(...record.completedSteps) + 1, 4)
        : 0,
      // CRM-lite fields
      pipelineStatus: record.pipelineStatus ?? 'prospect',
      contacts: record.contacts ?? [],
      conversations: record.conversations ?? [],
      actions: record.actions ?? [],
      systemEvents: record.systemEvents ?? [],
      region: record.region ?? '',
      tags: record.tags ?? [],
      viewPreference: record.viewPreference ?? 'compact',
      lostDealInfo: record.lostDealInfo,
    }),

    clear: () => set(initialState),

    reset: () => set(initialState),
  }),
);
