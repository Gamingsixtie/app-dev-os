import type { Page } from '@playwright/test';

/**
 * Auth is bypassed via VITE_SKIP_AUTH=true in webServer env.
 * This helper verifies that auth bypass is working.
 */
export async function ensureLoggedIn(page: Page) {
  // With VITE_SKIP_AUTH=true, no login needed
  // If login page appears anyway, handle gracefully
  const isLoginPage = page.url().includes('/login');
  if (isLoginPage) {
    throw new Error('Auth wall visible despite VITE_SKIP_AUTH=true — redirected to /login');
  }
}
