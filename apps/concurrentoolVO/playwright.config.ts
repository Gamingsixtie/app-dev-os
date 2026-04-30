import { defineConfig, devices } from '@playwright/test';

// E2E tests run with VITE_SKIP_AUTH=true (no Supabase dependency).
// Full CRUD flows (school creation, wizard completion, export generation)
// require a Supabase test environment — currently only routing, auth bypass,
// and dialog UI are covered. Add Supabase test env to CI for full coverage.
//
// Use port 4173 for E2E to avoid conflicts with dev server on 3000
const E2E_PORT = 4173;
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx vite --port ${E2E_PORT} --strictPort`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SKIP_AUTH: 'true',
    },
  },
});
