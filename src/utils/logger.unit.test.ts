import { describe, expect, it } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
  it('creates a logger at the requested level', () => {
    const log = createLogger('error');
    expect(log.level).toBe('error');
  });

  it('supports child loggers with bindings', () => {
    const log = createLogger('info');
    const child = log.child({ module: 'unit-test' });
    expect(child.bindings()).toMatchObject({ module: 'unit-test' });
  });
});
