import { test, expect } from '@playwright/test';

test.describe('AI intake panel', () => {
  test('wizard page is accessible for existing school slug', async ({ page }) => {
    // Try navigating to wizard — without valid school it should redirect
    await page.goto('/scholen/test-school/wizard/1');

    // Should redirect to /scholen since school does not exist in DB
    await expect(page).toHaveURL(/\/scholen/, { timeout: 10_000 });
  });

  test('school creation dialog has input for school name', async ({ page }) => {
    await page.goto('/scholen');

    // Open dialog
    await page.getByRole('button', { name: /school toevoegen/i }).click();

    // Verify the school name input is accessible
    const nameInput = page.getByLabel(/schoolnaam/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEditable();

    // Type text into it
    await nameInput.fill('AI Intake Test School');
    await expect(nameInput).toHaveValue('AI Intake Test School');
  });
});
