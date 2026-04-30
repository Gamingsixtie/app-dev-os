import { type Page, expect } from '@playwright/test';

/**
 * Create a school via the SchoolNameDialog and navigate to wizard step 1.
 * Assumes we are on the /scholen overview page.
 */
export async function createSchool(page: Page, name: string) {
  // Click "School toevoegen" button
  await page.getByRole('button', { name: /school toevoegen/i }).click();

  // Fill school name in dialog
  await page.getByLabel(/schoolnaam/i).fill(name);

  // Click "Start wizard" to confirm
  await page.getByRole('button', { name: /start wizard/i }).click();

  // Wait for wizard page to load
  await expect(page).toHaveURL(/\/wizard\/1/, { timeout: 10_000 });
}

/**
 * Complete the wizard with minimal valid data for a school.
 * Assumes we are already on wizard step 1.
 */
export async function completeWizard(page: Page) {
  // Step 1 (Niveaus): select at least one level checkbox
  const levelCheckbox = page.getByRole('checkbox').first();
  await levelCheckbox.check();
  await page.getByRole('button', { name: /volgende/i }).click();

  // Step 2 (Leerlingen): fill student count for the selected level
  await page.waitForURL(/\/wizard\/2/, { timeout: 10_000 });
  const studentInput = page.getByRole('spinbutton').first();
  await studentInput.fill('200');
  await page.getByRole('button', { name: /volgende/i }).click();

  // Step 3 (Modules): select at least one module
  await page.waitForURL(/\/wizard\/3/, { timeout: 10_000 });
  const moduleCheckbox = page.getByRole('checkbox').first();
  await moduleCheckbox.check();
  await page.getByRole('button', { name: /volgende/i }).click();

  // Step 4 (Situatie): select provider for the module — default is 'geen', proceed
  await page.waitForURL(/\/wizard\/4/, { timeout: 10_000 });
  await page.getByRole('button', { name: /volgende/i }).click();

  // Step 5 (Doel): select scenario and finish
  await page.waitForURL(/\/wizard\/5/, { timeout: 10_000 });
  // Click the first scenario option (Scenario A)
  const scenarioRadio = page.getByRole('radio').first();
  if (await scenarioRadio.isVisible().catch(() => false)) {
    await scenarioRadio.check();
  }
  await page.getByRole('button', { name: /voltooien|afronden|opslaan/i }).click();
}
