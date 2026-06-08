import { defineConfig, devices } from '@playwright/test';
import { getEnvConfig } from './src/config/env';

const env = getEnvConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  workers: env.PARALLEL_WORKERS,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['html', { open: 'never' }], ['list'], ['junit', { outputFile: 'test-results/results.xml' }]],
  use: {
    baseURL: env.SAUCE_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
