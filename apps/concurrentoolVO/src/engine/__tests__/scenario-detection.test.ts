import { describe, it, expect } from 'vitest';
import { detectScenario } from '../scenario-detection';
import { calculateComparison } from '../price-comparison';
import type { ModuleCurrentSetup, Scenario } from '../../models/school';
import { SCENARIO_LABELS } from '../../models/school';
import { getOldPlatformPrice } from '../../data/cito-migration-prices';

describe('detectScenario', () => {
  it('returns scenario B when all modules are on cito-oud', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('B');
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasCompetitorModules).toBe(false);
    expect(result.hasUpsellModules).toBe(false);
    expect(result.isMixed).toBe(false);
    expect(result.migrationModuleIds).toEqual(['rekenwiskunde', 'nederlands']);
  });

  it('returns scenario A when modules are on competitors', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2 },
      { moduleId: 'nederlands', currentProvider: 'jij', pricePerStudent: 4.8 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.competitorModuleIds).toEqual(['rekenwiskunde', 'nederlands']);
  });

  it('returns scenario A with isMixed when both cito-oud and competitor modules exist', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'dia', pricePerStudent: 3.5 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.isMixed).toBe(true);
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.migrationModuleIds).toEqual(['rekenwiskunde']);
    expect(result.competitorModuleIds).toEqual(['sociaal-emotioneel']);
  });

  it('returns scenario A with upsell when modules have geen provider', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'dia', pricePerStudent: 5.2 },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasUpsellModules).toBe(true);
    expect(result.upsellModuleIds).toEqual(['sociaal-emotioneel']);
  });

  it('returns scenario A when cito-oud mixed with upsell (geen)', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'geen', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.isMixed).toBe(true);
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasUpsellModules).toBe(true);
  });

  it('ignores cito-nieuw modules (already on new platform)', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-nieuw', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'dia', pricePerStudent: 5.2 },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.migrationModuleIds).toEqual([]);
  });

  it('handles empty module setups', () => {
    const result = detectScenario([]);

    expect(result.recommended).toBe('A');
    expect(result.hasMigrationModules).toBe(false);
    expect(result.hasCompetitorModules).toBe(false);
    expect(result.hasUpsellModules).toBe(false);
    expect(result.isMixed).toBe(false);
  });

  it('classifies saqi and overig as competitor providers', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'sociaal-emotioneel', currentProvider: 'saqi', pricePerStudent: 3.0 },
      { moduleId: 'rekenwiskunde', currentProvider: 'overig', pricePerStudent: 4.0, customProviderName: 'Andere' },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('A');
    expect(result.hasCompetitorModules).toBe(true);
    expect(result.competitorModuleIds).toEqual(['sociaal-emotioneel', 'rekenwiskunde']);
  });
});

describe('Scenario C type system', () => {
  it('accepts C as a valid Scenario value', () => {
    const scenario: Scenario = 'C';
    expect(scenario).toBe('C');
  });

  it('has Dutch label for Scenario C in SCENARIO_LABELS', () => {
    expect(SCENARIO_LABELS['C']).toBeDefined();
    expect(SCENARIO_LABELS['C'].title).toBe('Huidig Cito vs. concurrentie');
    expect(SCENARIO_LABELS['C'].description).toContain('retentie-perspectief');
  });
});

describe('getOldPlatformPrice', () => {
  it('returns 7.07 for rekenwiskunde', () => {
    expect(getOldPlatformPrice('rekenwiskunde')).toBe(7.07);
  });

  it('returns 7.07 for engels', () => {
    expect(getOldPlatformPrice('engels')).toBe(7.07);
  });

  it('returns 1.60 for taalverzorging', () => {
    expect(getOldPlatformPrice('taalverzorging')).toBe(1.60);
  });

  it('returns null for leer-werkhouding (missing module)', () => {
    expect(getOldPlatformPrice('leer-werkhouding')).toBeNull();
  });

  it('returns null for nonexistent module', () => {
    expect(getOldPlatformPrice('nonexistent')).toBeNull();
  });
});

describe('Scenario C detection', () => {
  it('returns recommended C when forRetentionComparison is true and all modules are cito-oud', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
    ];

    const result = detectScenario(setups, { forRetentionComparison: true });

    expect(result.recommended).toBe('C');
    expect(result.hasMigrationModules).toBe(true);
    expect(result.hasCompetitorModules).toBe(false);
  });

  it('still returns recommended B by default when all modules are cito-oud (backward compat)', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'nederlands', currentProvider: 'cito-oud', pricePerStudent: null },
    ];

    const result = detectScenario(setups);

    expect(result.recommended).toBe('B');
  });

  it('returns recommended A when modules are mixed even with forRetentionComparison', () => {
    const setups: ModuleCurrentSetup[] = [
      { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
      { moduleId: 'sociaal-emotioneel', currentProvider: 'dia', pricePerStudent: 3.5 },
    ];

    const result = detectScenario(setups, { forRetentionComparison: true });

    expect(result.recommended).toBe('A');
  });
});

describe('calculateComparison Scenario C', () => {
  const studentCounts = {
    havo: { 3: 100 },
  };

  it('uses old-platform prices for cito when scenarioType is C', () => {
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      { scenarioType: 'C' as Scenario },
    );

    const citoModule = result.modules[0]?.providers.cito;
    expect(citoModule).not.toBeNull();
    // Old platform price for rekenwiskunde is 7.07
    expect(citoModule!.pricePerStudent).toBe(7.07);
    expect(citoModule!.totalCost).toBe(7.07 * 100);
  });

  it('uses new-platform prices for cito when no scenarioType (backward compat)', () => {
    const result = calculateComparison(
      ['rekenwiskunde'],
      studentCounts,
      {},
    );

    const citoModule = result.modules[0]?.providers.cito;
    expect(citoModule).not.toBeNull();
    // Without scenarioType C, should NOT be 7.07 (old platform price)
    // The new platform price differs from 7.07
    expect(citoModule!.pricePerStudent).not.toBe(7.07);
  });
});
