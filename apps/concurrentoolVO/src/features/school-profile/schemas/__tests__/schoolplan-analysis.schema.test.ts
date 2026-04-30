import { describe, it, expect } from 'vitest';
import {
  SchoolplanAnalysisResult,
  SchoolplanOpportunity,
  OpportunityAnnotation,
} from '../schoolplan-analysis.schema';

describe('schoolplan-analysis.schema', () => {
  it('validates a complete SchoolplanAnalysisResult', () => {
    const valid = {
      isSchoolplan: true,
      summary: 'Focus op digitale geletterdheid en rekenonderwijs.',
      themes: ['digitale geletterdheid', 'rekenonderwijs'],
      opportunities: [
        {
          theme: 'rekenonderwijs',
          citoProduct: 'Cito Volgsysteem VO - Rekenwiskunde',
          moduleId: 'rekenwiskunde',
          explanation: 'Past bij focus op rekenvaardigheden',
          conversationTip: 'Vraag naar huidige toetsresultaten',
          relevance: 'hoog',
          quote: 'Wij zetten in op versterking van het rekenonderwijs.',
          competitorVulnerabilities: [{ provider: 'dia', description: 'Beperkte VO-dekking' }],
        },
      ],
      alsoRelevant: [],
    };
    expect(() => SchoolplanAnalysisResult.parse(valid)).not.toThrow();
  });

  it('rejects invalid relevance score', () => {
    const invalid = {
      theme: 'test',
      citoProduct: 'test',
      moduleId: 'test',
      explanation: 'test',
      conversationTip: 'test',
      relevance: 'invalid',
      quote: 'test',
    };
    expect(() => SchoolplanOpportunity.parse(invalid)).toThrow();
  });

  it('validates OpportunityAnnotation', () => {
    const valid = {
      status: 'besproken',
      note: 'Besproken in gesprek 12 maart',
      updatedAt: '2026-03-23T10:00:00Z',
      updatedBy: 'user-123',
    };
    expect(() => OpportunityAnnotation.parse(valid)).not.toThrow();
  });

  it('defaults competitorVulnerabilities to empty array', () => {
    const opp = SchoolplanOpportunity.parse({
      theme: 'test',
      citoProduct: 'test',
      moduleId: 'test',
      explanation: 'test',
      conversationTip: 'test',
      relevance: 'hoog',
      quote: 'test',
    });
    expect(opp.competitorVulnerabilities).toEqual([]);
  });

  it('defaults alsoRelevant to empty array', () => {
    const result = SchoolplanAnalysisResult.parse({
      isSchoolplan: true,
      summary: 'test',
      themes: [],
      opportunities: [],
    });
    expect(result.alsoRelevant).toEqual([]);
  });
});
