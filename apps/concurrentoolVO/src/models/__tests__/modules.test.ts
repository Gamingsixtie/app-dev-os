import { describe, it, expect } from 'vitest';
import { MODULE_CATALOG } from '../modules';

describe('MODULE_CATALOG', () => {
  it('has exactly 10 entries', () => {
    expect(MODULE_CATALOG).toHaveLength(10);
  });

  const expectedIds = [
    'rekenwiskunde',
    'nederlands',
    'engels',
    'taalverzorging',
    'sociaal-emotioneel',
    'cognitieve-capaciteiten',
    'leer-werkhouding',
    'frans',
    'duits',
    'spaans',
  ];

  it('contains all 10 module IDs', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    for (const id of expectedIds) {
      expect(ids).toContain(id);
    }
  });

  it('has no duplicate IDs', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has non-empty availableFrom', () => {
    for (const mod of MODULE_CATALOG) {
      expect(mod.availableFrom.length, `${mod.id} should have availableFrom`).toBeGreaterThan(0);
    }
  });

  it('every entry has aliases array', () => {
    for (const mod of MODULE_CATALOG) {
      expect(Array.isArray(mod.aliases), `${mod.id} should have aliases array`).toBe(true);
    }
  });

  it('original 6 modules retain their category values', () => {
    const find = (id: string) => MODULE_CATALOG.find((m) => m.id === id)!;

    // First 3 = leerlingvolgsysteem
    expect(find('rekenwiskunde').category).toBe('leerlingvolgsysteem');
    expect(find('nederlands').category).toBe('leerlingvolgsysteem');
    expect(find('engels').category).toBe('leerlingvolgsysteem');

    // Rest = overige-instrumenten
    expect(find('taalverzorging').category).toBe('overige-instrumenten');
    expect(find('sociaal-emotioneel').category).toBe('overige-instrumenten');
    expect(find('cognitieve-capaciteiten').category).toBe('overige-instrumenten');
  });

  it('original 6 modules retain separateLicense values', () => {
    const find = (id: string) => MODULE_CATALOG.find((m) => m.id === id)!;

    expect(find('rekenwiskunde').separateLicense).toBe(false);
    expect(find('nederlands').separateLicense).toBe(false);
    expect(find('engels').separateLicense).toBe(false);
    expect(find('taalverzorging').separateLicense).toBe(false);
    expect(find('sociaal-emotioneel').separateLicense).toBe(false);
    expect(find('cognitieve-capaciteiten').separateLicense).toBe(true);
  });

  it('new modules leer-werkhouding, frans, duits, spaans exist', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    expect(ids).toContain('leer-werkhouding');
    expect(ids).toContain('frans');
    expect(ids).toContain('duits');
    expect(ids).toContain('spaans');
  });
});
