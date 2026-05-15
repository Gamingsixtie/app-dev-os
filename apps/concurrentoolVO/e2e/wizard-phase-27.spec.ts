/**
 * Phase 27 Wave 0 scaffold — R3..R10 wizard happy-path E2E.
 *
 * Skipped placeholder; full implementation lands incrementally across
 * Plans 27-05 (Step 1 schoolsoort + groeitrajectorie), 27-06 (Step 2
 * huidig-gebruik), 27-07 (Step 3 Basis + Extra), 27-08 (Step 4
 * pijnpunten + tijd), 27-09 (Step 5 upsell).
 */
import { test } from '@playwright/test';

test.describe('Wizard Phase 27 happy-path (R3-R10)', () => {
  test.skip('completes the full 5-step wizard for a bestaande-klant scenario', async () => {
    // TODO(Plans 27-05..27-09): implement once each wizard step ships
    // Step 1: pick Dakpanklas variant + groei trajectorie
    // Step 2: enter huidig-gebruik per niveau (Cito + DIA mix)
    // Step 3: confirm Basisvaardigheden + add Burgerschap / Digi-gel
    // Step 4: dubbel-check, vul pijnpunt "te traag" in, set tijdscomponent
    // Step 5: dubbel-check, accept Cito Basis → Plus upsell
    // Assert: comparison summary shows R10 upsell delta + R9 pijnpunt match
  });
});
