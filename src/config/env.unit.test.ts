import { describe, expect, it } from 'vitest';
import { parseEnvConfig } from './env';

const validEnv = {
  TEST_ENV: 'qa',
  SAUCE_BASE_URL: 'https://www.saucedemo.com',
  SAUCE_USERNAME: 'standard_user',
  SAUCE_PASSWORD: 'secret',
  REQRES_BASE_URL: 'http://127.0.0.1:4010',
  REQRES_EMAIL: 'user@example.com',
  REQRES_PASSWORD: 'password',
  FAKESTORE_BASE_URL: 'http://127.0.0.1:4010',
  LOG_LEVEL: 'debug',
  PARALLEL_WORKERS: '2',
};

describe('parseEnvConfig', () => {
  it('parses a valid environment', () => {
    const config = parseEnvConfig(validEnv);
    expect(config.TEST_ENV).toBe('qa');
    expect(config.PARALLEL_WORKERS).toBe(2);
    expect(config.LOG_LEVEL).toBe('debug');
  });

  it('applies defaults for optional fields', () => {
    const required = { ...validEnv };
    delete (required as Partial<typeof validEnv>).LOG_LEVEL;
    delete (required as Partial<typeof validEnv>).PARALLEL_WORKERS;
    delete (required as Partial<typeof validEnv>).TEST_ENV;
    const config = parseEnvConfig(required);
    expect(config.TEST_ENV).toBe('local');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.PARALLEL_WORKERS).toBe(4);
  });

  it('throws when required URLs are missing', () => {
    expect(() => parseEnvConfig({})).toThrow(/Environment validation failed/);
  });
});
