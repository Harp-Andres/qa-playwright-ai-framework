import { describe, expect, it } from 'vitest';
import type { APIResponse } from '@playwright/test';
import { ApiResponseError, readJson } from './readJson';

function responseOf(partial: {
  ok: boolean;
  status: number;
  url: string;
  body: unknown;
}): APIResponse {
  return {
    ok: () => partial.ok,
    status: () => partial.status,
    url: () => partial.url,
    json: async () => partial.body,
  } as APIResponse;
}

describe('readJson', () => {
  it('returns the parsed body when the response is successful', async () => {
    const body = await readJson<{ id: number }>(
      responseOf({ ok: true, status: 200, url: 'http://127.0.0.1/products/1', body: { id: 1 } }),
    );
    expect(body.id).toBe(1);
  });

  it('throws ApiResponseError when the response is not ok', async () => {
    await expect(
      readJson(
        responseOf({ ok: false, status: 404, url: 'http://127.0.0.1/products/9', body: {} }),
      ),
    ).rejects.toBeInstanceOf(ApiResponseError);
  });
});
