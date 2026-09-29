import { defineConfig, devices } from '@playwright/test';
import { getEnvConfig } from './src/config/env';

const env = getEnvConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  workers: env.PARALLEL_WORKERS,
  globalTeardown: './src/ai/teardown/aiTeardown',
  webServer: {
    command: 'node tests/mocks/mock-api-server.cjs',
    url: 'http://127.0.0.1:4010/health',
    reuseExistingServer: true,
    timeout: 10_000,
  },
  timeout: 60_000,
  outputDir: 'test-results',
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['blob', { outputDir: 'blob-report' }],
  ],
  use: {
    baseURL: env.SAUCE_BASE_URL,
    ignoreHTTPSErrors: true,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
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
