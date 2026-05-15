/**
 * Phase 27 R6 — module catalog extensions.
 *
 * Verifies that Burgerschap and Digitale geletterdheid land as Cito-only
 * modules in MODULE_CATALOG with the right aliases (incl. AI-geletterdheid),
 * sit in the new 'extra-modules' category, and stay niveau-independent so
 * all 5 VO niveaus (VMBO B/K/GT, HAVO, VWO) automatically pick them up.
 *
 * Niveau-onafhankelijkheid: the data model has no per-module level
 * restriction. The wizard renders modules from MODULE_CATALOG without
 * filtering on `studentCounts` level. So "available on all niveaus" is
 * verified indirectly: the entries simply exist + no level-restriction
 * field is present on ModuleDefinition.
 */
import { describe, it, expect } from 'vitest';
import {
  MODULE_CATALOG,
  MODULE_CATEGORIES,
  type ModuleDefinition,
} from '@/models/modules';

const findModule = (id: string): ModuleDefinition => {
  const mod = MODULE_CATALOG.find((m) => m.id === id);
  if (!mod) throw new Error(`Module ${id} missing from MODULE_CATALOG`);
  return mod;
};

describe('MODULE_CATALOG Phase 27 extensions (R6)', () => {
  it('contains a burgerschap module entry', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    expect(ids).toContain('burgerschap');
  });

  it('contains a digitale-geletterdheid module entry', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    expect(ids).toContain('digitale-geletterdheid');
  });

  it('lists Cito as the only provider for burgerschap and digitale-geletterdheid', () => {
    expect(findModule('burgerschap').availableFrom).toEqual(['cito']);
    expect(findModule('digitale-geletterdheid').availableFrom).toEqual(['cito']);
  });

  it('registers AI-geletterdheid as an alias on the digitale-geletterdheid module', () => {
    expect(findModule('digitale-geletterdheid').aliases).toContain('AI-geletterdheid');
  });

  it('registers burgerschapsonderwijs as an alias on the burgerschap module', () => {
    expect(findModule('burgerschap').aliases).toContain('burgerschapsonderwijs');
  });

  it('places both new modules in the extra-modules category', () => {
    expect(findModule('burgerschap').category).toBe('extra-modules');
    expect(findModule('digitale-geletterdheid').category).toBe('extra-modules');
    expect(MODULE_CATEGORIES['extra-modules']).toBe('Extra Modules');
  });

  it('exposes burgerschap + digitale-geletterdheid on all onderwijsniveaus (no per-level restriction)', () => {
    // Niveau-onafhankelijk: the model has no `levels` field, so modules are
    // niveau-agnostic by construction. Guarding via shape inspection.
    const burgerschap = findModule('burgerschap');
    const digigel = findModule('digitale-geletterdheid');
    expect(burgerschap).not.toHaveProperty('levels');
    expect(digigel).not.toHaveProperty('levels');
  });

  it('keeps the existing modules unchanged (regression guard)', () => {
    // Original 10 modules retain their categories and providers.
    expect(findModule('rekenwiskunde').category).toBe('leerlingvolgsysteem');
    expect(findModule('nederlands').category).toBe('leerlingvolgsysteem');
    expect(findModule('engels').category).toBe('leerlingvolgsysteem');
    expect(findModule('taalverzorging').category).toBe('overige-instrumenten');
    expect(findModule('sociaal-emotioneel').category).toBe('overige-instrumenten');
    expect(findModule('cognitieve-capaciteiten').category).toBe('overige-instrumenten');
    expect(findModule('leer-werkhouding').category).toBe('overige-instrumenten');
    expect(findModule('frans').category).toBe('overige-instrumenten');
    expect(findModule('duits').category).toBe('overige-instrumenten');
    expect(findModule('spaans').category).toBe('overige-instrumenten');

    // Catalog now has 12 entries (10 original + 2 R6 additions).
    expect(MODULE_CATALOG).toHaveLength(12);
  });
});
