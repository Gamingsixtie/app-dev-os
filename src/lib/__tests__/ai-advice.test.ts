import { describe, it, expect } from 'vitest';
import { buildRetentionAdvicePayload, buildAdvicePayload } from '@/lib/ai-advice';
import type { ComparisonResult } from '@/engine/price-comparison';
import type { SchoolLevel, ModuleCurrentSetup } from '@/models/school';

// ─── Minimal mock data ──────────────────────────────────────────────────────

const mockResult: ComparisonResult = {
  modules: [
    {
      moduleId: 'rekenwiskunde',
      moduleName: 'Reken-Wiskunde',
      moduleCategory: 'leerlingvolgsysteem',
      providers: {
        cito: {
          pricePerStudent: 4.5,
          totalCost: 2025,
          studentCount: 450,
          priceRecord: {
            moduleId: 'rekenwiskunde',
            provider: 'cito',
            amountPerStudent: 4.5,
            source: 'publication',
            sourceLabel: 'Test',
            verifiedAt: new Date(),
            isPublicationPrice: true,
          },
          breakdown: [],
        },
        dia: null,
        jij: null,
        saqi: null,
      },
    },
  ],
  totals: { cito: 2025, dia: 0, jij: 0, saqi: 0 },
  differences: { citoVsDia: null, citoVsJij: null, citoVsSaqi: null },
  diaPackageResult: null,
};

const mockLevels: SchoolLevel[] = ['havo'];
const mockStudentCounts: Partial<Record<SchoolLevel, Record<number, number>>> = {
  havo: { 1: 150, 2: 150, 3: 150 },
};
const mockSelectedModules = ['rekenwiskunde'];
const mockModuleSetups: ModuleCurrentSetup[] = [
  { moduleId: 'rekenwiskunde', currentProvider: 'cito-oud', pricePerStudent: null },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('buildRetentionAdvicePayload', () => {
  it('returns payload with scenarioType C', () => {
    const result = buildRetentionAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
    );
    expect(result.scenarioType).toBe('C');
  });

  it('includes schoolplanOpportunities array (empty when not provided)', () => {
    const result = buildRetentionAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
    );
    expect(result.schoolplanOpportunities).toEqual([]);
  });

  it('includes migrationContext with platformUpgradeNextYear true', () => {
    const result = buildRetentionAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
    );
    expect(result.migrationContext).toBeDefined();
    expect(result.migrationContext.platformUpgradeNextYear).toBe(true);
  });

  it('spreads base payload from buildAdvicePayload', () => {
    const base = buildAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
    );
    const result = buildRetentionAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
    );
    expect(result.comparisonData).toEqual(base.comparisonData);
    expect(result.schoolProfile).toEqual(base.schoolProfile);
    expect(result.differentiators).toEqual(base.differentiators);
  });

  it('passes schoolplanOpportunities when provided', () => {
    const opportunities = [
      { moduleId: 'rekenwiskunde', kans: 'Schoolplan benoemt rekenbeleid' },
    ];
    const result = buildRetentionAdvicePayload(
      mockResult,
      mockLevels,
      mockStudentCounts,
      mockSelectedModules,
      mockModuleSetups,
      opportunities,
    );
    expect(result.schoolplanOpportunities).toEqual(opportunities);
  });
});
