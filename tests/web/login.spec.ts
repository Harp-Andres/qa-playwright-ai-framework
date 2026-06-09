import { test } from '../fixtures/test.fixture';
import { getEnvConfig } from '../../src/config/env';

test.describe('SauceDemo - Login Flow', () => {
  test('logs in successfully and validates inventory page', async ({ loginPage }) => {
    const env = getEnvConfig();
    await loginPage.open();
    await loginPage.login(env.SAUCE_USERNAME, env.SAUCE_PASSWORD);
    await loginPage.assertInventoryLoaded();
  });
});
