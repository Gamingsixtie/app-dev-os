/**
 * Phase 27 Wave 0 scaffold — R9 rule-based pijnpunt → Cito-voordeel.
 *
 * Skeleton placeholders for the deterministic keyword-map fallback that
 * runs in parallel with the AI matcher. Implementation lands in
 * Plan 27-08. The five pijnpunten below come straight from 27-SPEC.md
 * § R9 acceptance examples.
 */
import { describe, it } from 'vitest';

describe('painPointKeywordMap (R9 rule-based)', () => {
  it.todo('matches "rapportages zijn onduidelijk" to the rapportage-helderheid voordeel');

  it.todo('matches "te traag" to the platform-snelheid voordeel');

  it.todo('matches "te duur" to the prijs-positionering voordeel');

  it.todo('matches "missen burgerschap-rapport" to the burgerschap-module voordeel');

  it.todo('matches "support reageert niet" to the support-SLA voordeel');

  it.todo('returns an empty match list when no keywords overlap');

  it.todo('matches multiple voordelen when multiple keywords are present');
});
