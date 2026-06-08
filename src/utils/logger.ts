import pino from 'pino';
import { getEnvConfig } from '../config/env';

const env = getEnvConfig();

export const logger = pino({
  level: env.LOG_LEVEL,
});
