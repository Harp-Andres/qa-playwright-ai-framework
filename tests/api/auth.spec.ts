import { test, expect } from '../fixtures/test.fixture';

test.describe('ReqRes - Authentication', () => {
  test('authenticates and validates non-empty token', async ({ reqresClient }) => {
    const token = await reqresClient.loginAndGetToken();
    expect(token.length).toBeGreaterThan(8);
  });
});
