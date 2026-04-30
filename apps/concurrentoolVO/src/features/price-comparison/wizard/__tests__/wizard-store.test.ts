import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWizardStore } from '../wizard-store';
import type { ModuleVariantSelection } from '../types';

// Mock the comparison store with current applyWizardConfig API
const mockApplyWizardConfig = vi.fn();
const mockInitialize = vi.fn();

vi.mock('../../store', () => ({
  usePriceComparisonStore: {
    getState: () => ({
      applyWizardConfig: mockApplyWizardConfig,
      initialize: mockInitialize,
    }),
  },
}));

// Mock school profile store for scenario C tests
vi.mock('@/features/school-profile/store', () => ({
  useSchoolProfileStore: {
    getState: () => ({
      setScenario: vi.fn(),
    }),
  },
}));

describe('useWizardStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useWizardStore.setState({
      currentStep: 0,
      isCollapsed: false,
      hasCompletedOnce: false,
      conversationNotes: '',
      extractionResult: null,
      isExtracting: false,
      variantSelections: [],
      aiAdvice: null,
      adjustedSelections: [],
      extraContext: { korting: '', dmuFocus: '', bijzonderheden: '' },
      isGeneratingAdvice: false,
      streamingText: '',
      scenario: 'deels-concurrent',
      shouldAutoTriggerAnalysis: false,
      wizardNarrativeContext: null,
    });
    vi.clearAllMocks();
  });

  it('has initial state with currentStep 0 and isCollapsed false', () => {
    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.isCollapsed).toBe(false);
    expect(state.hasCompletedOnce).toBe(false);
  });

  it('setStep changes currentStep', () => {
    useWizardStore.getState().setStep(1);
    expect(useWizardStore.getState().currentStep).toBe(1);

    useWizardStore.getState().setStep(2);
    expect(useWizardStore.getState().currentStep).toBe(2);
  });

  it('setVariantSelections stores selections', () => {
    const selections: ModuleVariantSelection[] = [
      { moduleId: 'rekenwiskunde', provider: 'dia', variantId: 'pakket-compleet', confidence: 'high' },
      { moduleId: 'engels', provider: 'jij', variantId: '3', confidence: 'low' },
    ];
    useWizardStore.getState().setVariantSelections(selections);
    expect(useWizardStore.getState().variantSelections).toEqual(selections);
  });

  it('updateVariantSelection updates single module', () => {
    const selections: ModuleVariantSelection[] = [
      { moduleId: 'rekenwiskunde', provider: 'dia', variantId: 'pakket-compleet', confidence: 'high' },
      { moduleId: 'engels', provider: 'jij', variantId: '3', confidence: 'low' },
    ];
    useWizardStore.getState().setVariantSelections(selections);
    useWizardStore.getState().updateVariantSelection('engels', { provider: 'dia', variantId: 'pakket-en', confidence: 'high' });

    const updated = useWizardStore.getState().variantSelections;
    expect(updated[0].provider).toBe('dia');
    expect(updated[1].provider).toBe('dia');
    expect(updated[1].variantId).toBe('pakket-en');
    expect(updated[1].confidence).toBe('high');
  });

  it('applyToTable calls applyWizardConfig with correct providers and bundle', () => {
    useWizardStore.setState({
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: 'pakket-ne', confidence: 'high' },
        { moduleId: 'engels', provider: 'jij', variantId: '2', confidence: 'low' },
      ],
      aiAdvice: {
        samenvatting: 'Test samenvatting',
        matchingUitleg: 'Test uitleg',
        aanbevolenCitoBundel: 'basis',
        adviezen: [],
      },
      adjustedSelections: [],
    });

    useWizardStore.getState().applyToTable();

    expect(mockApplyWizardConfig).toHaveBeenCalledWith({
      competitorModuleIds: {
        dia: ['rekenwiskunde'],
        jij: ['engels'],
      },
      forceDiaPackageId: 'pakket-ne',
      citoBundleType: 'basis',
      visibleProviders: ['cito', 'dia', 'jij'],
    });
  });

  it('applyToTable sets isCollapsed true and hasCompletedOnce true', () => {
    useWizardStore.setState({
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: null, confidence: 'unknown' },
      ],
      adjustedSelections: [],
      aiAdvice: null,
    });

    useWizardStore.getState().applyToTable();

    expect(useWizardStore.getState().isCollapsed).toBe(true);
    expect(useWizardStore.getState().hasCompletedOnce).toBe(true);
    expect(useWizardStore.getState().shouldAutoTriggerAnalysis).toBe(true);
  });

  it('applyToTable passes undefined citoBundleType when no AI advice', () => {
    useWizardStore.setState({
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: null, confidence: 'unknown' },
      ],
      adjustedSelections: [],
      aiAdvice: null,
    });

    useWizardStore.getState().applyToTable();

    expect(mockApplyWizardConfig).toHaveBeenCalledWith(
      expect.objectContaining({ citoBundleType: undefined }),
    );
  });

  it('applyToTable still collapses when applyWizardConfig throws', () => {
    mockApplyWizardConfig.mockImplementation(() => {
      throw new Error('calculation failed');
    });

    useWizardStore.setState({
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: null, confidence: 'unknown' },
      ],
      adjustedSelections: [],
      aiAdvice: null,
    });

    useWizardStore.getState().applyToTable();

    // Should still collapse even after error
    expect(useWizardStore.getState().isCollapsed).toBe(true);
    expect(useWizardStore.getState().hasCompletedOnce).toBe(true);
    // Fallback: initialize should be called
    expect(mockInitialize).toHaveBeenCalled();
  });

  it('resetWizard keeps conversationNotes but resets currentStep to 0', () => {
    useWizardStore.setState({
      currentStep: 2,
      conversationNotes: 'School wil overstappen naar DIA pakket compleet',
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: 'pakket-compleet', confidence: 'high' },
      ],
      aiAdvice: {
        samenvatting: 'Test',
        matchingUitleg: 'Test',
        aanbevolenCitoBundel: 'basis',
        adviezen: [],
      },
      streamingText: 'some streaming text',
    });

    useWizardStore.getState().resetWizard();

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.conversationNotes).toBe('School wil overstappen naar DIA pakket compleet');
    expect(state.variantSelections).toHaveLength(1); // preserved
    expect(state.aiAdvice).toBeNull(); // reset
    expect(state.streamingText).toBe(''); // reset
  });

  it('applyToTable uses adjustedSelections over variantSelections when available', () => {
    useWizardStore.setState({
      variantSelections: [
        { moduleId: 'rekenwiskunde', provider: 'dia', variantId: null, confidence: 'unknown' },
      ],
      adjustedSelections: [
        { moduleId: 'rekenwiskunde', provider: 'jij', variantId: '1', confidence: 'high' },
      ],
      aiAdvice: null,
    });

    useWizardStore.getState().applyToTable();

    expect(mockApplyWizardConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        visibleProviders: ['cito', 'jij'],
        competitorModuleIds: { jij: ['rekenwiskunde'] },
      }),
    );
  });
});
