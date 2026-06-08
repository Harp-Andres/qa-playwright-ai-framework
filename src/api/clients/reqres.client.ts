import { expect, type APIRequestContext } from '@playwright/test';
import { getEnvConfig } from '../../config/env';

export class ReqResClient {
  constructor(private readonly request: APIRequestContext) {}

  async loginAndGetToken(): Promise<string> {
    const env = getEnvConfig();
    const response = await this.request.post(`${env.REQRES_BASE_URL}/api/login`, {
      data: {
        email: env.REQRES_EMAIL,
        password: env.REQRES_PASSWORD,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { token?: string };
    expect(body.token, 'ReqRes token must exist').toBeTruthy();
    return body.token as string;
  }
}
