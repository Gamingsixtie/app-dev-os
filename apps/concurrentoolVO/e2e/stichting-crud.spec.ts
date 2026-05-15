/**
 * Phase 27 Wave 0 scaffold — R1 Stichting CRUD E2E.
 *
 * Skipped placeholder; full happy-path implementation lands with the
 * Stichting UI in Plan 27-02 (CRUD operations) and Plan 27-03
 * (smart-suggestion + bulk link).
 */
import { test } from '@playwright/test';

test.describe('Stichting CRUD flow (R1)', () => {
  test.skip('full stichting CRUD flow (create → link schools → export → delete)', async () => {
    // TODO(Plan 27-02): implement once Stichting UI ships
    // 1. Navigate to /stichtingen
    // 2. Click "Stichting toevoegen" and create a new bestuur with naam + regio
    // 3. Open detail view, link 3 existing scholen via smart-suggestion
    // 4. Trigger CSV + PDF export and verify download
    // 5. Attempt delete with linked scholen — expect cascade-guard error
    // 6. Unlink scholen, retry delete — expect success
  });
});
