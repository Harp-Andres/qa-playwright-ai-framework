import { test as base, type TestInfo } from '@playwright/test';
import { LoginPage } from '../../src/web/pages/login.page';
import { InventoryPage } from '../../src/web/pages/inventory.page';
import { CheckoutPage } from '../../src/web/pages/checkout.page';
import { ReqResClient } from '../../src/api/clients/reqres.client';
import { FakeStoreClient } from '../../src/api/clients/fakeStore.client';
import { FailureAnalyzer } from '../../src/ai/failure/failureAnalyzer';
import { SuggestionRegistry } from '../../src/ai/suggestions/suggestionRegistry';
import { getEnvConfig } from '../../src/config/env';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  checkoutPage: CheckoutPage;
  reqresClient: ReqResClient;
  fakeStoreClient: FakeStoreClient;
  suggestionRegistry: SuggestionRegistry;
};

const failureAnalyzer = new FailureAnalyzer();

const recordFailure = async (
  testInfo: TestInfo,
  suggestionRegistry: SuggestionRegistry,
): Promise<void> => {
  if (testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const metadata = {
    project: testInfo.project.name,
    file: testInfo.file,
    retry: testInfo.retry,
    durationMs: testInfo.duration,
    artifacts: testInfo.attachments.map((attachment) => attachment.name),
  };

  suggestionRegistry.addFailure(failureAnalyzer.analyze(testInfo, metadata));
};

export const test = base.extend<Fixtures>({
  // Playwright requires the first argument to use object destructuring.
  // eslint-disable-next-line no-empty-pattern
  suggestionRegistry: async ({}, use) => {
    const worker = process.env.TEST_WORKER_INDEX ?? '0';
    await use(new SuggestionRegistry(`artifacts/ai-suggestions-${worker}.json`));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  reqresClient: async ({ request }, use) => {
    const env = getEnvConfig();
    await use(
      new ReqResClient(request, {
        baseUrl: env.REQRES_BASE_URL,
        email: env.REQRES_EMAIL,
        password: env.REQRES_PASSWORD,
      }),
    );
  },

  fakeStoreClient: async ({ request }, use) => {
    const env = getEnvConfig();
    await use(new FakeStoreClient(request, env.FAKESTORE_BASE_URL));
  },
});

test.afterEach(async ({ suggestionRegistry }, testInfo) => {
  await recordFailure(testInfo, suggestionRegistry);
});

export { expect } from '@playwright/test';
