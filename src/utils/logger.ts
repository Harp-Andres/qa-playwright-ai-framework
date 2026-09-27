import pino from 'pino';
import { getEnvConfig } from '../config/env';

let cachedLogger: pino.Logger | null = null;

export function createLogger(level: string): pino.Logger {
  return pino({ level });
}

export function getLogger(): pino.Logger {
  if (!cachedLogger) {
    const env = getEnvConfig();
    cachedLogger = createLogger(env.LOG_LEVEL);
  }
  return cachedLogger;
}

/** Shared framework logger (lazy-loaded from env). */
export const logger: pino.Logger = new Proxy({} as pino.Logger, {
  get(_target, prop) {
    const instance = getLogger();
    const value = instance[prop as keyof pino.Logger];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
