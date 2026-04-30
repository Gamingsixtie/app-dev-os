import { describe, it, expect } from 'vitest';
import { detectScenario } from '../scenario-detection';
import type { ModuleCurrentSetup } from '@/models/school';
import type { WizardScenario } from '../types';

describe('detectScenario', () => {
  it('returns "deels-concurrent" when moduleSetups has mix of cito and dia/jij providers', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-nieuw', pricePerStudent: null },
      { moduleId: 'engels', currentProvider: 'jij', pricePerStudent: null },
    ];
    expect(detectScenario(setups)).toBe('deels-concurrent');
  });

  it('returns "alles-oud-cito" when all moduleSetups have currentProvider "cito-oud"', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'engels', currentProvider: 'cito-oud', pricePerStudent: null },
    ];
    expect(detectScenario(setups)).toBe('alles-oud-cito');
  });

  it('returns "alles-nieuw-cito" when all moduleSetups have currentProvider "cito-nieuw"', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-nieuw', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-nieuw', pricePerStudent: null },
    ];
    expect(detectScenario(setups)).toBe('alles-nieuw-cito');
  });

  it('returns "deels-concurrent" when moduleSetups is empty', () => {
    expect(detectScenario([])).toBe('deels-concurrent');
  });

  it('returns "deels-concurrent" when some modules have "geen" provider', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'geen', pricePerStudent: null },
    ];
    expect(detectScenario(setups)).toBe('deels-concurrent');
  });

  it('returns "deels-concurrent" when mix of cito-oud and cito-nieuw', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-nieuw', pricePerStudent: null },
    ];
    expect(detectScenario(setups)).toBe('deels-concurrent');
  });
});

describe('Scenario C types', () => {
  it('accepts "alles-oud-cito-concurrent" as a valid WizardScenario value', () => {
    const scenario: WizardScenario = 'alles-oud-cito-concurrent';
    expect(scenario).toBe('alles-oud-cito-concurrent');
  });
});
