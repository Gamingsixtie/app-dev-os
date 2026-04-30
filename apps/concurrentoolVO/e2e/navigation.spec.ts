import { test, expect } from '@playwright/test';

test.describe('Tab navigation and routing', () => {
  test('root URL redirects to /scholen', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/scholen/);
  });

  test('school overview page loads at /scholen', async ({ page }) => {
    await page.goto('/scholen');
    await expect(page).toHaveURL(/\/scholen/);

    // Should show the "School toevoegen" button
    await expect(page.getByRole('button', { name: /school toevoegen/i })).toBeVisible();
  });

  test('auth bypass is active (no redirect to /login)', async ({ page }) => {
    await page.goto('/scholen');

    // Should NOT be on login page
    await expect(page).not.toHaveURL(/\/login/);

    // DEV MODE banner should be visible
    await expect(page.getByText(/dev mode/i)).toBeVisible();
  });

  test('login page is accessible directly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('non-existent school slug redirects to overview', async ({ page }) => {
    await page.goto('/scholen/deze-school-bestaat-niet');

    // Should redirect back to /scholen
    await expect(page).toHaveURL(/\/scholen/, { timeout: 10_000 });
  });

  test('header shows app title', async ({ page }) => {
    await page.goto('/scholen');

    // App title should be visible
    await expect(page.getByText('Cito Rekentool')).toBeVisible();
  });
});
