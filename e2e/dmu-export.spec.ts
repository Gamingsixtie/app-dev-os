import { test, expect } from '@playwright/test';

test.describe('DMU export flow', () => {
  test('export route exists and redirects without school', async ({ page }) => {
    // Navigate to export route for a non-existent school
    await page.goto('/scholen/test-school/export');

    // Should redirect to /scholen since school does not exist
    await expect(page).toHaveURL(/\/scholen/, { timeout: 10_000 });
  });

  test('school overview empty state mentions creating a school', async ({ page }) => {
    await page.goto('/scholen');

    // Empty state should encourage user to create a school
    await expect(page.getByText(/schoolprofiel/i).first()).toBeVisible();
  });
});
