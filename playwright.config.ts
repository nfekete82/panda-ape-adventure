import { defineConfig } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8080';
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
