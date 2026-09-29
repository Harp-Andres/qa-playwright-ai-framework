import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

export const envSchema = z.object({
  TEST_ENV: z.enum(['local', 'dev', 'qa']).default('local'),
  SAUCE_BASE_URL: z.url(),
  SAUCE_USERNAME: z.string().min(1),
  SAUCE_PASSWORD: z.string().min(1),
  REQRES_BASE_URL: z.url(),
  REQRES_EMAIL: z.string().email(),
  REQRES_PASSWORD: z.string().min(1),
  FAKESTORE_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  PARALLEL_WORKERS: z.coerce.number().int().min(1).max(20).default(4),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

export function parseEnvConfig(source: Record<string, string | undefined>): EnvConfig {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Environment validation failed: ${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }

  return result.data;
}

export function resetEnvCache(): void {
  cachedEnv = null;
}

export const getEnvConfig = (): EnvConfig => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const target = process.env.TEST_ENV ?? 'local';
  loadEnv({ path: `.env.${target}`, override: false, quiet: true });
  cachedEnv = parseEnvConfig(process.env);
  return cachedEnv;
};
