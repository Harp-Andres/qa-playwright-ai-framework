import type { APIRequestContext } from '@playwright/test';
import { readJson } from '../http/readJson';

export interface ReqResAuthConfig {
  baseUrl: string;
  email: string;
  password: string;
}

interface ReqResLoginBody {
  token?: string;
}

export class ReqResClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly auth: ReqResAuthConfig,
  ) {}

  async loginAndGetToken(): Promise<string> {
    const response = await this.request.post(`${this.auth.baseUrl}/api/login`, {
      data: {
        email: this.auth.email,
        password: this.auth.password,
      },
    });
    const body = await readJson<ReqResLoginBody>(response);

    if (!body.token) {
      throw new Error('ReqRes login response did not include a token');
    }

    return body.token;
  }
}
