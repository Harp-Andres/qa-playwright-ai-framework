import { test, expect } from '../fixtures/test.fixture';

test.describe('Fake Store - Resources', () => {
  test('retrieves a product list and validates key fields', async ({ fakeStoreClient }) => {
    const products = await fakeStoreClient.getProducts(3);
    expect(products).toHaveLength(3);
    expect(products[0]?.price).toBeGreaterThan(0);
  });

  test('retrieves product by id and validates business fields', async ({ fakeStoreClient }) => {
    const product = await fakeStoreClient.getProductById(1);
    expect(product.title.toLowerCase()).toContain('backpack');
    expect(product.price).toBeGreaterThan(0);
  });
});
