import { defineConfig } from '@playwright/test';

/**
 * Reporters used only by `playwright merge-reports`.
 * The HTML report is the official UI: it includes traces, screenshots and videos.
 * JUnit and JSON are the same run, for CI systems that consume XML or JSON.
 */
export default defineConfig({
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
});
