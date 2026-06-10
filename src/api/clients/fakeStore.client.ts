import { expect, type APIRequestContext } from '@playwright/test';
import { getEnvConfig } from '../../config/env';

interface Product {
  id: number;
  title: string;
  price: number;
}

export class FakeStoreClient {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(limit = 3): Promise<Product[]> {
    const env = getEnvConfig();
    const response = await this.request.get(`${env.FAKESTORE_BASE_URL}/products`, {
      params: { limit: String(limit) },
    });

    expect(response.status()).toBe(200);
    const products = (await response.json()) as Product[];
    expect(products.length).toBeGreaterThan(0);
    return products;
  }

  async getProductById(id: number): Promise<Product> {
    const env = getEnvConfig();
    const response = await this.request.get(`${env.FAKESTORE_BASE_URL}/products/${id}`);

    expect(response.status()).toBe(200);
    const product = (await response.json()) as Product;
    expect(product.id).toBe(id);
    expect(product.title.length).toBeGreaterThan(0);
    return product;
  }
}
