import type { APIResponse } from '@playwright/test';

export class ApiResponseError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'ApiResponseError';
  }
}

export async function readJson<T>(response: APIResponse): Promise<T> {
  if (!response.ok()) {
    throw new ApiResponseError(response.status(), response.url());
  }

  return (await response.json()) as T;
}
