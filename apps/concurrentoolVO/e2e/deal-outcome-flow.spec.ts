import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * Phase 28 happy-path Playwright e2e.
 *
 * Most browser-driven tests in this file require a seeded Supabase test
 * environment with at least:
 *   - 1 school with onderwijsvisie + niveau set ("Test School A")
 *   - 1 school without onderwijsvisie ("Test School No Cohort")
 *   - 1 school with an existing open deal ("Test School B")
 *
 * These fixtures are NOT yet present in CI. Until they are, those tests
 * skip gracefully when `E2E_DEAL_FIXTURES` is not set. The grep-gate test
 * (R1 compile-time check) always runs because it's a pure repo-level check.
 *
 * Auth is bypassed via VITE_SKIP_AUTH=true (see playwright.config.ts).
 */

const HAS_FIXTURES = !!process.env.E2E_DEAL_FIXTURES;

test.describe('Phase 28 — deal-outcome flow happy path', () => {
  test.skip(!HAS_FIXTURES, 'Requires seeded deal-outcome fixtures (E2E_DEAL_FIXTURES=1)');

  test('R1+R2: register a won deal via DealAfsluitenDialog', async ({ page }) => {
    await page.goto('/scholen');
    await page.getByText('Test School A').click();

    // Open the Uitkomst-tab
    await page.getByRole('link', { name: /uitkomst/i }).click();
    await expect(page.getByText(/nog geen deal vastgelegd/i)).toBeVisible();

    // Open DealAfsluitenDialog
    await page.getByRole('button', { name: /deal afsluiten/i }).click();
    await expect(page.getByText(/hoe is de deal afgelopen/i)).toBeVisible();

    // Choose "Gewonnen"
    await page.getByLabel(/gewonnen/i).check();
    await expect(page.getByRole('button', { name: /deal als gewonnen vastleggen/i })).toBeVisible();

    // Fill the date + submit
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);
    await page.getByRole('button', { name: /deal als gewonnen vastleggen/i }).click();

    // Verify the record renders
    await expect(page.getByText(/gewonnen/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('R3: per-deal discount recalculates the Vergelijking-tab', async ({ page }) => {
    await page.goto('/scholen/test-school-b/uitkomst');

    // Add a discount row
    await page.getByRole('button', { name: /korting toevoegen/i }).click();
    await page.locator('input[placeholder*="orting"]').first().fill('10');
    await page.getByRole('button', { name: /opslaan/i }).click();

    // Switch to the comparison tab; banner should appear
    await page.getByRole('link', { name: /vergelijking/i }).click();
    await expect(page.getByText(/inclusief deal-kortingen/i)).toBeVisible();
  });

  test('R4: dashboard reflects deal KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /marktdashboard/i })).toBeVisible();
    await expect(page.getByText(/totaal deals/i)).toBeVisible();
    await expect(page.getByText(/win-rate/i)).toBeVisible();
  });

  test('R5: cohort prediction shows missing-features fallback', async ({ page }) => {
    await page.goto('/scholen/test-school-no-cohort/uitkomst');
    await expect(page.getByText(/onvoldoende schoolgegevens/i)).toBeVisible();
  });
});

test.describe('Phase 28 — repo-level grep gate', () => {
  test('R1 grep gate: 0 non-comment LostDealDialog references in src/', () => {
    // Pure repo-level check — does not need a running browser/fixtures.
    // Filters out the playwright/helpers folder + test files + comment-only mentions.
    let output: string;
    try {
      output = execSync(
        'grep -rn "LostDealDialog" src/ --include="*.ts" --include="*.tsx"',
        { cwd: process.cwd() },
      ).toString();
    } catch (err) {
      // grep returns exit 1 when there are no matches — treat as empty
      const e = err as { stdout?: Buffer; status?: number };
      if (e.status === 1) {
        output = (e.stdout ?? Buffer.from('')).toString();
      } else {
        throw err;
      }
    }

    // Remove test/__tests__ hits + comment lines.
    const lines = output
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => !l.includes('__tests__'))
      .filter((l) => !l.includes('.test.'))
      .filter((l) => {
        // Drop pure-comment hits (// ... or * ... or /* ...).
        const afterLineNo = l.replace(/^[^:]+:\d+:\s*/, '');
        return !/^(\/\/|\*|\/\*)/.test(afterLineNo);
      });

    expect(lines, `Unexpected LostDealDialog references:\n${lines.join('\n')}`).toEqual([]);
  });
});
