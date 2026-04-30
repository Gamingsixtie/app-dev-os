import { describe, it, expect } from 'vitest';
import { enrichModuleSetupsWithDefaultPrices } from '../ai-intake';
import type { IntakeExtractionV2 } from '@/features/school-profile/schemas/intake-extraction.schema';

/**
 * Helper to create a minimal moduleSetup entry for testing.
 * Uses `as any` for providers not in the Zod schema enum (e.g. 'saqi')
 * since we're testing the enrichment function, not the schema validation.
 */
function makeSetup(
  moduleId: string,
  currentProvider: string,
  pricePerStudent: number | null = null,
): IntakeExtractionV2['moduleSetups'][number] {
  return { moduleId, currentProvider, pricePerStudent } as IntakeExtractionV2['moduleSetups'][number];
}

describe('enrichModuleSetupsWithDefaultPrices', () => {
  // ─── 1. DIA Nederlands zonder prijs → pakketprijs €5,84 ───────────────────
  it('enriches DIA Nederlands without price to €5.84 (Pakket NE)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('nederlands', 'dia'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(5.84);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 2. DIA Engels zonder prijs → pakketprijs €5,84 ───────────────────────
  it('enriches DIA Engels without price to €5.84 (Pakket EN)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('engels', 'dia'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(5.84);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 3. DIA Rekenwiskunde zonder prijs → individuele prijs €3,36 ──────────
  it('enriches DIA Rekenwiskunde without price to €3.36 (individual default)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('rekenwiskunde', 'dia'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(3.36);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 4. DIA Taalverzorging zonder prijs → individuele prijs €3,36 ─────────
  it('enriches DIA Taalverzorging without price to €3.36 (Diaspel los)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('taalverzorging', 'dia'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(3.36);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 5. DIA Cognitieve capaciteiten zonder prijs → €9,75 (NSCCT) ─────────
  it('enriches DIA Cognitieve capaciteiten without price to €9.75 (NSCCT)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('cognitieve-capaciteiten', 'dia'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(9.75);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 6. JIJ! module zonder prijs → €9,34 (default) ───────────────────────
  it('enriches JIJ! module without price to €9.34 (default)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('rekenwiskunde', 'jij'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(9.34);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 7. JIJ! sociaal-emotioneel zonder prijs → €0 (basislicentie) ────────
  it('enriches JIJ! sociaal-emotioneel without price to €0 (basislicentie)', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('sociaal-emotioneel', 'jij'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(0);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 8. SAQI sociaal-emotioneel zonder prijs → €3,50 ─────────────────────
  it('enriches SAQI sociaal-emotioneel without price to €3.50', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('sociaal-emotioneel', 'saqi'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(3.50);
    expect(result[0].priceSource).toBe('default');
  });

  // ─── 9. Prijs uit intake (niet null) → wordt NIET overschreven ───────────
  it('does not overwrite price when intake extracted a price', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('nederlands', 'dia', 4.50),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBe(4.50);
    expect(result[0].priceSource).toBe('intake');
    expect(result[0].priceContext).toBeUndefined();
  });

  // ─── 10. DIA Nederlands priceContext bevat pakketnaam ─────────────────────
  it('includes priceContext with package label for DIA Nederlands', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('nederlands', 'dia'),
    ]);
    expect(result[0].priceContext).toBe('Pakket NE (lezen + woordenschat)');
  });

  // ─── 11. Onbekende provider → geen enrichment, priceSource = 'intake' ────
  it('returns priceSource "intake" for unknown provider without enrichment', () => {
    const result = enrichModuleSetupsWithDefaultPrices([
      makeSetup('nederlands', 'overig'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].pricePerStudent).toBeNull();
    expect(result[0].priceSource).toBe('intake');
    expect(result[0].priceContext).toBeUndefined();
  });
});
