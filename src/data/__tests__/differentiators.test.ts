import { describe, it, expect } from 'vitest';
import { MODULE_CATALOG } from '../../models/modules';
import { MODULE_DIFFERENTIATORS } from '../differentiators';

describe('MODULE_DIFFERENTIATORS', () => {
  it('every MODULE_CATALOG entry has a matching MODULE_DIFFERENTIATORS entry', () => {
    for (const mod of MODULE_CATALOG) {
      const diff = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === mod.id);
      expect(diff, `Missing differentiator for module: ${mod.id}`).toBeDefined();
    }
  });

  it('every differentiator entry has cito, dia, jij, saqi arrays', () => {
    for (const diff of MODULE_DIFFERENTIATORS) {
      expect(Array.isArray(diff.cito), `${diff.moduleId}.cito should be array`).toBe(true);
      expect(Array.isArray(diff.dia), `${diff.moduleId}.dia should be array`).toBe(true);
      expect(Array.isArray(diff.jij), `${diff.moduleId}.jij should be array`).toBe(true);
      expect(Array.isArray(diff.saqi), `${diff.moduleId}.saqi should be array`).toBe(true);
    }
  });

  it.each(['rekenwiskunde', 'nederlands', 'engels'])(
    'DIA differentiators for %s mention "Magister" or "gratis"',
    (moduleId) => {
      const diff = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === moduleId)!;
      const hasMatch = diff.dia.some(
        (text) => /magister/i.test(text) || /gratis/i.test(text),
      );
      expect(hasMatch, `DIA ${moduleId} should mention Magister or gratis`).toBe(true);
    },
  );

  it.each(['rekenwiskunde', 'nederlands', 'engels'])(
    'JIJ differentiators for %s mention "kost extra" or "€195-€500"',
    (moduleId) => {
      const diff = MODULE_DIFFERENTIATORS.find((d) => d.moduleId === moduleId)!;
      const hasMatch = diff.jij.some(
        (text) => /kost extra/i.test(text) || /€195.*€500/.test(text),
      );
      expect(hasMatch, `JIJ ${moduleId} should mention kost extra or €195-€500`).toBe(true);
    },
  );

  it('no empty arrays for modules where a provider is active', () => {
    const providerKeys = ['cito', 'dia', 'jij', 'saqi'] as const;

    for (const diff of MODULE_DIFFERENTIATORS) {
      // A module has at least one provider with differentiators
      const activeProviders = providerKeys.filter((p) => diff[p].length > 0);

      // For each active provider, the array must not be empty (tautological, but ensures
      // that every string inside is non-empty / no accidental empty strings)
      for (const provider of activeProviders) {
        for (const text of diff[provider]) {
          expect(text.trim().length, `${diff.moduleId}.${provider} has empty string`).toBeGreaterThan(0);
        }
      }
    }
  });
});
