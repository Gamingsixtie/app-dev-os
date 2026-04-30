import { test, expect } from '@playwright/test';

test.describe('School wizard flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scholen');
    // Verify auth is bypassed (no redirect to /login)
    await expect(page).toHaveURL(/\/scholen/);
  });

  test('school overview loads with empty state', async ({ page }) => {
    // Empty state should show prompt to create a school
    await expect(page.getByText(/schoolprofiel/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /school toevoegen/i })).toBeVisible();
  });

  test('clicking "School toevoegen" opens name dialog', async ({ page }) => {
    await page.getByRole('button', { name: /school toevoegen/i }).click();

    // Dialog should appear with "Nieuwe school" header
    await expect(page.getByText('Nieuwe school')).toBeVisible();
    await expect(page.getByLabel(/schoolnaam/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start wizard/i })).toBeVisible();
  });

  test('name dialog validates empty school name', async ({ page }) => {
    await page.getByRole('button', { name: /school toevoegen/i }).click();

    // "Start wizard" should be disabled with empty name
    const submitButton = page.getByRole('button', { name: /start wizard/i });
    await expect(submitButton).toBeDisabled();

    // Type a name and verify button becomes enabled
    await page.getByLabel(/schoolnaam/i).fill('Test School');
    await expect(submitButton).toBeEnabled();
  });

  test('name dialog can be closed with Annuleren', async ({ page }) => {
    await page.getByRole('button', { name: /school toevoegen/i }).click();
    await expect(page.getByText('Nieuwe school')).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: /annuleren/i }).click();

    // Dialog should be closed
    await expect(page.getByText('Nieuwe school')).not.toBeVisible();
  });

  test('dropdown shows "Handmatig invoeren" option', async ({ page }) => {
    // Click the dropdown arrow ("Meer opties")
    await page.getByRole('button', { name: /meer opties/i }).click();

    // Should show "Handmatig invoeren" option
    await expect(page.getByText('Handmatig invoeren')).toBeVisible();
  });
});
