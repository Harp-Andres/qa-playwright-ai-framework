import type { APIRequestContext } from '@playwright/test';
import { readJson } from '../http/readJson';

export interface Product {
  id: number;
  title: string;
  price: number;
}

export class FakeStoreClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  async getProducts(limit = 3): Promise<Product[]> {
    const response = await this.request.get(`${this.baseUrl}/products`, {
      params: { limit: String(limit) },
    });
    return readJson<Product[]>(response);
  }

  async getProductById(id: number): Promise<Product> {
    const response = await this.request.get(`${this.baseUrl}/products/${id}`);
    return readJson<Product>(response);
  }
}
