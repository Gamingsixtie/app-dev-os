import { describe, it, expect } from 'vitest';
import { applyCitoBundlePrices, applyContractPeriodToResult } from '../cito-bundles';
import type { PriceRecord } from '../../models/pricing';
import type { ComparisonResult } from '../price-comparison';
import { CITO_BUNDLES, getCitoBundle, getContractPeriodConfig } from '../../data/cito-bundles';

const makePriceRecord = (
  moduleId: string,
  provider: 'cito' | 'dia' | 'jij',
  amount: number,
): PriceRecord => ({
  moduleId,
  provider,
  amountPerStudent: amount,
  source: 'publication',
  sourceLabel: 'Test',
  verifiedAt: new Date('2026-01-01'),
  isPublicationPrice: true,
});

const basePrices: PriceRecord[] = [
  makePriceRecord('rekenwiskunde', 'cito', 4.5),
  makePriceRecord('rekenwiskunde', 'dia', 3.36),
  makePriceRecord('nederlands', 'cito', 4.5),
  makePriceRecord('nederlands', 'dia', 3.36),
  makePriceRecord('engels', 'cito', 4.5),
  makePriceRecord('engels', 'dia', 5.84),
  makePriceRecord('taalverzorging', 'cito', 1.6),
  makePriceRecord('sociaal-emotioneel', 'cito', 3.0),
  makePriceRecord('leer-werkhouding', 'cito', 3.0),
  makePriceRecord('cognitieve-capaciteiten', 'cito', 19.9),
];

const allModules = [
  'rekenwiskunde', 'nederlands', 'engels',
  'taalverzorging', 'sociaal-emotioneel', 'leer-werkhouding', 'cognitieve-capaciteiten',
];

describe('applyCitoBundlePrices', () => {
  it('returns unchanged prices for individual bundle', () => {
    const individual = getCitoBundle('individual');
    const result = applyCitoBundlePrices(basePrices, individual, allModules);
    expect(result).toBe(basePrices); // same reference
  });

  it('applies Basis bundle pricing to kern modules only', () => {
    const basis = getCitoBundle('basis');
    const result = applyCitoBundlePrices(basePrices, basis, allModules);

    // Kern modules should have bundle price spread across 3
    const expectedPerModule = Math.round((23.93 / 3) * 100) / 100; // 7.98
    const rekenCito = result.find((p) => p.moduleId === 'rekenwiskunde' && p.provider === 'cito');
    expect(rekenCito?.amountPerStudent).toBe(expectedPerModule);

    // Non-kern Cito prices should be unchanged
    const cogCito = result.find((p) => p.moduleId === 'cognitieve-capaciteiten' && p.provider === 'cito');
    expect(cogCito?.amountPerStudent).toBe(19.9);

    // DIA prices should be unchanged
    const rekenDia = result.find((p) => p.moduleId === 'rekenwiskunde' && p.provider === 'dia');
    expect(rekenDia?.amountPerStudent).toBe(3.36);
  });

  it('applies Plus bundle pricing to kern + TVZ + SEF', () => {
    const plus = getCitoBundle('plus');
    const result = applyCitoBundlePrices(basePrices, plus, allModules);

    const expectedPerModule = Math.round((34.93 / 6) * 100) / 100; // 5.82
    const tvzCito = result.find((p) => p.moduleId === 'taalverzorging' && p.provider === 'cito');
    expect(tvzCito?.amountPerStudent).toBe(expectedPerModule);

    // Cognitieve-capaciteiten is NOT in Plus bundle
    const cogCito = result.find((p) => p.moduleId === 'cognitieve-capaciteiten' && p.provider === 'cito');
    expect(cogCito?.amountPerStudent).toBe(19.9);
  });

  it('does not apply bundle if not all required modules are selected', () => {
    const basis = getCitoBundle('basis');
    const partialModules = ['rekenwiskunde', 'nederlands']; // missing engels
    const result = applyCitoBundlePrices(basePrices, basis, partialModules);

    // Should return unchanged prices
    const rekenCito = result.find((p) => p.moduleId === 'rekenwiskunde' && p.provider === 'cito');
    expect(rekenCito?.amountPerStudent).toBe(4.5);
  });

  it('sets sourceLabel indicating bundle', () => {
    const basis = getCitoBundle('basis');
    const result = applyCitoBundlePrices(basePrices, basis, allModules);
    const rekenCito = result.find((p) => p.moduleId === 'rekenwiskunde' && p.provider === 'cito');
    expect(rekenCito?.sourceLabel).toContain('Basis bundel');
  });
});

describe('applyContractPeriodToResult', () => {
  const mockResult: ComparisonResult = {
    modules: [
      {
        moduleId: 'rekenwiskunde',
        moduleName: 'Reken-Wiskunde',
        moduleCategory: 'leerlingvolgsysteem',
        providers: {
          cito: {
            pricePerStudent: 4.5,
            totalCost: 4500,
            studentCount: 1000,
            priceRecord: makePriceRecord('rekenwiskunde', 'cito', 4.5),
            breakdown: [],
          },
          dia: {
            pricePerStudent: 3.36,
            totalCost: 3360,
            studentCount: 1000,
            priceRecord: makePriceRecord('rekenwiskunde', 'dia', 3.36),
            breakdown: [],
          },
          jij: null,
          saqi: null,
        },
      },
    ],
    totals: { cito: 4500, dia: 3360, jij: 0, saqi: 0 },
    differences: { citoVsDia: 1140, citoVsJij: null, citoVsSaqi: null },
    diaPackageResult: null,
  };

  it('returns unchanged result for annual period', () => {
    const result = applyContractPeriodToResult(mockResult, 'annual');
    expect(result).toBe(mockResult);
  });

  it('applies 3-year factor (2.85x for Cito, 3x for others)', () => {
    const result = applyContractPeriodToResult(mockResult, 'three-year');

    expect(result.totals.cito).toBe(Math.round(4500 * 2.85 * 100) / 100);
    expect(result.totals.dia).toBe(Math.round(3360 * 3 * 100) / 100);

    // Per-module totals also adjusted
    const citoMod = result.modules[0].providers.cito;
    expect(citoMod?.totalCost).toBe(Math.round(4500 * 2.85 * 100) / 100);
    const diaMod = result.modules[0].providers.dia;
    expect(diaMod?.totalCost).toBe(Math.round(3360 * 3 * 100) / 100);
  });

  it('applies 3-year+DUO factor (2.70x for Cito)', () => {
    const result = applyContractPeriodToResult(mockResult, 'three-year-duo');

    expect(result.totals.cito).toBe(Math.round(4500 * 2.70 * 100) / 100);
    expect(result.totals.dia).toBe(Math.round(3360 * 3 * 100) / 100);
  });

  it('recalculates differences after period adjustment', () => {
    const result = applyContractPeriodToResult(mockResult, 'three-year');

    const expectedCito = Math.round(4500 * 2.85 * 100) / 100;
    const expectedDia = Math.round(3360 * 3 * 100) / 100;
    expect(result.differences.citoVsDia).toBe(expectedCito - expectedDia);
  });

  it('preserves null providers', () => {
    const result = applyContractPeriodToResult(mockResult, 'three-year');
    expect(result.modules[0].providers.jij).toBeNull();
  });
});

describe('cito-bundles data', () => {
  it('has three bundle types', () => {
    expect(CITO_BUNDLES).toHaveLength(3);
  });

  it('individual bundle has no price', () => {
    const individual = getCitoBundle('individual');
    expect(individual.pricePerStudent).toBeNull();
    expect(individual.includedModuleIds).toHaveLength(0);
  });

  it('basis bundle includes 3 kern modules', () => {
    const basis = getCitoBundle('basis');
    expect(basis.includedModuleIds).toEqual(['rekenwiskunde', 'nederlands', 'engels']);
    expect(basis.pricePerStudent).toBe(23.93);
  });

  it('plus bundle includes 5 modules', () => {
    const plus = getCitoBundle('plus');
    expect(plus.includedModuleIds).toHaveLength(6);
    expect(plus.pricePerStudent).toBe(34.93);
  });

  it('getContractPeriodConfig returns correct factors', () => {
    expect(getContractPeriodConfig('annual').citoFactor).toBe(1);
    expect(getContractPeriodConfig('three-year').citoFactor).toBe(2.85);
    expect(getContractPeriodConfig('three-year-duo').citoFactor).toBe(2.70);
    expect(getContractPeriodConfig('three-year').otherFactor).toBe(3);
  });
});
