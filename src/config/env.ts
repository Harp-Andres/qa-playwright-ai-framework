import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const schema = z.object({
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

let cachedEnv: z.infer<typeof schema> | null = null;

export const getEnvConfig = (): z.infer<typeof schema> => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const target = process.env.TEST_ENV ?? 'local';
  loadEnv({ path: `.env.${target}`, override: true, quiet: true });
  const result = schema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Environment validation failed: ${JSON.stringify(result.error.format(), null, 2)}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
};
