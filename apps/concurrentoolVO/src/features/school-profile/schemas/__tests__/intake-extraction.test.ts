import { describe, it, expect } from 'vitest';
import { IntakeExtractionSchemaV2 } from '@/features/school-profile/schemas/intake-extraction.schema';

describe('IntakeExtractionSchemaV2', () => {
  const baseV1Data = {
    levels: ['havo', 'vwo'] as const,
    studentCountsPerLevel: { havo: 200, vwo: 150 },
    selectedModules: ['rekenwiskunde'] as const,
    moduleSetups: [
      {
        moduleId: 'rekenwiskunde' as const,
        currentProvider: 'dia' as const,
        pricePerStudent: 5.2,
      },
    ],
    unsureAbout: ['Welke leerjaren precies?'],
  };

  it('parses object with contactPersonen array', () => {
    const data = {
      ...baseV1Data,
      contactPersonen: [
        { naam: 'Jan de Vries', rol: 'Toetscoordinator', dmuPositie: 'coordinator' as const, email: 'jan@school.nl' },
        { naam: 'Petra Jansen' },
      ],
    };
    const result = IntakeExtractionSchemaV2.parse(data);
    expect(result.contactPersonen).toHaveLength(2);
    expect(result.contactPersonen[0].naam).toBe('Jan de Vries');
    expect(result.contactPersonen[0].dmuPositie).toBe('coordinator');
    expect(result.contactPersonen[1].rol).toBeUndefined();
  });

  it('parses actiePunten array', () => {
    const data = {
      ...baseV1Data,
      actiePunten: [
        { wat: 'Offerte opsturen', wanneer: 'volgende week', verantwoordelijke: 'Account Manager' },
        { wat: 'Demo inplannen' },
      ],
    };
    const result = IntakeExtractionSchemaV2.parse(data);
    expect(result.actiePunten).toHaveLength(2);
    expect(result.actiePunten[0].wat).toBe('Offerte opsturen');
    expect(result.actiePunten[1].wanneer).toBeUndefined();
  });

  it('parses pipelineSignaal enum values', () => {
    const signals = ['interesse', 'twijfel', 'afwijzing', 'concurrent-switch', 'verlenging', 'neutraal'] as const;
    for (const signal of signals) {
      const data = { ...baseV1Data, pipelineSignaal: signal };
      const result = IntakeExtractionSchemaV2.parse(data);
      expect(result.pipelineSignaal).toBe(signal);
    }
  });

  it('preserves backward compatibility with v1 fields', () => {
    // V1 data without any V2 fields should parse with defaults
    const result = IntakeExtractionSchemaV2.parse(baseV1Data);
    expect(result.levels).toEqual(['havo', 'vwo']);
    expect(result.selectedModules).toEqual(['rekenwiskunde']);
    expect(result.moduleSetups).toHaveLength(1);
    expect(result.unsureAbout).toHaveLength(1);
    // V2 defaults
    expect(result.contactPersonen).toEqual([]);
    expect(result.actiePunten).toEqual([]);
    expect(result.pipelineSignaal).toBeUndefined();
  });

  it('accepts moduleId leer-werkhouding', () => {
    const data = {
      ...baseV1Data,
      selectedModules: ['leer-werkhouding'] as const,
      moduleSetups: [
        {
          moduleId: 'leer-werkhouding' as const,
          currentProvider: 'geen' as const,
          pricePerStudent: null,
        },
      ],
    };
    const result = IntakeExtractionSchemaV2.parse(data);
    expect(result.selectedModules).toContain('leer-werkhouding');
    expect(result.moduleSetups[0].moduleId).toBe('leer-werkhouding');
  });

  it('accepts moduleIds frans, duits, spaans', () => {
    const taalModules = ['frans', 'duits', 'spaans'] as const;
    const data = {
      ...baseV1Data,
      selectedModules: [...taalModules],
      moduleSetups: taalModules.map((moduleId) => ({
        moduleId,
        currentProvider: 'geen' as const,
        pricePerStudent: null,
      })),
    };
    const result = IntakeExtractionSchemaV2.parse(data);
    for (const moduleId of taalModules) {
      expect(result.selectedModules).toContain(moduleId);
    }
    expect(result.moduleSetups).toHaveLength(3);
  });

  it('rejects unknown moduleId (e.g. biologie)', () => {
    const data = {
      ...baseV1Data,
      selectedModules: ['biologie'],
      moduleSetups: [
        {
          moduleId: 'biologie',
          currentProvider: 'geen',
          pricePerStudent: null,
        },
      ],
    };
    expect(() => IntakeExtractionSchemaV2.parse(data)).toThrow();
  });

  it('handles optional fields gracefully (no contactPersonen, no pipelineSignaal)', () => {
    const data = {
      ...baseV1Data,
      actiePunten: [{ wat: 'Bel terug' }],
      // no contactPersonen, no pipelineSignaal
    };
    const result = IntakeExtractionSchemaV2.parse(data);
    expect(result.contactPersonen).toEqual([]);
    expect(result.pipelineSignaal).toBeUndefined();
    expect(result.actiePunten).toHaveLength(1);
  });
});
