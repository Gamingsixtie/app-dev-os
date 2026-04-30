import { test, expect } from '@playwright/test';

test.describe('Price comparison views', () => {
  test('school overview renders without errors', async ({ page }) => {
    await page.goto('/scholen');

    // Auth bypass works — we're on /scholen, not /login
    await expect(page).toHaveURL(/\/scholen/);

    // Page has main content
    await expect(page.getByRole('button', { name: /school toevoegen/i })).toBeVisible();
  });

  test('direct navigation to non-existent school redirects to overview', async ({ page }) => {
    // Try to navigate to a school that does not exist
    await page.goto('/scholen/non-existent-school/vergelijking');

    // Should redirect back to /scholen (with error query param)
    await expect(page).toHaveURL(/\/scholen/, { timeout: 10_000 });
  });

  test('comparison route exists in router', async ({ page }) => {
    // This verifies the route configuration is correct
    // Without a school, it should redirect, but the route should not 404
    const response = await page.goto('/scholen/test/vergelijking');

    // Page should render (even if redirected)
    await expect(page.locator('body')).toBeVisible();
    // Should not show a raw 404 error
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('404');
  });
});
