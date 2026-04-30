import { describe, it, expect } from 'vitest';
import { parseAdviceFromText } from '@/lib/ai-wizard';

describe('parseAdviceFromText', () => {
  it('parses valid JSON string with all WizardAdviceResult fields', () => {
    const json = JSON.stringify({
      samenvatting: 'Cito Basis biedt vergelijkbare dekking als DIA Pakket NE.',
      matchingUitleg: 'De Basis-bundel dekt rekenen, Nederlands en Engels.',
      aanbevolenCitoBundel: 'basis',
      adviezen: [
        {
          titel: 'Competitief op prijs',
          tekst: 'Cito Basis kost EUR 23,93/lln versus DIA EUR 18,13/lln.',
          type: 'prijs',
        },
      ],
      dmuStrategie: {
        coordinator: 'Benadruk de geintegreerde rapportage.',
        mt: 'Focus op de 3-jarige contractkorting.',
      },
    });

    const result = parseAdviceFromText(json);

    expect(result.samenvatting).toBe('Cito Basis biedt vergelijkbare dekking als DIA Pakket NE.');
    expect(result.matchingUitleg).toBe('De Basis-bundel dekt rekenen, Nederlands en Engels.');
    expect(result.aanbevolenCitoBundel).toBe('basis');
    expect(result.adviezen).toHaveLength(1);
    expect(result.adviezen[0].type).toBe('prijs');
    expect(result.dmuStrategie).toBeDefined();
    expect(result.dmuStrategie!['coordinator']).toContain('rapportage');
  });

  it('parses JSON wrapped in markdown code fences', () => {
    const text = '```json\n{"samenvatting":"Test","matchingUitleg":"Uitleg","aanbevolenCitoBundel":"plus","adviezen":[]}\n```';

    const result = parseAdviceFromText(text);

    expect(result.samenvatting).toBe('Test');
    expect(result.matchingUitleg).toBe('Uitleg');
    expect(result.aanbevolenCitoBundel).toBe('plus');
    expect(result.adviezen).toEqual([]);
  });

  it('returns fallback result with empty adviezen for invalid text', () => {
    const result = parseAdviceFromText('Dit is geen JSON maar gewone tekst.');

    expect(result.samenvatting).toBe('');
    expect(result.matchingUitleg).toBe('');
    expect(result.aanbevolenCitoBundel).toBe('individual');
    expect(result.adviezen).toEqual([]);
  });
});
