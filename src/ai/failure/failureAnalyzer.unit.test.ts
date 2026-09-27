import { describe, expect, it } from 'vitest';
import type { TestInfo } from '@playwright/test';
import { FailureAnalyzer } from './failureAnalyzer';

function makeTestInfo(partial: Partial<TestInfo> & { message?: string }): TestInfo {
  return {
    titlePath: ['suite', 'example test'],
    retry: 1,
    errors: partial.message ? [{ message: partial.message }] : [],
    ...partial,
  } as TestInfo;
}

describe('FailureAnalyzer', () => {
  it('classifies locator failures', () => {
    const signal = FailureAnalyzer.analyze(
      makeTestInfo({ message: 'Self-healing locator failed for username' }),
      { file: 'login.spec.ts' },
    );
    expect(signal.category).toBe('locator');
    expect(signal.retry).toBe(1);
  });

  it('classifies network failures', () => {
    const signal = FailureAnalyzer.analyze(
      makeTestInfo({ message: 'net::ERR_NAME_NOT_RESOLVED' }),
      {},
    );
    expect(signal.category).toBe('network');
  });

  it('classifies assertion failures', () => {
    const signal = FailureAnalyzer.analyze(
      makeTestInfo({ message: 'expect(received).toBe()' }),
      {},
    );
    expect(signal.category).toBe('assertion');
  });
});
