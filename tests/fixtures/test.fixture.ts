import { test as base, type TestInfo } from '@playwright/test';
import { LoginPage } from '../../src/web/pages/login.page';
import { InventoryPage } from '../../src/web/pages/inventory.page';
import { CheckoutPage } from '../../src/web/pages/checkout.page';
import { ReqResClient } from '../../src/api/clients/reqres.client';
import { FakeStoreClient } from '../../src/api/clients/fakeStore.client';
import { FailureAnalyzer } from '../../src/ai/failure/failureAnalyzer';
import { SuggestionRegistry } from '../../src/ai/suggestions/suggestionRegistry';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  checkoutPage: CheckoutPage;
  reqresClient: ReqResClient;
  fakeStoreClient: FakeStoreClient;
  suggestionRegistry: SuggestionRegistry;
};

const recordFailure = async (testInfo: TestInfo, suggestionRegistry: SuggestionRegistry): Promise<void> => {
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

  suggestionRegistry.addFailure(FailureAnalyzer.analyze(testInfo, metadata));
};

export const test = base.extend<Fixtures>({
  suggestionRegistry: async ({ request: _request }, use) => {
    const registry = new SuggestionRegistry();
    await use(registry);
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
    await use(new ReqResClient(request));
  },

  fakeStoreClient: async ({ request }, use) => {
    await use(new FakeStoreClient(request));
  },
});

test.afterEach(async ({ suggestionRegistry }, testInfo) => {
  await recordFailure(testInfo, suggestionRegistry);
});

export { expect } from '@playwright/test';
