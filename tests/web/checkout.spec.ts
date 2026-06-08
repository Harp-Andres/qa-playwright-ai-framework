import { test } from '../fixtures/test.fixture';
import { getEnvConfig } from '../../src/config/env';

test.describe('SauceDemo - Checkout Flow', () => {
  test('adds item to cart and completes checkout', async ({ loginPage, inventoryPage, checkoutPage }) => {
    const env = getEnvConfig();

    await loginPage.open();
    await loginPage.login(env.SAUCE_USERNAME, env.SAUCE_PASSWORD);
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.openCartAndValidateCount('1');

    await checkoutPage.complete({
      firstName: 'QA',
      lastName: 'Automation',
      postalCode: '110111',
    });
    await checkoutPage.assertSuccess();
  });
});
