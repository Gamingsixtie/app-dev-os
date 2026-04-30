/**
 * Zustand store for the AI comparison wizard.
 * Manages 3-step wizard state independently from usePriceComparisonStore.
 * applyToTable() writes variant selections and Cito bundle type to the comparison store.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ModuleVariantSelection,
  WizardAdviceResult,
  ExtraContextInput,
  WizardScenario,
  ExtractedVariantResult,
  WizardNarrativeContext,
} from './types';
import type { AnalysisResult } from '@/lib/ai-analysis';
import { usePriceComparisonStore } from '../store';
import { useSchoolProfileStore } from '@/features/school-profile/store';
import type { ProviderKey } from '@/engine/price-comparison';

interface WizardState {
  // Navigation
  currentStep: 0 | 1 | 2;
  isCollapsed: boolean;
  hasCompletedOnce: boolean;

  // Step 1 data
  conversationNotes: string;
  extractionResult: ExtractedVariantResult | null;
  isExtracting: boolean;

  // Step 2 data
  variantSelections: ModuleVariantSelection[];

  // Step 3 data
  aiAdvice: WizardAdviceResult | null;
  adjustedSelections: ModuleVariantSelection[];
  extraContext: ExtraContextInput;
  isGeneratingAdvice: boolean;
  streamingText: string;

  // Scenario
  scenario: WizardScenario;

  // Narrative context for progressive AI enrichment (not persisted)
  wizardNarrativeContext: WizardNarrativeContext | null;

  // Actions
  setStep: (step: 0 | 1 | 2) => void;
  setConversationNotes: (notes: string) => void;
  setExtractionResult: (result: ExtractedVariantResult | null) => void;
  setIsExtracting: (v: boolean) => void;
  setVariantSelections: (selections: ModuleVariantSelection[]) => void;
  updateVariantSelection: (moduleId: string, update: Partial<ModuleVariantSelection>) => void;
  setAiAdvice: (advice: WizardAdviceResult | null) => void;
  setAdjustedSelections: (selections: ModuleVariantSelection[]) => void;
  setExtraContext: (ctx: Partial<ExtraContextInput>) => void;
  setIsGeneratingAdvice: (v: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;
  setScenario: (s: WizardScenario) => void;
  setWizardNarrativeContext: (ctx: WizardNarrativeContext | null) => void;
  collapse: () => void;
  expand: () => void;
  resetWizard: () => void;

  // Cached AI analysis result (persisted so it survives navigation/reload)
  cachedAnalysisResult: AnalysisResult | null;
  setCachedAnalysisResult: (result: AnalysisResult | null) => void;

  // Auto-trigger analysis after wizard apply
  shouldAutoTriggerAnalysis: boolean;
  clearAutoTrigger: () => void;

  // D-24: Explicit apply to table
  applyToTable: () => void;
}

const DEFAULT_EXTRA_CONTEXT: ExtraContextInput = {
  korting: '',
  dmuFocus: '',
  bijzonderheden: '',
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      isCollapsed: false,
      hasCompletedOnce: false,

      conversationNotes: '',
      extractionResult: null,
      isExtracting: false,

      variantSelections: [],

      aiAdvice: null,
      adjustedSelections: [],
      extraContext: { ...DEFAULT_EXTRA_CONTEXT },
      isGeneratingAdvice: false,
      streamingText: '',

      scenario: 'deels-concurrent',

      wizardNarrativeContext: null,

      shouldAutoTriggerAnalysis: false,

      cachedAnalysisResult: null,
      setCachedAnalysisResult: (result) => set({ cachedAnalysisResult: result }),

      // Actions
      setStep: (step) => set({ currentStep: step }),

      setConversationNotes: (notes) => set({ conversationNotes: notes }),

      setExtractionResult: (result) => set({ extractionResult: result }),

      setIsExtracting: (v) => set({ isExtracting: v }),

      setVariantSelections: (selections) => set({ variantSelections: selections }),

      updateVariantSelection: (moduleId, update) =>
        set((state) => ({
          variantSelections: state.variantSelections.map((s) =>
            s.moduleId === moduleId ? { ...s, ...update } : s,
          ),
        })),

      setAiAdvice: (advice) => set({ aiAdvice: advice }),

      setAdjustedSelections: (selections) => set({ adjustedSelections: selections }),

      setExtraContext: (ctx) =>
        set((state) => ({
          extraContext: { ...state.extraContext, ...ctx },
        })),

      setIsGeneratingAdvice: (v) => set({ isGeneratingAdvice: v }),

      setStreamingText: (text) => set({ streamingText: text }),

      appendStreamingText: (text) =>
        set((state) => ({ streamingText: state.streamingText + text })),

      setScenario: (s) => set({ scenario: s }),

      setWizardNarrativeContext: (ctx) => set({ wizardNarrativeContext: ctx }),

      clearAutoTrigger: () => set({ shouldAutoTriggerAnalysis: false }),

      collapse: () => set({ isCollapsed: true }),

      expand: () => set({ isCollapsed: false }),

      resetWizard: () => {
        const { conversationNotes, variantSelections } = get();
        set({
          currentStep: 0,
          isCollapsed: false,
          extractionResult: null,
          isExtracting: false,
          // Preserve conversationNotes and variantSelections as defaults for re-run
          conversationNotes,
          variantSelections,
          aiAdvice: null,
          adjustedSelections: [],
          extraContext: { ...DEFAULT_EXTRA_CONTEXT },
          isGeneratingAdvice: false,
          streamingText: '',
        });
      },

      applyToTable: () => {
        const state = get();
        const selections =
          state.adjustedSelections.length > 0
            ? state.adjustedSelections
            : state.variantSelections;

        // Extract unique providers from selections (filter out 'geen')
        const providerSet = new Set<ProviderKey>();
        for (const sel of selections) {
          if (sel.provider !== 'geen') {
            providerSet.add(sel.provider as ProviderKey);
          }
        }

        // Build visible providers list with 'cito' always first
        const providers: ProviderKey[] = ['cito', ...providerSet];

        // Build competitorModuleIds: which modules use which competitor
        const competitorModuleIds: Partial<Record<ProviderKey, string[]>> = {};
        for (const sel of selections) {
          if (sel.provider !== 'geen') {
            const key = sel.provider as ProviderKey;
            if (!competitorModuleIds[key]) competitorModuleIds[key] = [];
            competitorModuleIds[key]!.push(sel.moduleId);
          }
        }

        // Determine forceDiaPackageId from variant selections
        // Find the first DIA selection with a variantId (package choice)
        const diaSelections = selections.filter((s) => s.provider === 'dia');
        let forceDiaPackageId: string | null | undefined;
        if (diaSelections.length > 0) {
          const withVariant = diaSelections.find((s) => s.variantId);
          forceDiaPackageId = withVariant?.variantId ?? null; // null = individual pricing
          // Map the 'dia-individual' sentinel (explicit individual choice in grouped mode) to null
          if (forceDiaPackageId === 'dia-individual') {
            forceDiaPackageId = null;
          }
        }
        // undefined = no DIA selections, engine uses default behavior

        try {
          // Apply all wizard config atomically — single set() call avoids
          // React 18 batching issues where intermediate states cause stale renders.
          usePriceComparisonStore.getState().applyWizardConfig({
            competitorModuleIds,
            forceDiaPackageId,
            citoBundleType: state.aiAdvice?.aanbevolenCitoBundel || undefined,
            visibleProviders: providers,
          });
        } catch (err) {
          // Fallback: re-initialize comparison store if applyWizardConfig fails
          console.error('[wizard] applyWizardConfig failed, falling back to initialize:', err);
          try {
            usePriceComparisonStore.getState().initialize();
          } catch {
            // Ensure wizard always collapses even if both paths fail
          }
        }

        // Scenario C: write scenario to school profile store
        if (state.scenario === 'alles-oud-cito-concurrent') {
          const schoolStore = useSchoolProfileStore.getState();
          schoolStore.setScenario('C');
        }

        // Mark wizard as completed and collapsed, trigger analysis
        set({
          isCollapsed: true,
          hasCompletedOnce: true,
          shouldAutoTriggerAnalysis: true,
        });
      },
    }),
    {
      name: 'wizard-store-v1',
      partialize: (state) => ({
        conversationNotes: state.conversationNotes,
        variantSelections: state.variantSelections,
        extraContext: state.extraContext,
        hasCompletedOnce: state.hasCompletedOnce,
        isCollapsed: state.isCollapsed,
        scenario: state.scenario,
        cachedAnalysisResult: state.cachedAnalysisResult,
      }),
    },
  ),
);
