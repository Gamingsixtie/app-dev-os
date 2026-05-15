import { describe, it, expect } from 'vitest';
import {
  BASISVAARDIGHEDEN_MODULE_IDS,
  SOCIAAL_EMOTIONEEL_MODULE_IDS,
  EXECUTIEVE_MODULE_IDS,
  CONCURRENTIE_CATEGORY_LABELS,
  getModuleCategory,
  moduleInCategory,
} from '../constants/cito-module-grouping';

describe('module-category-mapping', () => {
  it('BASISVAARDIGHEDEN_MODULE_IDS bevat de kern-skills (Cito + alternatieven)', () => {
    expect(BASISVAARDIGHEDEN_MODULE_IDS.has('rekenwiskunde')).toBe(true);
    expect(BASISVAARDIGHEDEN_MODULE_IDS.has('nederlands')).toBe(true);
    expect(BASISVAARDIGHEDEN_MODULE_IDS.has('engels')).toBe(true);
    expect(BASISVAARDIGHEDEN_MODULE_IDS.has('taalverzorging')).toBe(true);
  });

  it('SOCIAAL_EMOTIONEEL_MODULE_IDS bevat sociaal-emotioneel', () => {
    expect(SOCIAAL_EMOTIONEEL_MODULE_IDS.has('sociaal-emotioneel')).toBe(true);
  });

  it('EXECUTIEVE_MODULE_IDS bevat leer-werkhouding + cognitieve-capaciteiten', () => {
    expect(EXECUTIEVE_MODULE_IDS.has('leer-werkhouding')).toBe(true);
    expect(EXECUTIEVE_MODULE_IDS.has('cognitieve-capaciteiten')).toBe(true);
  });

  it('categorieën overlappen niet onderling', () => {
    for (const id of SOCIAAL_EMOTIONEEL_MODULE_IDS) {
      expect(EXECUTIEVE_MODULE_IDS.has(id)).toBe(false);
      expect(BASISVAARDIGHEDEN_MODULE_IDS.has(id)).toBe(false);
    }
    for (const id of EXECUTIEVE_MODULE_IDS) {
      expect(BASISVAARDIGHEDEN_MODULE_IDS.has(id)).toBe(false);
    }
  });

  it('getModuleCategory classificeert bekende modules correct', () => {
    expect(getModuleCategory('rekenwiskunde')).toBe('basisvaardigheden');
    expect(getModuleCategory('nederlands')).toBe('basisvaardigheden');
    expect(getModuleCategory('taalverzorging')).toBe('basisvaardigheden');
    expect(getModuleCategory('sociaal-emotioneel')).toBe('sociaal-emotioneel');
    expect(getModuleCategory('leer-werkhouding')).toBe('executieve');
    expect(getModuleCategory('cognitieve-capaciteiten')).toBe('executieve');
  });

  it('getModuleCategory valt terug op "overig" voor onbekende module-ids', () => {
    expect(getModuleCategory('iets-nieuws')).toBe('overig');
    expect(getModuleCategory('duits')).toBe('overig');
    expect(getModuleCategory('spaans')).toBe('overig');
  });

  it('moduleInCategory(x, "sociaal-emotioneel") werkt', () => {
    expect(moduleInCategory('sociaal-emotioneel', 'sociaal-emotioneel')).toBe(true);
    expect(moduleInCategory('rekenwiskunde', 'sociaal-emotioneel')).toBe(false);
  });

  it('moduleInCategory(x, "executieve") werkt', () => {
    expect(moduleInCategory('leer-werkhouding', 'executieve')).toBe(true);
    expect(moduleInCategory('cognitieve-capaciteiten', 'executieve')).toBe(true);
    expect(moduleInCategory('nederlands', 'executieve')).toBe(false);
  });

  it('moduleInCategory(x, "overig") is true voor modules buiten alle bekende sets', () => {
    expect(moduleInCategory('duits', 'overig')).toBe(true);
    expect(moduleInCategory('frans', 'overig')).toBe(true);
    expect(moduleInCategory('rekenwiskunde', 'overig')).toBe(false);
    expect(moduleInCategory('sociaal-emotioneel', 'overig')).toBe(false);
    expect(moduleInCategory('leer-werkhouding', 'overig')).toBe(false);
  });

  it('CONCURRENTIE_CATEGORY_LABELS heeft NL-labels voor alle 3 categorieën', () => {
    expect(CONCURRENTIE_CATEGORY_LABELS['sociaal-emotioneel']).toBe('Sociaal-emotioneel');
    expect(CONCURRENTIE_CATEGORY_LABELS.executieve).toBe('Executieve functies');
    expect(CONCURRENTIE_CATEGORY_LABELS.overig).toBe('Overig');
  });
});
